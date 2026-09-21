package com.evyasense.layer.kafka;



import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import com.evyasense.layer.canonical.CanonicalNormalizer;
import com.evyasense.layer.model.AuthorizationPayload;
import com.evyasense.layer.model.BootNotificationPayload;
import com.evyasense.layer.model.ChangeAvailabilityPayload;
import com.evyasense.layer.model.HeartbeatPayload;
import com.evyasense.layer.model.MeterValuesPayload;
import com.evyasense.layer.model.RemoteStartTransactionPayload;
import com.evyasense.layer.model.RemoteStopTransactionPayload;
import com.evyasense.layer.model.ResetPayload;
import com.evyasense.layer.model.SenseEvent;
import com.evyasense.layer.model.StartTransactionPayload;
import com.evyasense.layer.model.StatusNotificationPayload;
import com.evyasense.layer.model.StopTransactionPayload;
import com.evyasense.layer.model.WebSocketContext;
import com.evyasense.layer.service.DataProcessorService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

@Service
public class SenseConsumer {

    private final SenseStore store;
    private final ObjectMapper mapper = new ObjectMapper();
    private static final DateTimeFormatter LOG_TIME =
            DateTimeFormatter.ofPattern("EEE MMM dd HH:mm:ss zzz yyyy", Locale.ENGLISH);

    // SENSE-003: frame buffering is per charger, and the charger comes from the Kafka message key.
    private final OcppFrameAssembler assembler = new OcppFrameAssembler();

    // Connection facts (ip, sessionId) enriched onto events, keyed by charger. Bounded.
    private final Map<String, WebSocketContext> contextByCharger = new LinkedHashMap<>(16, 0.75f, false) {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, WebSocketContext> eldest) {
            return size() > 2000;
        }
    };

    private long unkeyedMessages;
    private final DataProcessorService dataProcessorService;

    public SenseConsumer(SenseStore store,DataProcessorService dataProcessorService) {
        this.store = store;
		this.dataProcessorService = dataProcessorService;
    }

  
    // Fix 2: groupId removed from annotation - uses spring.kafka.consumer.group-id from application.properties
    // SENSE-003: the charger is read from the Kafka message key, which the log shipper sets to the
    // OCPPId. It is never inferred from whichever session was seen most recently.
    @KafkaListener(topics = "${sense.topic:evya-sense-topic}")
    public void read(ConsumerRecord<String, String> record) {

        String chargerId = record.key();
        String line = record.value();

        if (line == null) {
            return;
        }
        if (chargerId == null || chargerId.isBlank()) {
            // Without an identity the line cannot be attributed, and guessing is the defect this
            // replaces. Drop it, but say so.
            unkeyedMessages++;
            if (unkeyedMessages % 100 == 1) {
                System.err.println("Dropped " + unkeyedMessages
                        + " message(s) with no charger key on evya-sense-topic");
            }
            return;
        }

        try {
            LocalDateTime logTime = extractTime(line);
            String workingLine = unwrapQuotedJson(line);

            if (workingLine.contains("Headers :") && workingLine.contains("URI :")) {
                handleHandshake(chargerId, workingLine, logTime);
                return;
            }

            if (workingLine.contains("client Ip Address")) {
                handleClientInfo(chargerId, workingLine);
                return;
            }

            assembler.accept(chargerId, workingLine, logTime)
                    .ifPresent(frame -> parseFrame(chargerId, frame));

        } catch (Exception e) {
            System.err.println("Parse error for charger " + chargerId + ": " + e.getMessage());
            assembler.reset(chargerId);
        }
    }

    private void parseFrame(String chargerId, OcppFrameAssembler.CompletedFrame frame) {
        try {
            parseOcpp(frame.json(), frame.logTime(), chargerId);
        } catch (Exception e) {
            System.err.println("Parse error for charger " + chargerId + ": " + e.getMessage());
            assembler.reset(chargerId);
        }
    }

    /** CSV-wrapped log lines quote the JSON payload and double the quotes inside it. */
    private String unwrapQuotedJson(String line) {
        int start = line.indexOf("\"[");
        int end = line.lastIndexOf("]\"");
        if (start != -1 && end != -1 && end > start) {
            return line.substring(start + 1, end + 1).replace("\"\"", "\"");
        }
        return line;
    }

    // Fix 6b: bounded map — entries are removed once the response is correlated,
    // and a hard cap of 10 000 prevents leaks if responses never arrive.
    private final Map<String, String> messageIdActionMap = new ConcurrentHashMap<>(16, 0.75f, 4) {
        private static final int MAX = 10_000;
        @Override
        public String put(String key, String value) {
            if (size() >= MAX) {
                // Evict oldest keys when full to prevent unbounded growth.
                java.util.Iterator<String> it = keySet().iterator();
                int toRemove = MAX / 10;
                while (it.hasNext() && toRemove-- > 0) {
                    it.next();
                    it.remove();
                }
            }
            return super.put(key, value);
        }
    };
    
    private void parseOcpp(String json, LocalDateTime time, String chargerId) throws Exception {

        JsonNode arr = mapper.readTree(json);

        SenseEvent event = new SenseEvent();
        event.setLogTime(time);
        event.setMessageType(arr.get(0).asInt());
        event.setMessageId(arr.get(1).asText());

        // =====================
        // REQUEST
        // =====================
        if (arr.size() == 4) {

            String action = arr.get(2).asText();
            JsonNode payloadNode = arr.get(3);
            
            ObjectNode wrapper = mapper.createObjectNode();
            wrapper.put("action", action);
            wrapper.set("payload", payloadNode);

            // 🔥 Step 2: Canonical normalize
            JsonNode canonical = CanonicalNormalizer.normalize(wrapper);
            
            event.setEventType("OCPP_REQUEST");
            event.setAction(action);
            event.setPayload(mapper.convertValue(arr.get(3), Map.class));

            // 🔑 store action by messageId
            messageIdActionMap.put(event.getMessageId(), action);
            switch (action) {

                case "BootNotification" -> {
//                    event.setPayload(
//                            mapper.convertValue(payloadNode, BootNotificationPayload.class)
//                    );
                    
                    event.setPayload(
                            mapper.convertValue(canonical.get("payload"),
                            		BootNotificationPayload.class)
                        );
                }

                case "Heartbeat" -> {
//                    event.setPayload(
//                            mapper.convertValue(payloadNode, HeartbeatPayload.class)
//                    );
                	event.setPayload(
                            mapper.convertValue(canonical.get("payload"),
                            		HeartbeatPayload.class)
                        );
                }

                case "StartTransaction" -> {
//                    event.setPayload(
//                            mapper.convertValue(payloadNode, StartTransactionPayload.class)
//                    );
                	
                	event.setPayload(
                            mapper.convertValue(canonical.get("payload"),
                            		StartTransactionPayload.class)
                        );
                }

                case "StopTransaction" -> {
//                    event.setPayload(
//                            mapper.convertValue(payloadNode, StopTransactionPayload.class)
//                    );
                    
                    event.setPayload(
                            mapper.convertValue(canonical.get("payload"),
                            		StopTransactionPayload.class)
                        );
                }

                case "MeterValues" -> {
//                    event.setPayload(
//                            mapper.convertValue(payloadNode, MeterValuesPayload.class)
//                    );
                	
                	event.setPayload(
                            mapper.convertValue(canonical.get("payload"),
                            		MeterValuesPayload.class)
                        );
                	}
                
                case "RemoteStartTransaction" -> {
//                    event.setPayload(
//                        mapper.convertValue(payloadNode, RemoteStartTransactionPayload.class)
//                    );
                	
                	event.setPayload(
                            mapper.convertValue(canonical.get("payload"),
                            		RemoteStartTransactionPayload.class)
                        );
                }

                case "RemoteStopTransaction" -> {
//                    event.setPayload(
//                        mapper.convertValue(payloadNode, RemoteStopTransactionPayload.class)
//                    );
                	
                	event.setPayload(
                            mapper.convertValue(canonical.get("payload"),
                            		RemoteStopTransactionPayload.class)
                        );
                }
                case "Authorize" ->{
//                	event.setPayload(mapper.convertValue(payloadNode, AuthorizationPayload.class));
                	event.setPayload(
                            mapper.convertValue(canonical.get("payload"),
                            		AuthorizationPayload.class)
                        );
                }
                case "StatusNotification" ->{
//                	event.setPayload(mapper.convertValue(payloadNode, StatusNotificationPayload.class));
                	event.setPayload(
                            mapper.convertValue(canonical.get("payload"),
                                                StatusNotificationPayload.class)
                        );
                }
                case "ChangeAvailability" -> {
//                    event.setPayload(
//                        mapper.convertValue(payloadNode, ChangeAvailabilityPayload.class)
//                    );
                	
                	event.setPayload(
                            mapper.convertValue(canonical.get("payload"),
                            		ChangeAvailabilityPayload.class)
                        );
                }
                case "Reset" -> {
//                    event.setPayload(
//                        mapper.convertValue(payloadNode, ResetPayload.class)
//                    );
                	event.setPayload(
                            mapper.convertValue(canonical.get("payload"),
                            		ResetPayload.class)
                        );
                }
                


                default -> {
                    // 🚨 Unknown / unsupported OCPP action
//                    event.setPayload(
//                            mapper.convertValue(payloadNode, Map.class)
//                    );
                	event.setPayload(
                            mapper.convertValue(canonical.get("payload"), Map.class)
                        );
                	
                	
                }
            }
            
        }

        
        

     else {
        // RESPONSE
        event.setEventType("OCPP_RESPONSE");

        // 🔑 recover original action and remove it — the messageId is done
        String action = messageIdActionMap.remove(event.getMessageId());
        if (action == null) action = "Response";
        event.setAction(action);

        event.setPayload(mapper.convertValue(arr.get(2), Map.class));
    }
       
        event.setSocketContext(contextFor(chargerId));
        store.add(event);
dataProcessorService.processEvent(event);
        System.out.println("✅ STORED OCPP EVENT: " + event.getAction());
    }


    // =========================
    // WebSocket Helpers
    // =========================
    private void handleHandshake(String chargerId, String line, LocalDateTime time) {

        WebSocketContext ctx = contextFor(chargerId);

        Matcher m = Pattern.compile("URI : (.+)$").matcher(line);
        if (m.find()) {
            String uri = m.group(1);
            String fromUri = uri.substring(uri.lastIndexOf("/") + 1).trim();
            if (!fromUri.isEmpty() && !fromUri.equals(chargerId)) {
                System.err.println("Handshake URI names " + fromUri + " but the message key is "
                        + chargerId + "; trusting the key");
            }
        }

        ctx.setConnectedAt(time);

        SenseEvent ev = new SenseEvent();
        ev.setLogTime(time);
        ev.setEventType("WEBSOCKET");
        ev.setAction("HANDSHAKE");
        ev.setSocketContext(ctx);

        store.add(ev);
        // SENSE-002: the handshake never reached the processor before, so a connect was invisible to
        // the anomaly rules and to the Redis live-status plane.
        dataProcessorService.processEvent(ev);
    }

    private void handleClientInfo(String chargerId, String line) {

        Matcher m = Pattern.compile(
                "client Ip Address : ([\\d.]+) , clientId : (\\w+) , sessionId : ([\\w-]+)")
                .matcher(line);

        if (m.find()) {
            WebSocketContext ctx = contextFor(chargerId);
            ctx.setClientIp(m.group(1));
            ctx.setSessionId(m.group(3));
            // clientId deliberately not taken from the log line: identity comes from the message key.
        }
    }

    /** The charger's connection context, created on first sight and keyed by the OCPPId. */
    private synchronized WebSocketContext contextFor(String chargerId) {
        return contextByCharger.computeIfAbsent(chargerId, id -> {
            WebSocketContext ctx = new WebSocketContext();
            ctx.setChargerId(id);
            ctx.setClientId(id);
            return ctx;
        });
    }

    private LocalDateTime extractTime(String line) {
        try {
            return LocalDateTime.parse(line.substring(0, 28), LOG_TIME);
        } catch (Exception e) {
            return LocalDateTime.now();
        }
    }
}



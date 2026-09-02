package com.evyasense.layer.kafka;



import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
private int bracketCount =0;
    private static final DateTimeFormatter LOG_TIME =
            DateTimeFormatter.ofPattern("EEE MMM dd HH:mm:ss zzz yyyy", Locale.ENGLISH);

    // Fix 1: LinkedHashMap preserves insertion order so getLatestSession() is deterministic.
    // Fix 6a: capped at 500 entries to prevent unbounded memory growth.
    private final Map<String, WebSocketContext> sessionMap = new LinkedHashMap<>(16, 0.75f, false) {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, WebSocketContext> eldest) {
            return size() > 500;
        }
    };

    // 🔥 JSON buffering (FIX)
    private final StringBuilder jsonBuffer = new StringBuilder();
    private int bracketDepth = 0;
    private boolean bufferingJson = false;
    private LocalDateTime bufferedTime;
    private final DataProcessorService dataProcessorService;

    public SenseConsumer(SenseStore store,DataProcessorService dataProcessorService) {
        this.store = store;
		this.dataProcessorService = dataProcessorService;
    }

  
   // Fix 2: groupId removed from annotation — uses spring.kafka.consumer.group-id from application.properties
   @KafkaListener(topics = "evya-sense-topic")
public void read(String line) {

    try {
        System.out.println("🔥 KAFKA CONSUMED: " + line);
        LocalDateTime logTime = extractTime(line);

        /* =========================================================
           STEP 1: Normalize line (CSV / quoted JSON handling)
           ========================================================= */
        String workingLine = line;

        int quotedJsonStart = line.indexOf("\"[");
        int quotedJsonEnd = line.lastIndexOf("]\"");

        if (quotedJsonStart != -1 && quotedJsonEnd != -1 && quotedJsonEnd > quotedJsonStart) {
            workingLine = line
                    .substring(quotedJsonStart + 1, quotedJsonEnd + 1)
                    .replace("\"\"", "\""); // unescape quotes
        }

        /* =========================================================
           STEP 2: WebSocket handshake detection
           ========================================================= */
        if (workingLine.contains("Headers :") && workingLine.contains("URI :")) {
            handleHandshake(workingLine, logTime);
            return;
        }

        if (workingLine.contains("client Ip Address")) {
            handleClientInfo(workingLine);
            return;
        }

        /* =========================================================
           STEP 3: Detect start of OCPP JSON
           ========================================================= */
        int jsonStart = workingLine.indexOf('[');

        boolean isOcppStart =
                jsonStart != -1 &&
                (
                    workingLine.substring(jsonStart).startsWith("[2,") ||
                    workingLine.substring(jsonStart).startsWith("[3,") ||
                    workingLine.substring(jsonStart).startsWith("[4,")
                );

        if (isOcppStart) {
            jsonBuffer.setLength(0);
            bracketCount = 0;
            bufferedTime = logTime;

            String jsonPart = workingLine.substring(jsonStart);
            jsonBuffer.append(jsonPart);

            for (char c : jsonPart.toCharArray()) {
                if (c == '[') bracketCount++;
                else if (c == ']') bracketCount--;
            }

            // Single-line complete frame
            if (bracketCount == 0) {
            	parseOcpp(jsonBuffer.toString(), bufferedTime);
                jsonBuffer.setLength(0);
            }
            return;
        }

        /* =========================================================
           STEP 4: Multi-line OCPP continuation
           ========================================================= */
        if (jsonBuffer.length() > 0) {

            String trimmed = workingLine.trim();
            jsonBuffer.append(trimmed);

            for (char c : trimmed.toCharArray()) {
                if (c == '[') bracketCount++;
                else if (c == ']') bracketCount--;
            }

            if (bracketCount == 0) {
            	parseOcpp(jsonBuffer.toString(), bufferedTime);
                jsonBuffer.setLength(0);
            }
        }

    } catch (Exception e) {
        System.err.println("❌ Parse error: " + e.getMessage());
        jsonBuffer.setLength(0);
        bracketCount = 0;
    }
}

    // =========================
    // JSON BRACKET COUNTER
    // =========================
    private void appendAndCount(String text) {
        for (char c : text.toCharArray()) {
            if (c == '[') bracketDepth++;
            if (c == ']') bracketDepth--;
            jsonBuffer.append(c);
        }
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
    
    private void parseOcpp(String json, LocalDateTime time) throws Exception {

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
       
        event.setSocketContext(getLatestSession());
        store.add(event);
dataProcessorService.processEvent(event);
        System.out.println("✅ STORED OCPP EVENT: " + event.getAction());
    }


    // =========================
    // WebSocket Helpers
    // =========================
    private void handleHandshake(String line, LocalDateTime time) {

        Matcher m = Pattern.compile("URI : (.+)$").matcher(line);
        WebSocketContext ctx = new WebSocketContext();

        if (m.find()) {
            String uri = m.group(1);
            ctx.setChargerId(uri.substring(uri.lastIndexOf("/") + 1));
        }

        ctx.setConnectedAt(time);

        SenseEvent ev = new SenseEvent();
        ev.setLogTime(time);
        ev.setEventType("WEBSOCKET");
        ev.setAction("HANDSHAKE");
        ev.setSocketContext(ctx);

        store.add(ev);
    }

    private void handleClientInfo(String line) {

        Matcher m = Pattern.compile(
                "client Ip Address : ([\\d.]+) , clientId : (\\w+) , sessionId : ([\\w-]+)")
                .matcher(line);

        if (m.find()) {
            WebSocketContext ctx = new WebSocketContext();
            ctx.setClientIp(m.group(1));
            ctx.setClientId(m.group(2));
            ctx.setSessionId(m.group(3));
            sessionMap.put(ctx.getSessionId(), ctx);
        }
    }

    // Fix 1: LinkedHashMap keeps insertion order; the last entry is genuinely the most recent session.
    private WebSocketContext getLatestSession() {
        if (sessionMap.isEmpty()) return null;
        WebSocketContext last = null;
        for (WebSocketContext ctx : sessionMap.values()) {
            last = ctx;
        }
        return last;
    }

    private LocalDateTime extractTime(String line) {
        try {
            return LocalDateTime.parse(line.substring(0, 28), LOG_TIME);
        } catch (Exception e) {
            return LocalDateTime.now();
        }
    }
}



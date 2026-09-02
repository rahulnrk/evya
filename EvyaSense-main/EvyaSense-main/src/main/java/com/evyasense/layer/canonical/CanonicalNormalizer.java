package com.evyasense.layer.canonical;




import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

public class CanonicalNormalizer {

    /* ============================================================
       ENTRY POINT – Sense Layer will call this
       ============================================================ */
    public static JsonNode normalize(JsonNode input) {

        ObjectNode root = input.deepCopy();
        JsonNode actionNode = root.get("action");
        if (actionNode == null || actionNode.isNull()) {
            return root;
        }
        String action = actionNode.asText();

        switch (action) {
            case "MeterValues" -> normalizeMeterValues(root);
            case "StatusNotification" -> normalizeStatusNotification(root);
            case "StartTransaction" -> normalizeStartTransaction(root);
        }
        return root;
    }

    /* ============================================================
       MeterValues
       ============================================================ */
    private static void normalizeMeterValues(ObjectNode root) {

        ArrayNode meterValues =
            (ArrayNode) root.at("/payload/meterValue");

        if (meterValues == null || meterValues.isMissingNode()) {
			return;
		}

        for (JsonNode mv : meterValues) {
            ArrayNode sampledValues = (ArrayNode) mv.get("sampledValue");
            if (sampledValues == null || sampledValues.isMissingNode()) continue;

            for (JsonNode svNode : sampledValues) {

                ObjectNode sv = (ObjectNode) svNode;

                JsonNode measurandNode = sv.get("measurand");
                JsonNode unitNode = sv.get("unit");
                JsonNode valueNode = sv.get("value");

                String rawMeasurand = measurandNode != null ? measurandNode.asText() : "";
                String unit = unitNode != null ? unitNode.asText() : "";
                double value = valueNode != null ? valueNode.asDouble() : 0.0;

                // ENUM lookup
                CanonicalDictionary.Measurand measurand =
                    CanonicalDictionary.Measurand.fromRaw(rawMeasurand);
                
                // Unit conversion
                double canonicalValue =
                    UnitConverter.convert(measurand, value, unit);

                // Rewrite
                sv.put("measurand", measurand.name());
                sv.put("value", canonicalValue);

                // Canonical unit
                switch (measurand) {
                    case POWER -> sv.put("unit", "W");
                    case ENERGY -> sv.put("unit", "Wh");
                    case CURRENT -> sv.put("unit", "A");
                    case VOLTAGE -> sv.put("unit", "V");
                    case TEMPERATURE -> sv.put("unit", "C");
                    case FREQUENCY -> sv.put("unit", "Hz");
                }
            }
        }
    }

    /* ============================================================
       StatusNotification
       ============================================================ */
    private static void normalizeStatusNotification(ObjectNode root) {

        JsonNode payloadNode = root.get("payload");
        // Fix 3: guard against missing payload field to prevent NPE
        if (payloadNode == null || payloadNode.isNull() || payloadNode.isMissingNode()) return;
        ObjectNode payload = (ObjectNode) payloadNode;

        if (payload.has("status")) {
            String rawStatus = payload.get("status").asText();
            payload.put(
                "status",
                CanonicalDictionary.Status.fromRaw(rawStatus).name()
            );
        }

        if (payload.has("errorCode")) {
            String rawError = payload.get("errorCode").asText();
            payload.put(
                "errorCode",
                CanonicalDictionary.Fault.fromRaw(rawError).name()
            );
        }
    }

    /* ============================================================
       StartTransaction
       ============================================================ */
    private static void normalizeStartTransaction(ObjectNode root) {

        ObjectNode payload = (ObjectNode) root.get("payload");

        // Future-safe: txId / sessionId → transactionId
        if (payload.has("txId") && !payload.has("transactionId")) {
            payload.put("transactionId", payload.get("txId").asLong());
            payload.remove("txId");
        }
    }

   
    
}
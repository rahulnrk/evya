package com.evyasense.layer.canonical;

import java.util.regex.Pattern;

/**
 * The one rule for what counts as a charger identity inside EvyaSense.
 *
 * <p>A charger id arrives from outside - a Kafka key set from a CSMS directory name, or an upload
 * parameter - and becomes a Redis key, a database value and log text. Control characters would forge
 * log lines; glob characters would widen Redis scans. ':' stays allowed because MAC-style OCPP identities
 * use it, but an id ending in {@value #RESERVED_SUFFIX} would alias the connector-set key
 * {@code charger:<id>:connectors}, so that suffix is refused.
 */
public final class ChargerIds {

    private static final Pattern SAFE = Pattern.compile("^[A-Za-z0-9._:-]{1,64}$");
    static final String RESERVED_SUFFIX = ":connectors";
    private static final int MAX_PRINTED = 80;

    private ChargerIds() {
    }

    public static boolean isValid(String id) {
        return id != null && SAFE.matcher(id).matches() && !id.endsWith(RESERVED_SUFFIX);
    }

    /** For logs: an unvalidated id is printed with non-printable characters masked, and truncated. */
    public static String printable(String value) {
        if (value == null) {
            return "<none>";
        }
        StringBuilder out = new StringBuilder(Math.min(value.length(), MAX_PRINTED));
        for (int i = 0; i < value.length() && i < MAX_PRINTED; i++) {
            char c = value.charAt(i);
            out.append(c >= 0x20 && c < 0x7f ? c : '?');
        }
        return value.length() > MAX_PRINTED ? out + "..." : out.toString();
    }
}

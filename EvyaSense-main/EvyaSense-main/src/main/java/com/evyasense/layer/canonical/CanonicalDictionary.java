package com.evyasense.layer.canonical;

import java.util.Set;

public class CanonicalDictionary {

    /* ============================================================
       MEASURAND DICTIONARY (MeterValues)
       ============================================================ */
    public enum Measurand {

        POWER(
            "Power.Active.Import",
            "Power.Active.Import.Register",
            "PowerActiveImport",
            "ACTIVE_POWER",
            "ActivePower",
            "ChargingPower",
            "chargingPower",
            "power",
            "sessionPower"
            
        ),

        ENERGY(
            "Energy.Active.Import.Register",
            "Energy.Active.Import.Interval",
            "Energy",
            "TotalEnergy",
            "ActiveEnergy",
            "sessionEnergy"
        ),

        CURRENT(
            "Current.Import",
            "Current",
            "Current.L1",
            "Current.L2",
            "Current.L3"
        ),

        VOLTAGE(
            "Voltage",
            "Voltage.L1",
            "Voltage.L2",
            "Voltage.L3"
        ),

        TEMPERATURE(
            "Temperature",
            "Temperature.A",
            "Temperature.B",
            "TEMP"
        ),

        FREQUENCY(
            "Frequency",
            "GridFrequency"
        ),
        
       

        UNKNOWN();

        private final Set<String> aliases;

        Measurand(String... aliases) {
            this.aliases = Set.of(aliases);
        }

        public static Measurand fromRaw(String raw) {
            for (Measurand m : values()) {
                if (m.aliases.contains(raw)) {
                    return m;
                }
            }
            return UNKNOWN;
        }
    }

    /* ============================================================
       FAULT DICTIONARY (StatusNotification)
       ============================================================ */
    public enum Fault {

        GROUND_FAULT(
            "GFI_FAULT",
            "GFI_FAULT_V2",
            "GROUND_LEAKAGE",
            "GF_TRIP",
            "GroundFailure",
            "ERR_GROUND",
            "GroundFault"
        ),

        OVERCURRENT(
            "OC_FAULT",
            "OVER_CURRENT",
            "OverCurrentFailure"
        ),

        OVERHEAT(
            "OVER_TEMPERATURE",
            "OverTemperature",
            "TEMP_HIGH"
        ),
        WEAKSIGNAL(
        		"WeakSignal",
        		"UnStable Signal"
        		),

        NONE("NoError"),

        UNKNOWN();

        private final Set<String> aliases;

        Fault(String... aliases) {
            this.aliases = Set.of(aliases);
        }

        public static Fault fromRaw(String raw) {
            for (Fault f : values()) {
                if (f.aliases.contains(raw)) {
                    return f;
                }
            }
            return UNKNOWN;
        }
    }

    /* ============================================================
       STATUS DICTIONARY (StatusNotification)
       ============================================================ */
    public enum Status {

        AVAILABLE("Available", "Idle"),
        PREPARING("Preparing", "EV_CONNECTED"),
        CHARGING("Charging"),
        SUSPENDED_EV("SuspendedEV", "EV_PAUSED"),
        SUSPENDED_EVSE("SuspendedEVSE", "CHARGER_PAUSED"),
        FINISHING("Finishing"),
        FAULTED("Faulted", "Error", "FAILURE"),
        UNAVAILABLE("Unavailable", "Offline"),
        UNKNOWN();

        private final Set<String> aliases;

        Status(String... aliases) {
            this.aliases = Set.of(aliases);
        }

        public static Status fromRaw(String raw) {
            for (Status s : values()) {
                if (s.aliases.contains(raw)) {
                    return s;
                }
            }
            return UNKNOWN;
        }
    }
}
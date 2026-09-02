package com.evyasense.layer.canonical;



public class UnitConverter {

    public static double convert(
        CanonicalDictionary.Measurand m,
        double value,
        String unit
    ) {

        return switch (m) {

            case POWER -> {
                if ("kW".equalsIgnoreCase(unit)){yield value * 1000;}
                yield value;
            }

            case ENERGY -> {
                if ("kWh".equalsIgnoreCase(unit)){yield value * 1000;}
                yield value;
            }

            case CURRENT -> {
                if ("mA".equalsIgnoreCase(unit)){yield value / 1000;}
                yield value;
            }

            case VOLTAGE -> {
                if ("mV".equalsIgnoreCase(unit)){yield value / 1000;}
                yield value;
            }

            case TEMPERATURE -> {
                if ("Fahrenheit".equalsIgnoreCase(unit)){yield (value - 32) * 5 / 9;}
                if ("Kelvin".equalsIgnoreCase(unit)){yield value - 273.15;}
                yield value;
            }

            case FREQUENCY -> {
                if ("dHz".equalsIgnoreCase(unit)){yield value / 10;}
                yield value;
            }

            default -> value;
        };
    }
}
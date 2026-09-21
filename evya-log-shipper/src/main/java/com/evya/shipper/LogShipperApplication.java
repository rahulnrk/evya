package com.evya.shipper;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties(ShipperProperties.class)
public class LogShipperApplication {

    public static void main(String[] args) {
        SpringApplication.run(LogShipperApplication.class, args);
    }
}

package com.evyasense.layer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;

@SpringBootApplication
@EnableKafka
public class EvyaSenseLayerApplication {

	public static void main(String[] args) {
		SpringApplication.run(EvyaSenseLayerApplication.class, args);
	}

}

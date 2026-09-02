package com.evyasense.layer.config;



import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class KafkaConfig {

    public static final String TOPIC = "evya-sense-topic";

    @Bean
    public NewTopic evyaSenseTopic() {
        return new NewTopic(TOPIC, 1, (short) 1);
    }
}

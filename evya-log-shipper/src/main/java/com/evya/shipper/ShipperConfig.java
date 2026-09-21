package com.evya.shipper;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.KafkaTemplate;

import java.nio.file.Paths;

@Configuration
public class ShipperConfig {

    @Bean
    public OffsetStore offsetStore(ShipperProperties properties) {
        return new OffsetStore(Paths.get(properties.getStateFile()));
    }

    @Bean
    public LinePublisher linePublisher(KafkaTemplate<String, String> kafka,
                                       ShipperProperties properties) {
        return new KafkaLinePublisher(kafka, properties.getTopic());
    }

    @Bean
    public LogTailService logTailService(ShipperProperties properties, OffsetStore offsets,
                                         LinePublisher publisher) {
        return new LogTailService(properties, offsets, publisher);
    }
}

package com.evya.shipper;

import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.header.internals.RecordHeader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;

import java.nio.charset.StandardCharsets;

/**
 * Publishes to Kafka with the OCPPId as the record key, which both identifies the charger downstream
 * and keeps one charger's lines on a single partition - so multi-line OCPP frames stay in order.
 */
public class KafkaLinePublisher implements LinePublisher {

    private static final Logger log = LoggerFactory.getLogger(KafkaLinePublisher.class);

    private final KafkaTemplate<String, String> kafka;
    private final String topic;

    public KafkaLinePublisher(KafkaTemplate<String, String> kafka, String topic) {
        this.kafka = kafka;
        this.topic = topic;
    }

    @Override
    public void publish(String chargerId, String line, String source) {
        ProducerRecord<String, String> record = new ProducerRecord<>(topic, chargerId, line);
        record.headers().add(new RecordHeader("chargerId", chargerId.getBytes(StandardCharsets.UTF_8)));
        record.headers().add(new RecordHeader("source", source.getBytes(StandardCharsets.UTF_8)));

        kafka.send(record).whenComplete((result, failure) -> {
            if (failure != null) {
                // The offset has already advanced, so this line is lost rather than retried. Accepting
                // that is the trade for not blocking the tailer; a durable outbox is the next step.
                log.error("Failed to publish a log line for charger {} from {}", chargerId, source,
                        failure);
            }
        });
    }
}

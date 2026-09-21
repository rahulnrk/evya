package com.evyasense.layer.kafka;

import com.evyasense.layer.model.SenseEvent;
import com.evyasense.layer.service.DataProcessorService;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/**
 * SENSE-003 and the security review: the charger comes from the record key, and a key that is missing
 * or unsafe is dropped before it can reach Redis keys or log text.
 */
class SenseConsumerTest {

    private static final String HEARTBEAT =
            "Mon Sep 21 00:00:04 IST 2026\tReceived Message : [2,\"a\",\"Heartbeat\",{}]";

    private DataProcessorService processor;
    private SenseConsumer consumer;

    @BeforeEach
    void setUp() {
        processor = mock(DataProcessorService.class);
        consumer = new SenseConsumer(mock(SenseStore.class), processor);
    }

    private ConsumerRecord<String, String> record(String key, String value) {
        return new ConsumerRecord<>("evya-sense-topic", 0, 0L, key, value);
    }

    @Test
    @DisplayName("A frame is attributed to the charger named by the record key")
    void attributesByKey() {
        consumer.read(record("LAB001", HEARTBEAT));

        ArgumentCaptor<SenseEvent> event = ArgumentCaptor.forClass(SenseEvent.class);
        verify(processor).processEvent(event.capture());
        assertThat(event.getValue().getAction()).isEqualTo("Heartbeat");
        assertThat(event.getValue().getSocketContext().getChargerId()).isEqualTo("LAB001");
        assertThat(event.getValue().getSocketContext().getClientId()).isEqualTo("LAB001");
    }

    @Test
    @DisplayName("Missing, malformed and key-aliasing charger ids are dropped")
    void rejectsUnsafeKeys() {
        consumer.read(record(null, HEARTBEAT));
        consumer.read(record("", HEARTBEAT));
        consumer.read(record("BAD ID", HEARTBEAT));
        consumer.read(record("CP1\nforged", HEARTBEAT));
        consumer.read(record("CP1:connectors", HEARTBEAT));

        verify(processor, never()).processEvent(any());
    }
}

package com.evyasense.layer.kafka;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * SENSE-003: the previous consumer held one buffer and one bracket counter as fields on a singleton,
 * so two chargers logging a multi-line frame at the same time produced a frame belonging to neither.
 */
class OcppFrameAssemblerTest {

    private final OcppFrameAssembler assembler = new OcppFrameAssembler();
    private final LocalDateTime t0 = LocalDateTime.of(2026, 9, 21, 0, 0, 0);

    @Test
    @DisplayName("A single-line frame completes immediately")
    void singleLineFrame() {
        Optional<OcppFrameAssembler.CompletedFrame> frame = assembler.accept(
                "LAB001",
                "Mon Sep 21 00:00:04 IST 2026\tReceived Message : [2,\"id-1\",\"Heartbeat\",{}]",
                t0);

        assertThat(frame).isPresent();
        assertThat(frame.get().json()).isEqualTo("[2,\"id-1\",\"Heartbeat\",{}]");
        assertThat(frame.get().logTime()).isEqualTo(t0);
    }

    @Test
    @DisplayName("Two chargers writing multi-line frames at once do not contaminate each other")
    void interleavedFramesStaySeparate() {
        assertThat(assembler.accept("LAB001", "Received Message : [2,\"a\",\"StartTransaction\",{", t0))
                .isEmpty();
        assertThat(assembler.accept("LAB002", "Received Message : [2,\"b\",\"StopTransaction\",{", t0))
                .isEmpty();

        assertThat(assembler.accept("LAB001", "\"connectorId\":1,\"meterStart\":100", t0)).isEmpty();
        assertThat(assembler.accept("LAB002", "\"transactionId\":77", t0)).isEmpty();

        Optional<OcppFrameAssembler.CompletedFrame> first = assembler.accept("LAB001", "}]", t0);
        Optional<OcppFrameAssembler.CompletedFrame> second = assembler.accept("LAB002", "}]", t0);

        assertThat(first).isPresent();
        assertThat(first.get().json())
                .contains("StartTransaction")
                .contains("meterStart")
                .doesNotContain("StopTransaction")
                .doesNotContain("transactionId");

        assertThat(second).isPresent();
        assertThat(second.get().json())
                .contains("StopTransaction")
                .contains("transactionId")
                .doesNotContain("StartTransaction");
    }

    @Test
    @DisplayName("A continuation with no frame open is ignored rather than buffered")
    void strayContinuationIsIgnored() {
        assertThat(assembler.accept("LAB001", "some unrelated log line", t0)).isEmpty();
        assertThat(assembler.accept("LAB001", "}]", t0)).isEmpty();
    }

    @Test
    @DisplayName("A reset drops a partial frame so the next one starts clean")
    void resetDropsPartialFrame() {
        assembler.accept("LAB001", "Received Message : [2,\"a\",\"StartTransaction\",{", t0);
        assembler.reset("LAB001");

        Optional<OcppFrameAssembler.CompletedFrame> frame =
                assembler.accept("LAB001", "Received Message : [2,\"c\",\"Heartbeat\",{}]", t0);

        assertThat(frame).isPresent();
        assertThat(frame.get().json()).doesNotContain("StartTransaction");
    }
}

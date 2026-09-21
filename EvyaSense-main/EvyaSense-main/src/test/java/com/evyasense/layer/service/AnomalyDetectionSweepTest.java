package com.evyasense.layer.service;

import com.evyasense.layer.canonical.AnomalyType;
import com.evyasense.layer.entity.ChargerAnomaly;
import com.evyasense.layer.model.SenseEvent;
import com.evyasense.layer.model.WebSocketContext;
import com.evyasense.layer.repo.ChargerAnomalyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * SENSE-004: rules used to run only when a charger sent something, so a charger that went silent - the
 * most common failure there is - was never reported. These pin the time-driven sweep that fixes it, and
 * the outage model that keeps it from writing a new alert every minute for as long as a charger is dead.
 */
class AnomalyDetectionSweepTest {

    private static final LocalDateTime T0 = LocalDateTime.of(2026, 9, 21, 12, 0, 0);
    private static final long SILENCE_THRESHOLD_SECONDS = 300;

    private ChargerAnomalyRepository anomalies;
    private RecordingListener liveness;
    private AnomalyDetectionService service;

    /** Records liveness transitions in order, e.g. "silent:LAB001", "back:LAB001". */
    private static final class RecordingListener implements ChargerLivenessListener {
        final List<String> transitions = new ArrayList<>();

        @Override
        public void wentSilent(String chargerId, LocalDateTime silentSince, LocalDateTime detectedAt) {
            transitions.add("silent:" + chargerId);
        }

        @Override
        public void cameBack(String chargerId, LocalDateTime heardAt) {
            transitions.add("back:" + chargerId);
        }
    }

    @BeforeEach
    void setUp() {
        anomalies = mock(ChargerAnomalyRepository.class);
        when(anomalies.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        liveness = new RecordingListener();
        service = new AnomalyDetectionService(anomalies, List.of(liveness), Runnable::run);
    }

    private void heartbeatFrom(String chargerId, LocalDateTime at) {
        WebSocketContext context = new WebSocketContext();
        context.setChargerId(chargerId);
        context.setClientId(chargerId);

        SenseEvent event = new SenseEvent();
        event.setLogTime(at);
        event.setEventType("OCPP_REQUEST");
        event.setAction("Heartbeat");
        event.setSocketContext(context);

        service.handleEvent(event);
    }

    private LocalDateTime overdue() {
        return T0.plusSeconds(SILENCE_THRESHOLD_SECONDS + 60);
    }

    @Test
    @DisplayName("A charger that goes silent is reported even though it sends nothing")
    void silenceIsDetectedWithoutAnyEvent() {
        heartbeatFrom("LAB001", T0);

        service.sweep(overdue(), SILENCE_THRESHOLD_SECONDS);

        ArgumentCaptor<ChargerAnomaly> saved = ArgumentCaptor.forClass(ChargerAnomaly.class);
        verify(anomalies).save(saved.capture());

        assertThat(saved.getValue().getChargerId()).isEqualTo("LAB001");
        assertThat(saved.getValue().getAnomalyType()).isEqualTo(AnomalyType.HEARTBEAT_TIMEOUT);
        assertThat(saved.getValue().getStatus()).isEqualTo("ACTIVE");
        assertThat(saved.getValue().getRootCause()).contains("Silent=");
        assertThat(liveness.transitions).containsExactly("silent:LAB001");
    }

    @Test
    @DisplayName("A charger still within its silence budget is left alone")
    void healthyChargerIsNotFlagged() {
        heartbeatFrom("LAB001", T0);

        service.sweep(T0.plusSeconds(SILENCE_THRESHOLD_SECONDS - 60), SILENCE_THRESHOLD_SECONDS);

        verify(anomalies, never()).save(any());
        assertThat(liveness.transitions).isEmpty();
    }

    @Test
    @DisplayName("The sweep covers every tracked charger, not just the last one heard from")
    void sweepCoversTheWholeFleet() {
        heartbeatFrom("LAB001", T0);
        heartbeatFrom("LAB002", T0);
        heartbeatFrom("LAB003", T0);

        assertThat(service.trackedChargers()).isEqualTo(3);

        service.sweep(overdue(), SILENCE_THRESHOLD_SECONDS);

        ArgumentCaptor<ChargerAnomaly> saved = ArgumentCaptor.forClass(ChargerAnomaly.class);
        verify(anomalies, times(3)).save(saved.capture());

        assertThat(saved.getAllValues())
                .extracting(ChargerAnomaly::getChargerId)
                .containsExactlyInAnyOrder("LAB001", "LAB002", "LAB003");
    }

    @Test
    @DisplayName("An outage is one alert, however long it lasts - not a new row every cooldown")
    void outageIsReportedOnce() {
        heartbeatFrom("LAB001", T0);

        // Each sweep is past the 60 second cooldown: the lab run wrote a second row at exactly this point.
        service.sweep(overdue(), SILENCE_THRESHOLD_SECONDS);
        service.sweep(overdue().plusSeconds(90), SILENCE_THRESHOLD_SECONDS);
        service.sweep(overdue().plusSeconds(600), SILENCE_THRESHOLD_SECONDS);
        service.sweep(overdue().plusSeconds(86_400), SILENCE_THRESHOLD_SECONDS);

        verify(anomalies, times(1)).save(any());
        assertThat(liveness.transitions).containsExactly("silent:LAB001");
    }

    @Test
    @DisplayName("The outage is resolved when the charger is heard from again")
    void outageIsResolvedWhenTheChargerReturns() {
        heartbeatFrom("LAB001", T0);
        service.sweep(overdue(), SILENCE_THRESHOLD_SECONDS);

        LocalDateTime backAt = overdue().plusSeconds(120);
        heartbeatFrom("LAB001", backAt);

        ArgumentCaptor<ChargerAnomaly> saved = ArgumentCaptor.forClass(ChargerAnomaly.class);
        verify(anomalies, times(2)).save(saved.capture());

        ChargerAnomaly resolved = saved.getAllValues().get(1);
        assertThat(resolved.getAnomalyType()).isEqualTo(AnomalyType.HEARTBEAT_TIMEOUT);
        assertThat(resolved.getStatus()).isEqualTo("RESOLVED");
        assertThat(resolved.getRootCause()).contains("Resolved=" + backAt);
        assertThat(liveness.transitions).containsExactly("silent:LAB001", "back:LAB001");
    }

    @Test
    @DisplayName("A second outage after recovery raises a fresh alert")
    void secondOutageIsReportedAgain() {
        heartbeatFrom("LAB001", T0);
        service.sweep(overdue(), SILENCE_THRESHOLD_SECONDS);

        LocalDateTime backAt = overdue().plusSeconds(120);
        heartbeatFrom("LAB001", backAt);

        service.sweep(backAt.plusSeconds(SILENCE_THRESHOLD_SECONDS + 60), SILENCE_THRESHOLD_SECONDS);

        ArgumentCaptor<ChargerAnomaly> saved = ArgumentCaptor.forClass(ChargerAnomaly.class);
        verify(anomalies, times(3)).save(saved.capture());

        assertThat(saved.getAllValues().get(2).getStatus()).isEqualTo("ACTIVE");
        assertThat(liveness.transitions)
                .containsExactly("silent:LAB001", "back:LAB001", "silent:LAB001");
    }

    @Test
    @DisplayName("A late line older than the outage does not count as the charger coming back")
    void staleLinesDoNotEndAnOutage() {
        heartbeatFrom("LAB001", T0);
        service.sweep(overdue(), SILENCE_THRESHOLD_SECONDS);

        heartbeatFrom("LAB001", T0.minusSeconds(10));

        verify(anomalies, times(1)).save(any());
        assertThat(liveness.transitions).containsExactly("silent:LAB001");
    }

    @Test
    @DisplayName("A failing liveness store does not stop detection")
    void listenerFailureDoesNotBreakDetection() {
        ChargerLivenessListener broken = new ChargerLivenessListener() {
            @Override
            public void wentSilent(String chargerId, LocalDateTime silentSince, LocalDateTime detectedAt) {
                throw new IllegalStateException("redis down");
            }

            @Override
            public void cameBack(String chargerId, LocalDateTime heardAt) {
                throw new IllegalStateException("redis down");
            }
        };
        service = new AnomalyDetectionService(anomalies, List.of(broken), Runnable::run);

        heartbeatFrom("LAB001", T0);
        service.sweep(overdue(), SILENCE_THRESHOLD_SECONDS);

        verify(anomalies, times(1)).save(any());
    }

    private void event(String chargerId, LocalDateTime at, String type, String action, Object payload) {
        WebSocketContext context = new WebSocketContext();
        context.setChargerId(chargerId);
        context.setClientId(chargerId);

        SenseEvent event = new SenseEvent();
        event.setLogTime(at);
        event.setEventType(type);
        event.setAction(action);
        event.setPayload(payload);
        event.setSocketContext(context);

        service.handleEvent(event);
    }

    @Test
    @DisplayName("A charger that dies mid-session gets one outage alert, not a stream of meter alerts")
    void outageSubsumesTimeBasedRules() {
        event("LAB001", T0, "OCPP_RESPONSE", "StartTransaction",
                Map.of("idTagInfo", Map.of("status", "Accepted"), "transactionId", 7));
        event("LAB001", T0, "OCPP_RESPONSE", "GetConfiguration",
                Map.of("configurationKey", List.of(Map.of("key", "MeterValueSampleInterval", "value", "10"))));
        event("LAB001", T0, "OCPP_REQUEST", "MeterValues",
                Map.of("connectorId", 1, "transactionId", 7, "meterValue", List.of()));

        // Meter values overdue (3 x 10 s + 5) while the charger is not yet silent long enough for an outage.
        service.sweep(T0.plusSeconds(60), SILENCE_THRESHOLD_SECONDS);
        // Now it is: the outage opens.
        service.sweep(overdue(), SILENCE_THRESHOLD_SECONDS);
        // And lasts a day.
        service.sweep(overdue().plusSeconds(120), SILENCE_THRESHOLD_SECONDS);
        service.sweep(overdue().plusSeconds(3_600), SILENCE_THRESHOLD_SECONDS);
        service.sweep(overdue().plusSeconds(86_400), SILENCE_THRESHOLD_SECONDS);

        ArgumentCaptor<ChargerAnomaly> saved = ArgumentCaptor.forClass(ChargerAnomaly.class);
        verify(anomalies, org.mockito.Mockito.atLeastOnce()).save(saved.capture());

        assertThat(saved.getAllValues())
                .extracting(ChargerAnomaly::getAnomalyType)
                .containsExactly(AnomalyType.CHARGING_NO_METER_VALUES, AnomalyType.HEARTBEAT_TIMEOUT);
    }

    @Test
    @DisplayName("Liveness I/O runs off the ingest and sweep threads, in the order transitions happened")
    void livenessCallbacksAreDispatchedInOrderOffThread() throws Exception {
        List<String> seen = new CopyOnWriteArrayList<>();
        CountDownLatch delivered = new CountDownLatch(3);
        ChargerLivenessListener recording = new ChargerLivenessListener() {
            @Override
            public void wentSilent(String chargerId, LocalDateTime silentSince, LocalDateTime detectedAt) {
                seen.add("silent@" + Thread.currentThread().getName());
                delivered.countDown();
            }

            @Override
            public void cameBack(String chargerId, LocalDateTime heardAt) {
                seen.add("back@" + Thread.currentThread().getName());
                delivered.countDown();
            }
        };
        AnomalyDetectionService async = new AnomalyDetectionService(anomalies, List.of(recording));
        service = async;
        try {
            heartbeatFrom("LAB001", T0);
            service.sweep(overdue(), SILENCE_THRESHOLD_SECONDS);
            LocalDateTime backAt = overdue().plusSeconds(120);
            heartbeatFrom("LAB001", backAt);
            service.sweep(backAt.plusSeconds(SILENCE_THRESHOLD_SECONDS + 60), SILENCE_THRESHOLD_SECONDS);

            assertThat(delivered.await(5, TimeUnit.SECONDS)).isTrue();
            assertThat(seen).containsExactly(
                    "silent@sense-liveness", "back@sense-liveness", "silent@sense-liveness");
        } finally {
            async.stopLivenessDispatch();
        }
    }
}

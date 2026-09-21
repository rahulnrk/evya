package com.evyasense.layer.service;

import com.evyasense.layer.model.ChargerData;
import com.evyasense.layer.model.ConnectorData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RedisLivenessUpdaterTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 9, 21, 15, 0);

    private RedisService redis;
    private MySQLService mysql;
    private StatusEventHub hub;
    private RedisLivenessUpdater updater;
    private ChargerData charger;

    @BeforeEach
    void setUp() {
        redis = mock(RedisService.class);
        mysql = mock(MySQLService.class);
        hub = mock(StatusEventHub.class);
        updater = new RedisLivenessUpdater(redis, mysql, hub);

        charger = new ChargerData();
        charger.setChargerId("CP1");
        charger.setStatus("online");
        when(redis.getChargerData("CP1")).thenReturn(charger);
        when(redis.getConnectorIdsForCharger("CP1")).thenReturn(Set.of("1", "2"));

        ConnectorData one = new ConnectorData();
        one.setStatus("AVAILABLE");
        ConnectorData two = new ConnectorData();
        two.setStatus("CHARGING");
        when(redis.getConnectorData("CP1", "1")).thenReturn(one);
        when(redis.getConnectorData("CP1", "2")).thenReturn(two);
    }

    @Test
    @DisplayName("Going silent marks the charger offline and pushes every port as unavailable")
    void outageIsPublished() {
        updater.wentSilent("CP1", NOW.minusHours(1), NOW);

        ArgumentCaptor<ChargerData> saved = ArgumentCaptor.forClass(ChargerData.class);
        verify(redis).saveChargerData(saved.capture());
        assertThat(saved.getValue().getStatus()).isEqualTo("offline");
        verify(mysql).trackChargerStatusChange("CP1", "online", "offline");
        verify(hub).publish("CP1", "1", "Unavailable");
        verify(hub).publish("CP1", "2", "Unavailable");
    }

    @Test
    @DisplayName("Coming back pushes each port's last reported status")
    void recoveryIsPublished() {
        charger.setStatus("offline");

        updater.cameBack("CP1", NOW);

        verify(mysql).trackChargerStatusChange("CP1", "offline", "online");
        verify(hub).publish("CP1", "1", "AVAILABLE");
        verify(hub).publish("CP1", "2", "CHARGING");
    }

    @Test
    @DisplayName("No change, no writes and no push")
    void unchangedStatusIsQuiet() {
        updater.cameBack("CP1", NOW);

        verify(redis, never()).saveChargerData(any());
        verify(hub, never()).publish(anyString(), anyString(), anyString());
    }
}

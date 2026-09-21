package com.evyasense.layer.service;

import com.evyasense.layer.model.ChargerData;
import com.evyasense.layer.model.ConnectorData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * The web map counts a port as available from its status alone. A charger that has died keeps its
 * last reported port status in Redis ("Available"), so without this the map sends drivers to it.
 */
class LiveStatusServiceTest {

    private RedisService redis;
    private LiveStatusService service;

    @BeforeEach
    void setUp() {
        redis = mock(RedisService.class);
        service = new LiveStatusService(redis);
    }

    private void charger(String id, String chargerStatus, String portStatus) {
        ChargerData charger = new ChargerData();
        charger.setChargerId(id);
        charger.setStatus(chargerStatus);
        when(redis.getChargerData(id)).thenReturn(charger);

        ConnectorData port = new ConnectorData();
        port.setChargerId(id);
        port.setConnectorId("1");
        port.setStatus(portStatus);
        when(redis.getConnectorIdsForCharger(id)).thenReturn(Set.of("1"));
        when(redis.getConnectorData(id, "1")).thenReturn(port);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> firstPort(Map<String, Object> status) {
        return ((List<Map<String, Object>>) status.get("ports")).get(0);
    }

    @Test
    @DisplayName("An offline charger's ports are reported unavailable, whatever they last said")
    void offlineChargerIsNotAvailable() {
        charger("CP1", "offline", "AVAILABLE");

        Map<String, Object> status = service.buildChargerStatus("CP1");

        assertThat(status.get("chargerStatus")).isEqualTo("offline");
        assertThat(status.get("available")).isEqualTo(0);
        assertThat(firstPort(status).get("status")).isEqualTo("Unavailable");
        assertThat(firstPort(status).get("lastReportedStatus")).isEqualTo("AVAILABLE");
    }

    @Test
    @DisplayName("An online charger keeps its reported port status")
    void onlineChargerIsUnchanged() {
        charger("CP2", "online", "AVAILABLE");

        Map<String, Object> status = service.buildChargerStatus("CP2");

        assertThat(status.get("available")).isEqualTo(1);
        assertThat(firstPort(status).get("status")).isEqualTo("AVAILABLE");
        assertThat(firstPort(status)).doesNotContainKey("lastReportedStatus");
    }
}

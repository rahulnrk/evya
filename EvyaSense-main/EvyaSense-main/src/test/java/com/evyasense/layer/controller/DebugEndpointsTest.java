package com.evyasense.layer.controller;

import com.evyasense.layer.service.RedisService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.data.redis.core.RedisTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

/** SEC-004: raw Redis inspection exists only when explicitly enabled. */
class DebugEndpointsTest {

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withBean(RedisTemplate.class, () -> mock(RedisTemplate.class))
            .withBean(RedisService.class, () -> mock(RedisService.class))
            .withUserConfiguration(RedisInspectController.class);

    @Test
    @DisplayName("Absent by default")
    void offByDefault() {
        runner.run(context -> assertThat(context).doesNotHaveBean(RedisInspectController.class));
    }

    @Test
    @DisplayName("Present only with sense.debug-endpoints.enabled=true")
    void onWhenEnabled() {
        runner.withPropertyValues("sense.debug-endpoints.enabled=true")
                .run(context -> assertThat(context).hasSingleBean(RedisInspectController.class));
    }
}

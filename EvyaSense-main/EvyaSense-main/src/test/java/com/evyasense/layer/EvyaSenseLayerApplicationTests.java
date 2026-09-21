package com.evyasense.layer;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

// SEC-004: the service refuses to start without the platform JWT secret; this one is test-only.
@SpringBootTest(properties = "jwt.secret=sense-test-only-jwt-secret-0123456789abcdef")
class EvyaSenseLayerApplicationTests {

	@Test
	void contextLoads() {
	}

}

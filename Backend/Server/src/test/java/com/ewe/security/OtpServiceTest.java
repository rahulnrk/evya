package com.ewe.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * SEC-1: phone-bound OTP, lockout, no cross-phone match.
 * Runs against in-memory store (otp.use-redis=false).
 */
public class OtpServiceTest {

	private OtpService otpService;

	@BeforeEach
	void setUp() {
		otpService = new OtpService();
		ReflectionTestUtils.setField(otpService, "useRedis", false);
	}

	@Test
	void correctOtpForPhoneADoesNotVerifyPhoneB() {
		String otpA = otpService.generateOtp();
		otpService.storeOtp("9999999991", 1L, otpA);
		otpService.storeOtp("9999999992", 2L, otpService.generateOtp());

		OtpService.VerifyResult wrongPhone = otpService.verify("9999999992", otpA);
		assertFalse(wrongPhone.ok);
		assertNotEquals("OTP verified successfully", wrongPhone.status);

		// re-store A (consumed only on success for matching phone — wrong phone increments B's attempts)
		otpService.storeOtp("9999999991", 1L, otpA);
		OtpService.VerifyResult right = otpService.verify("9999999991", otpA);
		assertTrue(right.ok);
		assertEquals(1L, right.userId);
	}

	@Test
	void wrongOtpFiveTimesLocksOut() {
		String phone = "9888888888";
		String good = otpService.generateOtp();
		otpService.storeOtp(phone, 9L, good);

		for (int i = 0; i < OtpService.MAX_VERIFY_ATTEMPTS; i++) {
			OtpService.VerifyResult r = otpService.verify(phone, "000000");
			assertFalse(r.ok);
		}
		// after lockout, even correct OTP fails
		OtpService.VerifyResult locked = otpService.verify(phone, good);
		assertFalse(locked.ok);
		assertTrue(locked.status.toLowerCase().contains("too many"));
	}

	@Test
	void expiredOtpRejected() {
		String phone = "9777777777";
		String otp = otpService.generateOtp();
		otpService.storeOtp(phone, 3L, otp);
		// force created-at into the past (final fields — replace map entry)
		otpService.debugMemoryStore().put(phone,
				new OtpService.StoredOtp(otp, 3L, java.time.Instant.now().minusSeconds(400)));

		OtpService.VerifyResult r = otpService.verify(phone, otp);
		assertFalse(r.ok);
		assertEquals("OTP expired", r.status);
	}

	@Test
	void generateOtpIsSixDigits() {
		String otp = otpService.generateOtp();
		assertEquals(6, otp.length());
		assertTrue(otp.matches("\\d{6}"));
	}
}

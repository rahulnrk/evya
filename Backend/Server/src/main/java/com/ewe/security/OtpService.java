package com.ewe.security;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

/**
 * Phone-bound OTP store with rate limiting.
 * Prefers Redis when available; falls back to in-process maps (single-node only).
 */
@Service
public class OtpService {

	private static final Logger log = LoggerFactory.getLogger(OtpService.class);
	private static final SecureRandom SECURE_RANDOM = new SecureRandom();

	public static final int OTP_LENGTH = 6;
	public static final int MAX_VERIFY_ATTEMPTS = 5;
	public static final int SEND_THROTTLE_SECONDS = 60;
	public static final int LOCKOUT_SECONDS = 900;
	public static final int OTP_TTL_MINUTES = 5;

	@Value("${otp.use-redis:true}")
	private boolean useRedis;

	@Autowired(required = false)
	private StringRedisTemplate redisTemplate;

	private final ConcurrentHashMap<String, StoredOtp> memoryStore = new ConcurrentHashMap<>();
	private final ConcurrentHashMap<String, Integer> memoryAttempts = new ConcurrentHashMap<>();
	private final ConcurrentHashMap<String, Instant> memorySendAt = new ConcurrentHashMap<>();
	private final ConcurrentHashMap<String, Instant> memoryLockout = new ConcurrentHashMap<>();

	public static class StoredOtp {
		public final String otp;
		public final Long userId;
		public final Instant createdAt;

		public StoredOtp(String otp, Long userId, Instant createdAt) {
			this.otp = otp;
			this.userId = userId;
			this.createdAt = createdAt;
		}
	}

	public static class SendResult {
		public final boolean ok;
		public final String status;
		public final String otp; // only for tests / when SMS skipped

		public SendResult(boolean ok, String status, String otp) {
			this.ok = ok;
			this.status = status;
			this.otp = otp;
		}
	}

	public static class VerifyResult {
		public final boolean ok;
		public final String status;
		public final Long userId;
		public final String phone;

		public VerifyResult(boolean ok, String status, Long userId, String phone) {
			this.ok = ok;
			this.status = status;
			this.userId = userId;
			this.phone = phone;
		}
	}

	public String generateOtp() {
		int n = SECURE_RANDOM.nextInt(1_000_000);
		return String.format("%06d", n);
	}

	public SendResult storeOtp(String phone, Long userId, String otp) {
		if (isSendThrottled(phone)) {
			return new SendResult(false, "OTP send throttled. Try again later.", null);
		}
		if (isLockedOut(phone)) {
			return new SendResult(false, "Too many attempts. Try again later.", null);
		}
		Instant now = Instant.now();
		if (redisAvailable()) {
			String key = otpKey(phone);
			redisTemplate.opsForValue().set(key, otp + "|" + userId + "|" + now.toEpochMilli(),
					Duration.ofMinutes(OTP_TTL_MINUTES));
			redisTemplate.opsForValue().set(sendKey(phone), now.toString(),
					Duration.ofSeconds(SEND_THROTTLE_SECONDS));
			redisTemplate.delete(attemptsKey(phone));
		} else {
			memoryStore.put(phone, new StoredOtp(otp, userId, now));
			memorySendAt.put(phone, now);
			memoryAttempts.remove(phone);
		}
		return new SendResult(true, "OTP sent successfully", otp);
	}

	/**
	 * Verify OTP for this phone only. Wrong code increments attempts; N failures lock out.
	 */
	public VerifyResult verify(String phone, String otp) {
		if (phone == null || phone.isEmpty() || otp == null || otp.isEmpty()) {
			return new VerifyResult(false, "Invalid or expired OTP", null, phone);
		}
		if (isLockedOut(phone)) {
			return new VerifyResult(false, "Too many attempts. Try again later.", null, phone);
		}

		StoredOtp stored = load(phone);
		if (stored == null) {
			return new VerifyResult(false, "Invalid or expired OTP", null, phone);
		}
		if (Duration.between(stored.createdAt, Instant.now()).toMinutes() > OTP_TTL_MINUTES) {
			clearOtp(phone);
			return new VerifyResult(false, "OTP expired", null, phone);
		}
		if (!stored.otp.equals(otp.trim())) {
			int attempts = incrementAttempts(phone);
			if (attempts >= MAX_VERIFY_ATTEMPTS) {
				setLockout(phone);
				clearOtp(phone);
				return new VerifyResult(false, "Too many attempts. Try again later.", null, phone);
			}
			return new VerifyResult(false, "Invalid or expired OTP", null, phone);
		}

		// success — consume OTP and clear attempts
		Long userId = stored.userId;
		clearOtp(phone);
		clearAttempts(phone);
		return new VerifyResult(true, "OTP verified successfully", userId, phone);
	}

	private boolean redisAvailable() {
		if (!useRedis || redisTemplate == null) {
			return false;
		}
		try {
			redisTemplate.getConnectionFactory().getConnection().ping();
			return true;
		} catch (Exception e) {
			log.warn("Redis unavailable for OTP store, using in-memory fallback: {}", e.getMessage());
			return false;
		}
	}

	private StoredOtp load(String phone) {
		if (redisAvailable()) {
			String raw = redisTemplate.opsForValue().get(otpKey(phone));
			if (raw == null) {
				return null;
			}
			String[] parts = raw.split("\\|");
			if (parts.length < 3) {
				return null;
			}
			return new StoredOtp(parts[0], Long.valueOf(parts[1]), Instant.ofEpochMilli(Long.parseLong(parts[2])));
		}
		return memoryStore.get(phone);
	}

	private void clearOtp(String phone) {
		if (redisAvailable()) {
			redisTemplate.delete(otpKey(phone));
		}
		memoryStore.remove(phone);
	}

	private int incrementAttempts(String phone) {
		if (redisAvailable()) {
			Long v = redisTemplate.opsForValue().increment(attemptsKey(phone));
			if (v != null && v == 1L) {
				redisTemplate.expire(attemptsKey(phone), Duration.ofMinutes(OTP_TTL_MINUTES));
			}
			return v == null ? 1 : v.intValue();
		}
		int next = memoryAttempts.getOrDefault(phone, 0) + 1;
		memoryAttempts.put(phone, next);
		return next;
	}

	private void clearAttempts(String phone) {
		if (redisAvailable()) {
			redisTemplate.delete(attemptsKey(phone));
		}
		memoryAttempts.remove(phone);
	}

	private boolean isSendThrottled(String phone) {
		if (redisAvailable()) {
			return Boolean.TRUE.equals(redisTemplate.hasKey(sendKey(phone)));
		}
		Instant last = memorySendAt.get(phone);
		return last != null && Duration.between(last, Instant.now()).getSeconds() < SEND_THROTTLE_SECONDS;
	}

	private boolean isLockedOut(String phone) {
		if (redisAvailable()) {
			return Boolean.TRUE.equals(redisTemplate.hasKey(lockKey(phone)));
		}
		Instant until = memoryLockout.get(phone);
		if (until == null) {
			return false;
		}
		if (Instant.now().isAfter(until)) {
			memoryLockout.remove(phone);
			return false;
		}
		return true;
	}

	private void setLockout(String phone) {
		if (redisAvailable()) {
			redisTemplate.opsForValue().set(lockKey(phone), "1", Duration.ofSeconds(LOCKOUT_SECONDS));
		} else {
			memoryLockout.put(phone, Instant.now().plusSeconds(LOCKOUT_SECONDS));
		}
	}

	private static String otpKey(String phone) {
		return "otp:code:" + phone;
	}

	private static String attemptsKey(String phone) {
		return "otp:attempts:" + phone;
	}

	private static String sendKey(String phone) {
		return "otp:send:" + phone;
	}

	private static String lockKey(String phone) {
		return "otp:lock:" + phone;
	}

	/** Test helper: inspect in-memory only (no Redis). */
	public Map<String, StoredOtp> debugMemoryStore() {
		return memoryStore;
	}
}

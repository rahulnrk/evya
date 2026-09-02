package com.ewe.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.beans.factory.annotation.Value;

@Configuration
@ConditionalOnProperty(name = "otp.use-redis", havingValue = "true", matchIfMissing = true)
public class RedisConfig {

	@Value("${spring.redis.host:localhost}")
	private String host;

	@Value("${spring.redis.port:6379}")
	private int port;

	@Bean
	public RedisConnectionFactory redisConnectionFactory() {
		RedisStandaloneConfiguration cfg = new RedisStandaloneConfiguration(host, port);
		return new LettuceConnectionFactory(cfg);
	}

	@Bean
	public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory factory) {
		return new StringRedisTemplate(factory);
	}
}

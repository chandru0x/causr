package com.cursr.backend.anomaly;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@Profile("!test")
@ConditionalOnProperty(name = "app.anomalies.kafka-consumer-enabled", havingValue = "true")
public class AnomalyKafkaListener {

  private static final Logger log = LoggerFactory.getLogger(AnomalyKafkaListener.class);

  private final StringRedisTemplate stringRedisTemplate;
  private final ObjectMapper objectMapper;
  private final String redisChannelPrefix;

  public AnomalyKafkaListener(
      StringRedisTemplate stringRedisTemplate,
      ObjectMapper objectMapper,
      @Value("${app.anomalies.redis-channel-prefix}") String redisChannelPrefix) {
    this.stringRedisTemplate = stringRedisTemplate;
    this.objectMapper = objectMapper;
    this.redisChannelPrefix = redisChannelPrefix;
  }

  @KafkaListener(topics = "${app.anomalies.kafka-topic}", groupId = "${spring.kafka.consumer.group-id}")
  public void consumeAnomaly(String json) {
    try {
      JsonNode node = objectMapper.readTree(json);
      String tenantId = resolveTenantId(node);
      String channel = redisChannelPrefix + ":" + tenantId;
      stringRedisTemplate.convertAndSend(channel, json);
    } catch (Exception e) {
      log.warn("Anomaly Kafka message skipped: {}", e.getMessage());
    }
  }

  private String resolveTenantId(JsonNode node) {
    JsonNode tenantId = node.get("tenantId");
    if (tenantId != null && tenantId.isTextual() && !tenantId.asText().isBlank()) {
      return tenantId.asText();
    }
    return "default";
  }
}

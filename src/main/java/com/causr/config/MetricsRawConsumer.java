package com.causr.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.causr.dto.HostMetricsDto;
import com.causr.service.AnomalyEngine;
import com.causr.service.AnomalyPublisher;
import com.causr.service.OtlHostMetricsMapper;

import io.opentelemetry.proto.metrics.v1.MetricsData;

@Service
public class MetricsRawConsumer {

	private static final Logger log = LoggerFactory.getLogger(MetricsRawConsumer.class);

	private static final String DESTINATION_HOST_METRICS = "/topic/host-metrics";

	private final SimpMessagingTemplate messagingTemplate;

	private final OtlHostMetricsMapper otlHostMetricsMapper;

	private final AnomalyEngine anomalyEngine;

	private final AnomalyPublisher anomalyPublisher;

	public MetricsRawConsumer(
			SimpMessagingTemplate messagingTemplate,
			OtlHostMetricsMapper otlHostMetricsMapper,
			AnomalyEngine anomalyEngine,
			AnomalyPublisher anomalyPublisher) {

		this.messagingTemplate = messagingTemplate;
		this.otlHostMetricsMapper = otlHostMetricsMapper;
		this.anomalyEngine = anomalyEngine;
		this.anomalyPublisher = anomalyPublisher;
	}

	@KafkaListener(topics = "${causr.kafka.topics.metrics-raw:metrics.raw}")
	public void consume(byte[] message) {

		try {

			MetricsData metricsData = MetricsData.parseFrom(message);

			HostMetricsDto dto = otlHostMetricsMapper.map(metricsData);

			messagingTemplate.convertAndSend(
					DESTINATION_HOST_METRICS,
					dto
			);

			anomalyPublisher.publishAll(
					anomalyEngine.detectHost(dto)
			);

		} catch (Exception e) {

			log.warn("Failed to parse or forward metrics.raw OTLP batch", e);
		}
	}
}

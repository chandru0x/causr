package com.causr.service;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.causr.dto.AnomalyDto;

@Service
public class AnomalyPublisher {

	private static final Logger log = LoggerFactory.getLogger(AnomalyPublisher.class);

	private static final String DESTINATION_ANOMALIES = "/topic/anomalies";

	private final KafkaTemplate<String, String> kafkaTemplate;

	private final SimpMessagingTemplate messagingTemplate;

	@Value("${causr.kafka.topics.logs-anomalies:logs.anomalies}")
	private String anomaliesTopic;

	public AnomalyPublisher(
			KafkaTemplate<String, String> kafkaTemplate,
			SimpMessagingTemplate messagingTemplate) {

		this.kafkaTemplate = kafkaTemplate;
		this.messagingTemplate = messagingTemplate;
	}

	public void publishAll(List<AnomalyDto> anomalies) {

		for (AnomalyDto anomaly : anomalies) {
			publish(anomaly);
		}
	}

	public void publish(AnomalyDto anomaly) {

		String json = AnomalyJson.toJson(anomaly);

		kafkaTemplate.send(
				anomaliesTopic,
				anomaly.getService(),
				json
		);

		messagingTemplate.convertAndSend(
				DESTINATION_ANOMALIES,
				anomaly
		);

		log.info(
				"Anomaly {} [{}] {}",
				anomaly.getType(),
				anomaly.getService(),
				anomaly.getMessage()
		);
	}
}

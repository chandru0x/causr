package com.causr.config;

import java.nio.charset.StandardCharsets;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.causr.dto.AnomalyDto;
import com.causr.service.AnomalyJson;
import com.causr.service.PagerDutyAlertService;
import com.causr.service.SlackAlertConsumer;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class AnomalyConsumer {

    private static final String DESTINATION =
            "/topic/anomalies";

    private final SimpMessagingTemplate messagingTemplate;

    private final SlackAlertConsumer slackAlertService;

    private final PagerDutyAlertService
            pagerDutyAlertService;

    public AnomalyConsumer(

            SimpMessagingTemplate messagingTemplate,

            SlackAlertConsumer slackAlertService,

            PagerDutyAlertService
                    pagerDutyAlertService) {

        this.messagingTemplate =
                messagingTemplate;

        this.slackAlertService =
                slackAlertService;

        this.pagerDutyAlertService =
                pagerDutyAlertService;
    }

    @KafkaListener(
            topics = "${causr.kafka.topics.logs-anomalies:logs.anomalies}",
            groupId = "anomaly-consumer-group"
    )
    public void consume(byte[] message) {

        AnomalyDto anomaly;

        try {

            String json = new String(message, StandardCharsets.UTF_8);

            anomaly = AnomalyJson.fromJson(json);

        } catch (Exception e) {

            log.warn("Failed to parse anomaly from Kafka", e);

            return;
        }

        log.info(
                "Received anomaly: {}",
                anomaly
        );

        /*
         * 1. Push to frontend dashboard
         */
        messagingTemplate.convertAndSend(
                DESTINATION,
                anomaly
        );

        /*
         * 2. Send Slack alert
         */
        slackAlertService.sendAlert(

                "🚨 Anomaly Detected\n" +

                "Service: " +
                anomaly.getService() + "\n" +

                "Type: " +
                anomaly.getType() + "\n" +

                "Severity: " +
                anomaly.getSeverity() + "\n" +

                "Message: " +
                anomaly.getMessage()
        );

        /*
         * 3. Send PagerDuty only for critical severity
         */
        if ("critical".equalsIgnoreCase(anomaly.getSeverity())) {

            log.info(
                    "Triggering PagerDuty for critical anomaly type={} service={}",
                    anomaly.getType(),
                    anomaly.getService()
            );

            pagerDutyAlertService.triggerIncident(
                    anomaly.getService(),
                    anomaly.getSeverity(),
                    anomaly.getMessage()
            );
        } else {

            log.debug(
                    "Skipping PagerDuty — severity '{}' is not critical (type={} service={})",
                    anomaly.getSeverity(),
                    anomaly.getType(),
                    anomaly.getService()
            );
        }
    }
}
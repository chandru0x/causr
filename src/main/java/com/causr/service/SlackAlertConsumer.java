package com.causr.service;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class SlackAlertConsumer {

    private final RestTemplate restTemplate;

    private final String slackWebhookUrl;

    public SlackAlertConsumer(
            RestTemplate restTemplate,

            @Value("${slack.webhook-url}")
            String slackWebhookUrl) {

        this.restTemplate = restTemplate;

        this.slackWebhookUrl =
                slackWebhookUrl;
    }

    public void sendAlert(
            String message) {

        Map<String, String> payload =
                Map.of(
                    "text",
                    message
                );

        restTemplate.postForEntity(
                slackWebhookUrl,
                payload,
                String.class
        );
    }
}
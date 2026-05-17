package com.causr.service;

import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

@Service
public class PagerDutyAlertService {

	private static final Logger log = LoggerFactory.getLogger(PagerDutyAlertService.class);

	private final RestTemplate restTemplate;

	private final String pagerDutyUrl;

	private final String routingKey;

	private final boolean enabled;

	public PagerDutyAlertService(
			RestTemplate restTemplate,
			@Value("${pagerduty.url}") String pagerDutyUrl,
			@Value("${pagerduty.routing-key}") String routingKey,
			@Value("${pagerduty.enabled:true}") boolean enabled) {

		this.restTemplate = restTemplate;
		this.pagerDutyUrl = pagerDutyUrl;
		this.routingKey = routingKey;
		this.enabled = enabled;

		log.info(
				"PagerDuty initialized enabled={} url={} routingKey={}",
				enabled,
				pagerDutyUrl,
				maskRoutingKey(routingKey)
		);
	}

	public void triggerIncident(
			String service,
			String severity,
			String message) {

		if (!enabled) {

			log.debug(
					"PagerDuty disabled — skipping incident service={} severity={}",
					service,
					severity
			);

			return;
		}

		Map<String, Object> body = buildPayload(service, severity, message);

		log.info(
				"PagerDuty trigger request service={} severity={} summary={} url={}",
				service,
				severity,
				message,
				pagerDutyUrl
		);

		log.debug("PagerDuty request body={}", body);

		HttpHeaders headers = new HttpHeaders();

		headers.setContentType(MediaType.APPLICATION_JSON);

		HttpEntity<Map<String, Object>> request =
				new HttpEntity<>(body, headers);

		try {

			ResponseEntity<String> response = restTemplate.postForEntity(
					pagerDutyUrl,
					request,
					String.class
			);

			log.info(
					"PagerDuty trigger success service={} status={} body={}",
					service,
					response.getStatusCode(),
					response.getBody()
			);

		} catch (RestClientResponseException e) {

			log.error(
					"PagerDuty API error service={} status={} responseBody={} message={}",
					service,
					e.getStatusCode(),
					e.getResponseBodyAsString(),
					e.getMessage(),
					e
			);

		} catch (Exception e) {

			log.error(
					"PagerDuty request failed service={} severity={} url={}",
					service,
					severity,
					pagerDutyUrl,
					e
			);
		}
	}

	private Map<String, Object> buildPayload(
			String service,
			String severity,
			String message) {

		Map<String, Object> payload = new LinkedHashMap<>();

		payload.put("summary", message);
		payload.put("severity", mapSeverity(severity));
		payload.put("source", service);

		Map<String, Object> body = new LinkedHashMap<>();

		body.put("routing_key", routingKey);
		body.put("event_action", "trigger");
		body.put("payload", payload);

		return body;
	}

	/** PagerDuty Events API v2: critical, error, warning, info. */
	private static String mapSeverity(String severity) {

		if (severity == null) {
			return "error";
		}

		return switch (severity.toLowerCase()) {
			case "critical" -> "critical";
			case "warning" -> "warning";
			case "info" -> "info";
			default -> "error";
		};
	}

	private static String maskRoutingKey(String key) {

		if (key == null || key.length() < 8) {
			return "***";
		}

		return key.substring(0, 4) + "***" + key.substring(key.length() - 4);
	}
}

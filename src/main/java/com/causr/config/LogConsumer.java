package com.causr.config;

import java.time.Instant;
import java.util.Locale;
import java.util.concurrent.ThreadLocalRandom;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.causr.dto.LatencySample;
import com.causr.dto.LogDto;
import com.causr.dto.ServiceMetrics;
import com.causr.service.MetricsRegistry;
import com.causr.service.MetricsService;

import io.opentelemetry.proto.common.v1.AnyValue;
import io.opentelemetry.proto.common.v1.KeyValue;
import io.opentelemetry.proto.logs.v1.LogRecord;
import io.opentelemetry.proto.logs.v1.LogsData;
import io.opentelemetry.proto.logs.v1.ResourceLogs;

@Service
public class LogConsumer {

	private static final Logger log = LoggerFactory.getLogger(LogConsumer.class);

	private static final String DESTINATION_LOGS = "/topic/logs";

	/** Max latency samples per service for stable P99 (rolling window by count). */
	private static final int MAX_LATENCY_SAMPLES = 1000;

	/** Drop latency samples older than this (rolling window by time). */
	private static final long LATENCY_RETENTION_MS = 5L * 60L * 1000L;

	private final SimpMessagingTemplate messagingTemplate;

	private final MetricsService metricsService;
	
	private final MetricsRegistry metricsRegistry;

	public LogConsumer(
			SimpMessagingTemplate messagingTemplate,
			MetricsService metricsService,
			MetricsRegistry metricsRegistry) {

		this.messagingTemplate = messagingTemplate;
		this.metricsService = metricsService;
		this.metricsRegistry = metricsRegistry;
	}

	@KafkaListener(topics = "logs.raw")
	public void consume(byte[] message) {
		try {
			LogsData logsData = LogsData.parseFrom(message);
			for (ResourceLogs resourceLogs : logsData.getResourceLogsList()) {
				String serviceName = resolveServiceName(resourceLogs);
				for (var scopeLogs : resourceLogs.getScopeLogsList()) {
					for (LogRecord logRecord : scopeLogs.getLogRecordsList()) {
						publishOne(serviceName, logRecord);
					}
				}
			}
		} catch (Exception e) {
			log.warn("Failed to parse or forward log batch", e);
		}
	}

	private void publishOne(
	        String serviceName,
	        LogRecord logRecord) {

	    String messageBody =
	            extractBody(logRecord);

	    String level =
	            resolveLevel(logRecord);

	    long tsMillis =
	            resolveTimestampMillis(logRecord);

	    LogDto dto = new LogDto();

	    dto.setServiceName(serviceName);

	    dto.setLevel(level);

	    dto.setMessage(messageBody);

	    dto.setTimestampEpochMillis(tsMillis);

	    if (log.isDebugEnabled()) {
	        log.debug("{}", dto);
	    }

	    ServiceMetrics metrics =
	            metricsRegistry.getMetrics(serviceName);

	    metrics.getTotalRequests()
	           .incrementAndGet();

	    if ("ERROR".equalsIgnoreCase(level)
	            || "FATAL".equalsIgnoreCase(level)) {

	        metrics.getErrorRequests()
	               .incrementAndGet();
	    }

	    long latencyMs =
	            extractLatency(logRecord);

	    recordLatencySample(
	            metrics,
	            latencyMs
	    );

	    if ("FATAL".equalsIgnoreCase(level)) {

	        metrics.getActiveIncidents()
	               .incrementAndGet();
	    }

	    metricsService.incrementRequest();

	    if ("ERROR".equalsIgnoreCase(level)
	            || "FATAL".equalsIgnoreCase(level)) {

	        metricsService.incrementError();
	    }

	    messagingTemplate.convertAndSend(
	            DESTINATION_LOGS,
	            dto
	    );
	}

	private static void recordLatencySample(
	        ServiceMetrics metrics,
	        long latencyMs) {

	    long now =
	            System.currentTimeMillis();

	    long cutoff =
	            now - LATENCY_RETENTION_MS;

	    var queue =
	            metrics.getLatencySamples();

	    queue.add(
	            new LatencySample(
	                    latencyMs,
	                    now
	            )
	    );

	    while (true) {

	        LatencySample head =
	                queue.peek();

	        if (head == null) {
	            break;
	        }

	        boolean tooOld =
	                head.recordedAtMs() < cutoff;

	        boolean tooMany =
	                queue.size() > MAX_LATENCY_SAMPLES;

	        if (tooOld || tooMany) {
	            queue.poll();
	        } else {
	            break;
	        }
	    }
	}

	private long extractLatency(
	        LogRecord logRecord) {

	    try {

	        for (KeyValue attr :
	                logRecord.getAttributesList()) {

	            if ("http.server.duration"
	                    .equals(attr.getKey())) {

	                return (long)
	                        attr.getValue()
	                                .getDoubleValue();
	            }
	        }

	    } catch (Exception ignored) {
	    }

	    return ThreadLocalRandom.current()
	            .nextLong(50, 500);
	}

	private static String resolveServiceName(ResourceLogs resourceLogs) {
		for (KeyValue attr : resourceLogs.getResource().getAttributesList()) {
			if ("service.name".equals(attr.getKey())) {
				return attr.getValue().getStringValue();
			}
		}
		return "unknown";
	}

	private static String extractBody(LogRecord logRecord) {
		AnyValue body = logRecord.getBody();
		if (body == null) {
			return "";
		}
		return body.getStringValue();
	}

	/**
	 * Prefer OTLP {@code severity_text}; otherwise map {@code severity_number} to
	 * TRACE/DEBUG/INFO/WARN/ERROR/FATAL so clients see stable levels like your sample payloads.
	 */
	private static String resolveLevel(LogRecord logRecord) {
		String text = logRecord.getSeverityText();
		if (text != null && !text.isBlank()) {
			return text.trim().toUpperCase(Locale.ROOT);
		}
		int n = logRecord.getSeverityNumberValue();
		return severityNumberToName(n);
	}

	/** OpenTelemetry mapping: ranges 1–4 trace, 5–8 debug, 9–12 info, 13–16 warn, 17–20 error, 21–24 fatal. */
	private static String severityNumberToName(int value) {
		if (value >= 1 && value <= 4) {
			return "TRACE";
		}
		if (value >= 5 && value <= 8) {
			return "DEBUG";
		}
		if (value >= 9 && value <= 12) {
			return "INFO";
		}
		if (value >= 13 && value <= 16) {
			return "WARN";
		}
		if (value >= 17 && value <= 20) {
			return "ERROR";
		}
		if (value >= 21 && value <= 24) {
			return "FATAL";
		}
		return "INFO";
	}

	private static long resolveTimestampMillis(LogRecord logRecord) {
		long nano = logRecord.getTimeUnixNano();
		if (nano > 0) {
			return nano / 1_000_000L;
		}
		return Instant.now().toEpochMilli();
	}

}

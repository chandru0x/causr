package com.causr.service;

import java.util.ArrayList;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

import com.causr.dto.AnomalyDto;
import com.causr.dto.HostMetricsDto;
import com.causr.dto.MetricsDto;

/**
 * Rule-based anomaly detection for log-derived and host metrics.
 */
@Service
public class AnomalyEngine {

	static final double ERROR_RATE_THRESHOLD_PCT = 5.0;

	static final double P99_LATENCY_THRESHOLD_MS = 2000.0;

	static final double TRAFFIC_DROP_BASELINE_MIN_RPS = 10.0;

	static final double TRAFFIC_DROP_RATIO = 0.3;

	static final long SERVICE_SILENCE_MS = 60_000L;

	static final double CPU_THRESHOLD_PCT = 90.0;

	static final long CPU_HIGH_DURATION_MS = 30_000L;

	static final int MEMORY_LEAK_MIN_SAMPLES = 5;

	static final double MEMORY_LEAK_MIN_TOTAL_RISE_PCT = 15.0;

	static final long ANOMALY_COOLDOWN_MS = 60_000L;

	private static final String HOST_SERVICE = "host";

	private final ConcurrentHashMap<String, Double> ingestBaselineRps =
			new ConcurrentHashMap<>();

	private final ConcurrentHashMap<String, Long> lastFiredMs =
			new ConcurrentHashMap<>();

	private final Deque<Double> memoryUtilHistory = new ArrayDeque<>();

	long cpuHighSinceMs;

	/** Log / request derived rules (per service or fleet aggregate). */
	public List<AnomalyDto> detect(MetricsDto metrics) {

		List<AnomalyDto> anomalies = new ArrayList<>();

		String service = metrics.getService();

		double errorRate = metrics.getErrorRate();

		if (errorRate > ERROR_RATE_THRESHOLD_PCT) {

			maybeAdd(
					anomalies,
					service,
					"HIGH_ERROR_RATE",
					"critical",
					String.format(
							"Error rate %.1f%% exceeds %.0f%%",
							errorRate,
							ERROR_RATE_THRESHOLD_PCT
					)
			);
		}

		double p99 = metrics.getP99Latency();

		if (p99 > P99_LATENCY_THRESHOLD_MS) {

			maybeAdd(
					anomalies,
					service,
					"HIGH_P99",
					"warning",
					String.format(
							"P99 latency %.0f ms exceeds %.0f ms",
							p99,
							P99_LATENCY_THRESHOLD_MS
					)
			);
		}

		double currentRps = metrics.getIngestRate();

		updateIngestBaseline(service, currentRps);

		double baseline = ingestBaselineRps.getOrDefault(service, 0.0);

		if (baseline >= TRAFFIC_DROP_BASELINE_MIN_RPS
				&& currentRps < TRAFFIC_DROP_RATIO * baseline) {

			maybeAdd(
					anomalies,
					service,
					"TRAFFIC_DROP",
					"critical",
					String.format(
							"Ingest %.1f logs/s is below 30%% of baseline %.1f logs/s",
							currentRps,
							baseline
					)
			);
		}

		long lastSeen = metrics.getLastLogTimestampMs();

		if (lastSeen > 0) {

			long silentMs =
					System.currentTimeMillis() - lastSeen;

			if (silentMs > SERVICE_SILENCE_MS) {

				maybeAdd(
						anomalies,
						service,
						"SERVICE_DOWN",
						"critical",
						String.format(
								"No logs for %d s (last seen %d ms ago)",
								silentMs / 1000L,
								silentMs
						)
				);
			}
		}

		return anomalies;
	}

	/** Infra rules from OTLP host metrics. */
	public List<AnomalyDto> detectHost(HostMetricsDto host) {

		List<AnomalyDto> anomalies = new ArrayList<>();

		Double cpu = host.getCpuUtilization();

		if (cpu != null) {

			long now = System.currentTimeMillis();

			if (cpu > CPU_THRESHOLD_PCT) {

				if (cpuHighSinceMs == 0L) {

					cpuHighSinceMs = now;
				} else if (now - cpuHighSinceMs >= CPU_HIGH_DURATION_MS) {

					maybeAdd(
							anomalies,
							HOST_SERVICE,
							"CPU_SPIKE",
							"warning",
							String.format(
									"CPU %.1f%% above %.0f%% for %d s",
									cpu,
									CPU_THRESHOLD_PCT,
									CPU_HIGH_DURATION_MS / 1000L
							)
					);

					cpuHighSinceMs = 0L;
				}
			} else {

				cpuHighSinceMs = 0L;
			}
		}

		Double memoryUtil = host.getMemoryUtilization();

		if (memoryUtil != null) {

			synchronized (memoryUtilHistory) {

				memoryUtilHistory.addLast(memoryUtil);

				while (memoryUtilHistory.size() > 12) {

					memoryUtilHistory.removeFirst();
				}

				if (isMemoryLeakTrend(memoryUtilHistory)) {

					maybeAdd(
							anomalies,
							HOST_SERVICE,
							"MEMORY_LEAK",
							"warning",
							String.format(
									"Memory utilization rising monotonically to %.1f%%",
									memoryUtil
							)
					);

					memoryUtilHistory.clear();
				}
			}
		}

		return anomalies;
	}

	void updateIngestBaseline(
			String service,
			double currentRps) {

		if (currentRps <= 0.0) {
			return;
		}

		ingestBaselineRps.merge(
				service,
				currentRps,
				(prev, cur) -> prev * 0.95 + cur * 0.05
		);
	}

	static boolean isMemoryLeakTrend(Deque<Double> samples) {

		if (samples.size() < MEMORY_LEAK_MIN_SAMPLES) {
			return false;
		}

		Double[] arr = samples.toArray(new Double[0]);

		int start = arr.length - MEMORY_LEAK_MIN_SAMPLES;

		for (int i = start + 1; i < arr.length; i++) {

			if (arr[i] <= arr[i - 1]) {
				return false;
			}
		}

		double rise = arr[arr.length - 1] - arr[start];

		return rise >= MEMORY_LEAK_MIN_TOTAL_RISE_PCT;
	}

	private void maybeAdd(
			List<AnomalyDto> anomalies,
			String service,
			String type,
			String severity,
			String message) {

		if (!shouldFire(service, type)) {
			return;
		}

		anomalies.add(
				create(
						service,
						type,
						severity,
						message
				)
		);
	}

	private boolean shouldFire(
			String service,
			String type) {

		String key = service + ":" + type;

		long now = System.currentTimeMillis();

		Long last = lastFiredMs.get(key);

		if (last != null && now - last < ANOMALY_COOLDOWN_MS) {
			return false;
		}

		lastFiredMs.put(key, now);

		return true;
	}

	private static AnomalyDto create(
			String service,
			String type,
			String severity,
			String message) {

		AnomalyDto dto = new AnomalyDto();

		dto.setService(service);

		dto.setType(type);

		dto.setSeverity(severity);

		dto.setMessage(message);

		dto.setTimestamp(System.currentTimeMillis());

		return dto;
	}
}

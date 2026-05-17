package com.causr.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.causr.dto.AnomalyDto;
import com.causr.dto.HostMetricsDto;
import com.causr.dto.MetricsDto;

class AnomalyEngineTest {

	private AnomalyEngine engine;

	@BeforeEach
	void setUp() {

		engine = new AnomalyEngine();
	}

	@Test
	void detectsHighErrorRate() {

		MetricsDto metrics = baseMetrics("payments");

		metrics.setErrorRate(12.0);

		List<AnomalyDto> found = engine.detect(metrics);

		assertTrue(
				found.stream()
						.anyMatch(a -> "HIGH_ERROR_RATE".equals(a.getType()))
		);
	}

	@Test
	void detectsHighP99() {

		MetricsDto metrics = baseMetrics("api");

		metrics.setP99Latency(2500.0);

		List<AnomalyDto> found = engine.detect(metrics);

		assertTrue(
				found.stream()
						.anyMatch(a -> "HIGH_P99".equals(a.getType()))
		);
	}

	@Test
	void detectsTrafficDropAfterBaselineEstablished() {

		String service = "orders";

		for (int i = 0; i < 20; i++) {

			MetricsDto warm = baseMetrics(service);

			warm.setIngestRate(500.0);

			engine.detect(warm);
		}

		MetricsDto drop = baseMetrics(service);

		drop.setIngestRate(20.0);

		List<AnomalyDto> found = engine.detect(drop);

		assertTrue(
				found.stream()
						.anyMatch(a -> "TRAFFIC_DROP".equals(a.getType()))
		);
	}

	@Test
	void detectsServiceSilence() {

		MetricsDto metrics = baseMetrics("auth");

		metrics.setLastLogTimestampMs(
				System.currentTimeMillis() - 90_000L
		);

		List<AnomalyDto> found = engine.detect(metrics);

		assertTrue(
				found.stream()
						.anyMatch(a -> "SERVICE_DOWN".equals(a.getType()))
		);
	}

	@Test
	void detectsMemoryLeakTrend() {

		Deque<Double> samples = new ArrayDeque<>();

		samples.add(60.0);

		samples.add(65.0);

		samples.add(70.0);

		samples.add(75.0);

		samples.add(80.0);

		assertTrue(AnomalyEngine.isMemoryLeakTrend(samples));
	}

	@Test
	void ignoresFlatMemoryTrend() {

		Deque<Double> samples = new ArrayDeque<>();

		samples.add(60.0);

		samples.add(65.0);

		samples.add(64.0);

		samples.add(70.0);

		samples.add(75.0);

		assertFalse(AnomalyEngine.isMemoryLeakTrend(samples));
	}

	@Test
	void detectsHostCpuSpikeAfterSustainedHighUtilization() {

		HostMetricsDto host = new HostMetricsDto();

		host.setCpuUtilization(95.0);

		assertEquals(0, engine.detectHost(host).size());

		engine.cpuHighSinceMs =
				System.currentTimeMillis() - 31_000L;

		List<AnomalyDto> found = engine.detectHost(host);

		assertEquals(1, found.size());

		assertEquals("CPU_SPIKE", found.get(0).getType());
	}

	private static MetricsDto baseMetrics(String service) {

		MetricsDto metrics = new MetricsDto();

		metrics.setService(service);

		metrics.setErrorRate(0.0);

		metrics.setP99Latency(100.0);

		metrics.setIngestRate(100.0);

		return metrics;
	}
}

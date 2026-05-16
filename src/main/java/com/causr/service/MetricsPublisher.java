package com.causr.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.causr.dto.FleetServicesDto;
import com.causr.dto.LatencySample;
import com.causr.dto.MetricsDto;
import com.causr.dto.ServiceFleetRowDto;
import com.causr.dto.ServiceMetrics;

/**
 * Publishes fleet metrics: one aggregated {@link MetricsDto} per second to {@code /topic/metrics},
 * and one per-service {@link FleetServicesDto} to {@code /topic/fleet-services} for the fleet table.
 * <p>
 * Request and error counters are <strong>rolling totals</strong> (never reset here); each publish
 * includes cumulative {@code totalRequests} / {@code errorCount} and per-tick {@code rps} /
 * {@code ingestRate} as lines observed in the last second (delta) for charts;
 * {@code errorsPerSecond} is the error-line delta over the same interval.
 * <p>
 * P99 uses merged {@link LatencySample} queues per service (bounded to last 1000 samples and 5
 * minutes in {@link com.causr.config.LogConsumer}).
 */
@Service
public class MetricsPublisher {

	private static final String FLEET_SERVICE = "fleet";

	private static final String DESTINATION_FLEET_SERVICES = "/topic/fleet-services";

	/** Row is healthy when no FATAL-derived incidents and rolling error rate is below this %. */
	private static final double HEALTHY_MAX_ERROR_PCT = 5.0;

	private final MetricsRegistry metricsRegistry;

	private final SimpMessagingTemplate messagingTemplate;

	/** Previous fleet cumulative totals for per-second delta (chart / ingest rate). */
	private final AtomicLong lastFleetTotal = new AtomicLong(0L);

	private final AtomicLong lastFleetErrors = new AtomicLong(0L);

	/** Per-service previous cumulative totals for 1s RPS delta: [0] = lines, [1] = errors. */
	private final ConcurrentHashMap<String, long[]> serviceLastTotals = new ConcurrentHashMap<>();

	public MetricsPublisher(
			MetricsRegistry metricsRegistry,
			SimpMessagingTemplate messagingTemplate) {

		this.metricsRegistry = metricsRegistry;
		this.messagingTemplate = messagingTemplate;
	}

	@Scheduled(fixedRate = 1000)
	public void publishMetrics() {

		Map<String, ServiceMetrics> all =
				metricsRegistry.getAllMetrics();

		if (all.isEmpty()) {
			return;
		}

		long sumTotal = 0L;

		long sumErr = 0L;

		long sumIncidentCounter = 0L;

		List<Long> mergedLatencyMillis =
				new ArrayList<>();

		for (ServiceMetrics metrics : all.values()) {

			sumTotal +=
					metrics.getTotalRequests()
							.get();

			sumErr +=
					metrics.getErrorRequests()
							.get();

			sumIncidentCounter +=
					metrics.getActiveIncidents()
							.get();

			for (LatencySample s : metrics.getLatencySamples()) {
				mergedLatencyMillis.add(
						s.millisMs()
				);
			}
		}

		double errorRate = 0.0;

		if (sumTotal > 0) {

			errorRate =
					((double) sumErr / sumTotal) * 100.0;
		}

		double p99 =
				p99FromMillis(mergedLatencyMillis);

		long prevTotal =
				lastFleetTotal.get();

		long prevErr =
				lastFleetErrors.get();

		long deltaTotal =
				Math.max(
						0L,
						sumTotal - prevTotal
				);

		long deltaErr =
				Math.max(
						0L,
						sumErr - prevErr
				);

		lastFleetTotal.set(sumTotal);

		lastFleetErrors.set(sumErr);

		MetricsDto dto =
				new MetricsDto();

		dto.setService(FLEET_SERVICE);

		dto.setTotalRequests(sumTotal);

		dto.setErrorCount(sumErr);

		dto.setErrorsPerSecond(deltaErr);

		dto.setErrorRate(errorRate);

		dto.setP99Latency(p99);

		dto.setActiveIncidents(sumIncidentCounter);

		dto.setRps(deltaTotal);

		dto.setIngestRate(deltaTotal);

		dto.setTimestamp(
				System.currentTimeMillis()
		);

		messagingTemplate.convertAndSend(
				"/topic/metrics",
				dto
		);

		serviceLastTotals.keySet().retainAll(all.keySet());

		List<ServiceFleetRowDto> fleetRows = new ArrayList<>();

		for (Map.Entry<String, ServiceMetrics> e : all.entrySet()) {

			String serviceName = e.getKey();

			ServiceMetrics metrics = e.getValue();

			long total = metrics.getTotalRequests().get();

			long err = metrics.getErrorRequests().get();

			long[] prev = serviceLastTotals.computeIfAbsent(serviceName, k -> new long[2]);

			long deltaLines = Math.max(0L, total - prev[0]);

			prev[0] = total;

			prev[1] = err;

			double rowErrorRate = total > 0 ? (double) err / (double) total * 100.0 : 0.0;

			List<Long> svcLat = new ArrayList<>();

			for (LatencySample s : metrics.getLatencySamples()) {

				svcLat.add(s.millisMs());
			}

			double rowP99 = p99FromMillis(svcLat);

			long incidents = metrics.getActiveIncidents().get();

			boolean healthy = incidents == 0 && rowErrorRate < HEALTHY_MAX_ERROR_PCT;

			ServiceFleetRowDto row = new ServiceFleetRowDto();

			row.setServiceName(serviceName);

			row.setRps((double) deltaLines);

			row.setP99Latency(rowP99);

			row.setErrorRate(rowErrorRate);

			row.setHealthy(healthy);

			row.setActiveIncidents(incidents);

			fleetRows.add(row);
		}

		fleetRows.sort(
				Comparator.comparingDouble(ServiceFleetRowDto::getRps)
						.reversed()
						.thenComparing(ServiceFleetRowDto::getServiceName)
		);

		FleetServicesDto fleetDto = new FleetServicesDto();

		fleetDto.setTimestamp(dto.getTimestamp());

		fleetDto.setServices(fleetRows);

		messagingTemplate.convertAndSend(DESTINATION_FLEET_SERVICES, fleetDto);
	}

	private static double p99FromMillis(
			List<Long> millis) {

		if (millis.isEmpty()) {
			return 0.0;
		}

		List<Long> list =
				new ArrayList<>(millis);

		Collections.sort(list);

		int index =
				(int) Math.ceil(
						0.99 * list.size()
				) - 1;

		index =
				Math.max(
						0,
						Math.min(
								index,
								list.size() - 1
						)
				);

		return list.get(index);
	}
}

package com.causr.service;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.causr.dto.HostMetricsDto;

import io.opentelemetry.proto.common.v1.KeyValue;
import io.opentelemetry.proto.metrics.v1.HistogramDataPoint;
import io.opentelemetry.proto.metrics.v1.Metric;
import io.opentelemetry.proto.metrics.v1.MetricsData;
import io.opentelemetry.proto.metrics.v1.NumberDataPoint;
import io.opentelemetry.proto.metrics.v1.ResourceMetrics;
import io.opentelemetry.proto.metrics.v1.ScopeMetrics;

/**
 * Maps OTLP {@link MetricsData} to {@link HostMetricsDto}. Dashboard-oriented metrics:
 * {@code system.cpu.utilization} (mean of gauge/sum points, ratio 0–1 → %), {@code system.memory.utilization},
 * {@code system.disk.io} and {@code system.network.io} (cumulative → bytes/s), load averages for analysis.
 * When no CPU utilization metric is present but load averages are, CPU % is approximated as load ÷
 * {@code system.cpu.logical.count} (or JVM logical processors as a last resort).
 */
@Service
public class OtlHostMetricsMapper {

	private static final String CPU_UTIL = "system.cpu.utilization";

	private static final String CONTAINER_CPU_UTIL = "container.cpu.utilization";

	private static final String PROCESS_CPU_UTIL = "process.cpu.utilization";

	private static final String MEM_USAGE = "system.memory.usage";

	private static final String MEM_UTIL = "system.memory.utilization";

	private static final String FS_UTIL = "system.filesystem.utilization";

	private static final String CONTAINER_FS_UTIL = "container.filesystem.utilization";

	private static final String FS_USAGE = "system.filesystem.usage";

	private static final String CONTAINER_FS_USAGE = "container.filesystem.usage";

	private static final String NET_IO = "system.network.io";

	private static final String DISK_IO = "system.disk.io";

	private static final String LOAD_1M = "system.cpu.load_average.1m";

	private static final String LOAD_5M = "system.cpu.load_average.5m";

	private static final String LOAD_15M = "system.cpu.load_average.15m";

	private static final String LOGICAL_CPU = "system.cpu.logical.count";

	private static final String PAGING_FAULTS = "system.paging.faults";

	private static final String PROC_COUNT = "system.processes.count";

	private static final String PROC_COUNT_ALT = "system.process.count";

	private static final String MOUNTPOINT = "system.filesystem.mountpoint";

	private static final String MOUNTPOINT_ALT = "mountpoint";

	private static final String FS_STATE = "system.filesystem.state";

	private volatile long lastNetBytes = -1L;

	private volatile long lastNetWallMs;

	private volatile long lastDiskBytes = -1L;

	private volatile long lastDiskWallMs;

	private volatile long lastPagingTotal = -1L;

	private volatile long lastPagingWallMs;

	public synchronized HostMetricsDto map(MetricsData data) {

		long now = System.currentTimeMillis();

		HostMetricsDto dto = new HostMetricsDto();

		dto.setTimestamp(now);

		Double systemCpuPct = null;

		Double containerCpuPct = null;

		double procCpuSum = 0.0;

		int procCpuN = 0;

		Long memBytes = null;

		Double memUtil = null;

		double fsMax = Double.NaN;

		Double fsRoot = null;

		Double load1m = null;

		Double load5m = null;

		Double load15m = null;

		Map<String, Map<String, Double>> fsUsageByMount = new HashMap<>();

		Long proc = null;

		long netCumulative = 0L;

		boolean sawNet = false;

		long diskCumulative = 0L;

		boolean sawDisk = false;

		long pagingCumulative = 0L;

		boolean sawPaging = false;

		Long logicalCpuCount = null;

		for (ResourceMetrics rm : data.getResourceMetricsList()) {

			for (ScopeMetrics sm : rm.getScopeMetricsList()) {

				for (Metric m : sm.getMetricsList()) {

					String name = m.getName();

					if (CPU_UTIL.equals(name)) {

						Double v = aggregateCpuUtilizationPercent(m);

						if (v != null) {

							systemCpuPct = v;
						}

					} else if (CONTAINER_CPU_UTIL.equals(name)) {

						Double v = aggregateCpuUtilizationPercent(m);

						if (v != null) {

							containerCpuPct = v;
						}

					} else if (PROCESS_CPU_UTIL.equals(name)) {

						for (NumberDataPoint p : numberPoints(m)) {

							Double v = pointDouble(p);

							if (v != null) {

								procCpuSum += v;

								procCpuN++;
							}
						}

					} else if (MEM_USAGE.equals(name)) {

						Long b = aggregateBytes(m);

						if (b != null) {

							memBytes = b;
						}

					} else if (MEM_UTIL.equals(name)) {

						Double u = firstDouble(m);

						if (u != null) {

							memUtil = toPercent(u);
						}

					} else if (FS_UTIL.equals(name) || CONTAINER_FS_UTIL.equals(name)) {

						for (NumberDataPoint p : numberPoints(m)) {

							Double u = pointDouble(p);

							if (u == null) {

								continue;
							}

							double pct = toPercent(u);

							if (Double.isNaN(fsMax) || pct > fsMax) {

								fsMax = pct;
							}

							String mp = mountFromPoint(p);

							if ("/".equals(mp)) {

								fsRoot = pct;
							}
						}

					} else if (FS_USAGE.equals(name) || CONTAINER_FS_USAGE.equals(name)) {

						for (NumberDataPoint p : numberPoints(m)) {

							String mp = mountFromPoint(p);

							String st = attrString(p, FS_STATE);

							if (st == null) {

								st = attrString(p, "state");
							}

							if (st == null) {

								st = attrString(p, "system.filesystem.mode");
							}

							if (st == null) {

								st = attrString(p, "mode");
							}

							Double val = pointDouble(p);

							if (st == null || val == null) {

								continue;
							}

							String mountKey = mp != null ? mp : "";

							String stateKey = st.toLowerCase(Locale.ROOT);

							fsUsageByMount
									.computeIfAbsent(mountKey, k -> new HashMap<>())
									.put(stateKey, val);
						}

					} else if (NET_IO.equals(name)) {

						Long nb = sumCumulativeIoBytes(m);

						if (nb != null) {

							netCumulative += nb;

							sawNet = true;
						}

					} else if (DISK_IO.equals(name)) {

						Long db = sumCumulativeIoBytes(m);

						if (db != null) {

							diskCumulative += db;

							sawDisk = true;
						}

					} else if (LOAD_1M.equals(name)) {

						load1m = firstDouble(m);

					} else if (LOAD_5M.equals(name)) {

						load5m = firstDouble(m);

					} else if (LOAD_15M.equals(name)) {

						load15m = firstDouble(m);

					} else if (LOGICAL_CPU.equals(name)) {

						Long v = firstLong(m);

						if (v != null) {

							logicalCpuCount = logicalCpuCount == null ? v : Math.max(logicalCpuCount, v);
						}

					} else if (PAGING_FAULTS.equals(name)) {

						Long sum = sumLongPoints(m);

						if (sum != null) {

							pagingCumulative += sum;

							sawPaging = true;
						}

					} else if (PROC_COUNT.equals(name) || PROC_COUNT_ALT.equals(name)) {

						Long v = firstLong(m);

						if (v != null) {

							proc = proc == null ? v : Math.max(proc, v);
						}

					}
				}
			}
		}

		if (systemCpuPct != null) {

			dto.setCpuUtilization(systemCpuPct);

		} else if (containerCpuPct != null) {

			dto.setCpuUtilization(containerCpuPct);

		} else if (procCpuN > 0) {

			dto.setCpuUtilization(toPercent(procCpuSum / procCpuN));
		}

		Double chosenLoad = load1m != null ? load1m : load5m != null ? load5m : load15m;

		String loadWindow = load1m != null ? "1m" : load5m != null ? "5m" : load15m != null ? "15m" : null;

		dto.setLoadAverage1m(chosenLoad);

		dto.setLoadAverageWindow(loadWindow);

		if (dto.getCpuUtilization() == null && chosenLoad != null) {

			double cores =
					logicalCpuCount != null && logicalCpuCount > 0L
							? logicalCpuCount.doubleValue()
							: Math.max(1.0, (double) Runtime.getRuntime().availableProcessors());

			dto.setCpuUtilization(Math.min(100.0, chosenLoad / cores * 100.0));

			dto.setCpuUtilizationFromLoad(Boolean.TRUE);
		}

		dto.setMemoryUsageBytes(memBytes);

		dto.setMemoryUtilization(memUtil);

		if (!Double.isNaN(fsMax)) {

			dto.setDiskUtilization(fsMax);

			dto.setFilesystemUtilization(fsRoot != null ? fsRoot : fsMax);

		} else {

			FsDerived derived = deriveFilesystemFromUsage(fsUsageByMount);

			if (derived != null) {

				dto.setDiskUtilization(derived.maxPct);

				dto.setFilesystemUtilization(derived.rootPct != null ? derived.rootPct : derived.maxPct);
			}
		}

		if (sawDisk) {

			Double diskRate = computeRateOrNull(lastDiskBytes, lastDiskWallMs, diskCumulative, now);

			if (diskRate != null) {

				dto.setDiskBytesPerSecond(diskRate);
			}

			lastDiskBytes = diskCumulative;

			lastDiskWallMs = now;
		}

		if (sawNet) {

			Double netRate = computeRateOrNull(lastNetBytes, lastNetWallMs, netCumulative, now);

			if (netRate != null) {

				dto.setNetworkBytesPerSecond(netRate);
			}

			lastNetBytes = netCumulative;

			lastNetWallMs = now;
		}

		if (sawPaging) {

			Double pageRate = computeRateOrNull(lastPagingTotal, lastPagingWallMs, pagingCumulative, now);

			if (pageRate != null) {

				dto.setPagingRate(pageRate);
			}

			lastPagingTotal = pagingCumulative;

			lastPagingWallMs = now;
		}

		dto.setProcessCount(proc);

		return dto;
	}

	private static final class FsDerived {

		final double maxPct;

		final Double rootPct;

		FsDerived(double maxPct, Double rootPct) {

			this.maxPct = maxPct;

			this.rootPct = rootPct;
		}
	}

	private static FsDerived deriveFilesystemFromUsage(Map<String, Map<String, Double>> byMount) {

		if (byMount.isEmpty()) {

			return null;
		}

		double maxPct = 0.0;

		Double rootPct = null;

		for (Map.Entry<String, Map<String, Double>> e : byMount.entrySet()) {

			Map<String, Double> st = e.getValue();

			Double used = st.get("used");

			Double free = st.get("free");

			if (used == null || free == null || used + free < 1e-9) {

				continue;
			}

			double pct = used / (used + free) * 100.0;

			if (pct > maxPct) {

				maxPct = pct;
			}

			String mp = e.getKey();

			if ("/".equals(mp)) {

				rootPct = pct;
			}
		}

		if (maxPct <= 0.0 && rootPct == null) {

			double totalUsed = 0.0;

			double totalFree = 0.0;

			for (Map<String, Double> st : byMount.values()) {

				Double u = st.get("used");

				if (u == null) {

					u = st.get("reserved");
				}

				Double f = st.get("free");

				if (u != null) {

					totalUsed += u;
				}

				if (f != null) {

					totalFree += f;
				}
			}

			if (totalUsed + totalFree >= 1e-9) {

				double pct = totalUsed / (totalUsed + totalFree) * 100.0;

				return new FsDerived(pct, null);
			}

			return null;
		}

		return new FsDerived(maxPct, rootPct);
	}

	/** Sum / histogram {@code sum} for cumulative I/O metrics (e.g. network, disk). */
	private static Long sumCumulativeIoBytes(Metric m) {

		Long fromSum = sumLongPoints(m);

		if (fromSum != null) {

			return fromSum;
		}

		if (!m.hasHistogram()) {

			return null;
		}

		long total = 0L;

		boolean any = false;

		for (HistogramDataPoint hp : m.getHistogram().getDataPointsList()) {

			if (hp.hasSum()) {

				total += Math.round(hp.getSum());

				any = true;
			}
		}

		return any ? total : null;
	}

	/**
	 * Mean of all numeric points for a CPU utilization gauge/sum (0–1 → %).
	 * Prefer {@code system.cpu.utilization}; {@code container.cpu.utilization} used if system absent.
	 */
	private static Double aggregateCpuUtilizationPercent(Metric m) {

		List<NumberDataPoint> pts = numberPoints(m);

		double sum = 0.0;

		int n = 0;

		for (NumberDataPoint p : pts) {

			Double v = pointDouble(p);

			if (v != null) {

				sum += v;

				n++;
			}
		}

		if (n == 0) {

			return null;
		}

		return toPercent(sum / n);
	}

	/**
	 * Bytes (or counter) per second; {@code null} on the first sample so the UI can show “—” until a delta exists.
	 */
	private static Double computeRateOrNull(long prevTotal, long prevWallMs, long newTotal, long nowMs) {

		if (prevTotal < 0L) {

			return null;
		}

		double dtSec = (nowMs - prevWallMs) / 1000.0;

		if (dtSec < 1e-3) {

			return null;
		}

		long delta = newTotal - prevTotal;

		if (delta < 0L) {

			return null;
		}

		return delta / dtSec;
	}

	private static List<NumberDataPoint> numberPoints(Metric m) {

		if (m.hasGauge()) {

			return m.getGauge().getDataPointsList();
		}

		if (m.hasSum()) {

			return m.getSum().getDataPointsList();
		}

		return List.of();
	}

	private static Double firstDouble(Metric m) {

		for (NumberDataPoint p : numberPoints(m)) {

			Double v = pointDouble(p);

			if (v != null) {

				return v;
			}
		}

		return null;
	}

	private static Long firstLong(Metric m) {

		for (NumberDataPoint p : numberPoints(m)) {

			Long v = pointLong(p);

			if (v != null) {

				return v;
			}
		}

		return null;
	}

	private static Long aggregateBytes(Metric m) {

		long sum = 0L;

		boolean any = false;

		for (NumberDataPoint p : numberPoints(m)) {

			Long v = pointLong(p);

			if (v == null) {

				Double d = pointDouble(p);

				if (d != null) {

					v = Math.round(d);
				}
			}

			if (v != null) {

				sum += v;

				any = true;
			}
		}

		return any ? sum : null;
	}

	private static Long sumLongPoints(Metric m) {

		long sum = 0L;

		boolean any = false;

		for (NumberDataPoint p : numberPoints(m)) {

			Long v = pointLong(p);

			if (v == null) {

				Double d = pointDouble(p);

				if (d != null) {

					v = Math.round(d);
				}
			}

			if (v != null) {

				sum += v;

				any = true;
			}
		}

		return any ? sum : null;
	}

	private static Double pointDouble(NumberDataPoint p) {

		if (p.hasAsDouble()) {

			return p.getAsDouble();
		}

		if (p.hasAsInt()) {

			return (double) p.getAsInt();
		}

		return null;
	}

	private static Long pointLong(NumberDataPoint p) {

		if (p.hasAsInt()) {

			return p.getAsInt();
		}

		if (p.hasAsDouble()) {

			return Math.round(p.getAsDouble());
		}

		return null;
	}

	private static String mountFromPoint(NumberDataPoint p) {

		String mp = attrString(p, MOUNTPOINT);

		if (mp == null || mp.isBlank()) {

			mp = attrString(p, MOUNTPOINT_ALT);
		}

		if (mp == null || mp.isBlank()) {

			mp = attrString(p, "system.filesystem.device.name");
		}

		return normalizeMount(mp);
	}

	private static String normalizeMount(String mp) {

		if (mp == null) {

			return "";
		}

		String t = mp.trim();

		if (t.isEmpty() || ".".equals(t)) {

			return "/";
		}

		while (t.length() > 1 && t.endsWith("/")) {

			t = t.substring(0, t.length() - 1);
		}

		return t;
	}

	private static String attrString(NumberDataPoint p, String key) {

		for (KeyValue kv : p.getAttributesList()) {

			if (key.equals(kv.getKey()) && kv.getValue().hasStringValue()) {

				return kv.getValue().getStringValue();
			}
		}

		return null;
	}

	/**
	 * Converts a ratio in 0–1 or a value already in 0–100 to 0–100.
	 */
	private static double toPercent(double ratioOrPercent) {

		if (ratioOrPercent >= 0.0 && ratioOrPercent <= 1.0 + 1e-6) {

			return ratioOrPercent * 100.0;
		}

		return ratioOrPercent;
	}

	private static Double toPercent(Double ratioOrPercent) {

		if (ratioOrPercent == null || Double.isNaN(ratioOrPercent) || Double.isInfinite(ratioOrPercent)) {

			return null;
		}

		return toPercent(ratioOrPercent.doubleValue());
	}
}

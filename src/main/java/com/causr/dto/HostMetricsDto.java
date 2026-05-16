package com.causr.dto;

/**
 * Host / system metrics derived from OTLP on {@code metrics.raw}, pushed to
 * {@code /topic/host-metrics} as JSON (Jackson camelCase).
 * <p>
 * Optional fields are {@code null} when the OTLP batch did not contain a
 * matching metric.
 */
public class HostMetricsDto {

	/** CPU utilization 0–100 from {@code system.cpu.utilization} (preferred) or {@code process.cpu.utilization}. */
	private Double cpuUtilization;

	/**
	 * True when {@link #cpuUtilization} was derived from load average ÷ logical CPU count (no utilization
	 * metric in the batch).
	 */
	private Boolean cpuUtilizationFromLoad;

	private Long memoryUsageBytes;

	/** Memory utilization 0–100 when exporter provides {@code system.memory.utilization}. */
	private Double memoryUtilization;

	/** Worst-case filesystem utilization across mount points, 0–100 (optional, for context). */
	private Double diskUtilization;

	/** Utilization for root mount ({@code /}) when attributes allow, else worst mount. */
	private Double filesystemUtilization;

	/** Disk I/O throughput (bytes/s) from cumulative {@code system.disk.io}. */
	private Double diskBytesPerSecond;

	/** Combined network throughput (bytes/s) from cumulative {@code system.network.io}. */
	private Double networkBytesPerSecond;

	/** Load average (value from 1m, 5m, or 15m metric — see {@link #loadAverageWindow}). */
	private Double loadAverage1m;

	/** Which load window populated {@link #loadAverage1m}: {@code "1m"}, {@code "5m"}, or {@code "15m"}. */
	private String loadAverageWindow;

	/** Paging faults or operations per second (delta / wall time). */
	private Double pagingRate;

	private Long processCount;

	private long timestamp;

	public Double getCpuUtilization() {
		return cpuUtilization;
	}

	public void setCpuUtilization(Double cpuUtilization) {
		this.cpuUtilization = cpuUtilization;
	}

	public Boolean getCpuUtilizationFromLoad() {
		return cpuUtilizationFromLoad;
	}

	public void setCpuUtilizationFromLoad(Boolean cpuUtilizationFromLoad) {
		this.cpuUtilizationFromLoad = cpuUtilizationFromLoad;
	}

	public Long getMemoryUsageBytes() {
		return memoryUsageBytes;
	}

	public void setMemoryUsageBytes(Long memoryUsageBytes) {
		this.memoryUsageBytes = memoryUsageBytes;
	}

	public Double getMemoryUtilization() {
		return memoryUtilization;
	}

	public void setMemoryUtilization(Double memoryUtilization) {
		this.memoryUtilization = memoryUtilization;
	}

	public Double getDiskUtilization() {
		return diskUtilization;
	}

	public void setDiskUtilization(Double diskUtilization) {
		this.diskUtilization = diskUtilization;
	}

	public Double getFilesystemUtilization() {
		return filesystemUtilization;
	}

	public void setFilesystemUtilization(Double filesystemUtilization) {
		this.filesystemUtilization = filesystemUtilization;
	}

	public Double getDiskBytesPerSecond() {
		return diskBytesPerSecond;
	}

	public void setDiskBytesPerSecond(Double diskBytesPerSecond) {
		this.diskBytesPerSecond = diskBytesPerSecond;
	}

	public Double getNetworkBytesPerSecond() {
		return networkBytesPerSecond;
	}

	public void setNetworkBytesPerSecond(Double networkBytesPerSecond) {
		this.networkBytesPerSecond = networkBytesPerSecond;
	}

	public Double getLoadAverage1m() {
		return loadAverage1m;
	}

	public void setLoadAverage1m(Double loadAverage1m) {
		this.loadAverage1m = loadAverage1m;
	}

	public String getLoadAverageWindow() {
		return loadAverageWindow;
	}

	public void setLoadAverageWindow(String loadAverageWindow) {
		this.loadAverageWindow = loadAverageWindow;
	}

	public Double getPagingRate() {
		return pagingRate;
	}

	public void setPagingRate(Double pagingRate) {
		this.pagingRate = pagingRate;
	}

	public Long getProcessCount() {
		return processCount;
	}

	public void setProcessCount(Long processCount) {
		this.processCount = processCount;
	}

	public long getTimestamp() {
		return timestamp;
	}

	public void setTimestamp(long timestamp) {
		this.timestamp = timestamp;
	}
}

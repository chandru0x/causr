package com.causr.dto;
public class MetricsDto {

    private double rps;

    private String service;

    private double ingestRate;

    private double errorRate;

    private double p99Latency;

    private long activeIncidents;

    private long totalRequests;

	private long errorCount;

	/** Errors observed in the last publish interval (~1s), for error-rate charts. */
	private long errorsPerSecond;

	private long timestamp;
    
    

	public String getService() {
		return service;
	}

	public void setService(String service) {
		this.service = service;
	}

	public double getIngestRate() {
		return ingestRate;
	}

	public void setIngestRate(double ingestRate) {
		this.ingestRate = ingestRate;
	}

	public double getP99Latency() {
		return p99Latency;
	}

	public void setP99Latency(double p99Latency) {
		this.p99Latency = p99Latency;
	}

	public long getActiveIncidents() {
		return activeIncidents;
	}

	public void setActiveIncidents(long activeIncidents) {
		this.activeIncidents = activeIncidents;
	}

	public double getRps() {
		return rps;
	}

	public void setRps(double rps) {
		this.rps = rps;
	}

	public double getErrorRate() {
		return errorRate;
	}

	public void setErrorRate(double errorRate) {
		this.errorRate = errorRate;
	}

	public long getTotalRequests() {
		return totalRequests;
	}

	public void setTotalRequests(long totalRequests) {
		this.totalRequests = totalRequests;
	}

	public long getErrorCount() {
		return errorCount;
	}

	public void setErrorCount(long errorCount) {
		this.errorCount = errorCount;
	}

	public long getErrorsPerSecond() {
		return errorsPerSecond;
	}

	public void setErrorsPerSecond(long errorsPerSecond) {
		this.errorsPerSecond = errorsPerSecond;
	}

	public long getTimestamp() {
		return timestamp;
	}

	public void setTimestamp(long timestamp) {
		this.timestamp = timestamp;
	}

	@Override
	public String toString() {
		return "MetricsDto [rps=" + rps + ", errorRate=" + errorRate + ", totalRequests=" + totalRequests
				+ ", errorCount=" + errorCount + ", timestamp=" + timestamp + "]";
	}
    
}
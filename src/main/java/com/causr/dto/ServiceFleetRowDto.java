package com.causr.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * One row for {@link FleetServicesDto} on {@code /topic/fleet-services}.
 * Namespace, version, and CPU are optional until sourced from OTLP attributes.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ServiceFleetRowDto {

	private String serviceName;

	private String namespace;

	private String version;

	private double rps;

	private double p99Latency;

	private double errorRate;

	private Double cpuUtilization;

	private boolean healthy;

	private long activeIncidents;

	public String getServiceName() {
		return serviceName;
	}

	public void setServiceName(String serviceName) {
		this.serviceName = serviceName;
	}

	public String getNamespace() {
		return namespace;
	}

	public void setNamespace(String namespace) {
		this.namespace = namespace;
	}

	public String getVersion() {
		return version;
	}

	public void setVersion(String version) {
		this.version = version;
	}

	public double getRps() {
		return rps;
	}

	public void setRps(double rps) {
		this.rps = rps;
	}

	public double getP99Latency() {
		return p99Latency;
	}

	public void setP99Latency(double p99Latency) {
		this.p99Latency = p99Latency;
	}

	public double getErrorRate() {
		return errorRate;
	}

	public void setErrorRate(double errorRate) {
		this.errorRate = errorRate;
	}

	public Double getCpuUtilization() {
		return cpuUtilization;
	}

	public void setCpuUtilization(Double cpuUtilization) {
		this.cpuUtilization = cpuUtilization;
	}

	public boolean isHealthy() {
		return healthy;
	}

	public void setHealthy(boolean healthy) {
		this.healthy = healthy;
	}

	public long getActiveIncidents() {
		return activeIncidents;
	}

	public void setActiveIncidents(long activeIncidents) {
		this.activeIncidents = activeIncidents;
	}
}

package com.causr.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * Per-service snapshot for the observability fleet table, {@code /topic/fleet-services} (~1 Hz).
 */
public class FleetServicesDto {

	private long timestamp;

	private List<ServiceFleetRowDto> services = new ArrayList<>();

	public long getTimestamp() {
		return timestamp;
	}

	public void setTimestamp(long timestamp) {
		this.timestamp = timestamp;
	}

	public List<ServiceFleetRowDto> getServices() {
		return services;
	}

	public void setServices(List<ServiceFleetRowDto> services) {
		this.services = services;
	}
}

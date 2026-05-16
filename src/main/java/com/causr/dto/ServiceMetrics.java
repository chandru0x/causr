package com.causr.dto;

import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicLong;

public class ServiceMetrics {

	private AtomicLong totalRequests = new AtomicLong();

	private AtomicLong errorRequests = new AtomicLong();

	/** Rolling recent latencies for P99 (bounded in {@link com.causr.config.LogConsumer}). */
	private ConcurrentLinkedQueue<LatencySample> latencySamples = new ConcurrentLinkedQueue<>();

	private AtomicLong activeIncidents = new AtomicLong();

	public AtomicLong getTotalRequests() {
		return totalRequests;
	}

	public void setTotalRequests(AtomicLong totalRequests) {
		this.totalRequests = totalRequests;
	}

	public AtomicLong getErrorRequests() {
		return errorRequests;
	}

	public void setErrorRequests(AtomicLong errorRequests) {
		this.errorRequests = errorRequests;
	}

	public ConcurrentLinkedQueue<LatencySample> getLatencySamples() {
		return latencySamples;
	}

	public void setLatencySamples(ConcurrentLinkedQueue<LatencySample> latencySamples) {
		this.latencySamples = latencySamples;
	}

	public AtomicLong getActiveIncidents() {
		return activeIncidents;
	}

	public void setActiveIncidents(AtomicLong activeIncidents) {
		this.activeIncidents = activeIncidents;
	}
}

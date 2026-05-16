package com.causr.dto;

/**
 * One latency observation for rolling P99 (bounded queue + time window).
 *
 * @param millisMs      server-side duration in milliseconds
 * @param recordedAtMs  {@link System#currentTimeMillis()} when the sample was recorded
 */
public record LatencySample(long millisMs, long recordedAtMs) {
}

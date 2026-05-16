package com.causr.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Log line pushed to WebSocket subscribers ({@code /topic/logs}).
 * Shape matches what the UI expects: service, level, message, and ordering timestamp.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LogDto {

	private String serviceName;
	private String level;
	private String message;
	/** Epoch milliseconds from OTLP {@code time_unix_nano} when present, else ingest time. */
	private long timestampEpochMillis;

	public LogDto() {
	}

	public String getServiceName() {
		return serviceName;
	}

	public void setServiceName(String serviceName) {
		this.serviceName = serviceName;
	}

	public String getLevel() {
		return level;
	}

	public void setLevel(String level) {
		this.level = level;
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}

	public long getTimestampEpochMillis() {
		return timestampEpochMillis;
	}

	public void setTimestampEpochMillis(long timestampEpochMillis) {
		this.timestampEpochMillis = timestampEpochMillis;
	}

	@Override
	public String toString() {
		return "LogDto [serviceName=" + serviceName + ", level=" + level + ", message=" + message
				+ ", timestampEpochMillis=" + timestampEpochMillis + "]";
	}
}

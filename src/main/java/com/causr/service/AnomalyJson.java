package com.causr.service;

import com.causr.dto.AnomalyDto;

/** JSON encode/decode for {@link AnomalyDto} Kafka payloads. */
public final class AnomalyJson {

	private AnomalyJson() {
	}

	public static String toJson(AnomalyDto anomaly) {

		return "{"
				+ "\"service\":" + jsonString(anomaly.getService())
				+ ",\"type\":" + jsonString(anomaly.getType())
				+ ",\"severity\":" + jsonString(anomaly.getSeverity())
				+ ",\"message\":" + jsonString(anomaly.getMessage())
				+ ",\"timestamp\":" + anomaly.getTimestamp()
				+ "}";
	}

	public static AnomalyDto fromJson(String json) {

		AnomalyDto dto = new AnomalyDto();

		dto.setService(readStringField(json, "service"));

		dto.setType(readStringField(json, "type"));

		dto.setSeverity(readStringField(json, "severity"));

		dto.setMessage(readStringField(json, "message"));

		dto.setTimestamp(readLongField(json, "timestamp"));

		return dto;
	}

	static String readStringField(String json, String field) {

		String key = "\"" + field + "\":";

		int keyIndex = json.indexOf(key);

		if (keyIndex < 0) {
			return null;
		}

		int start = json.indexOf('"', keyIndex + key.length()) + 1;

		if (start <= 0) {
			return null;
		}

		StringBuilder value = new StringBuilder();

		boolean escaped = false;

		for (int i = start; i < json.length(); i++) {

			char ch = json.charAt(i);

			if (escaped) {

				value.append(ch);

				escaped = false;

				continue;
			}

			if (ch == '\\') {

				escaped = true;

				continue;
			}

			if (ch == '"') {
				return value.toString();
			}

			value.append(ch);
		}

		return null;
	}

	static long readLongField(String json, String field) {

		String key = "\"" + field + "\":";

		int keyIndex = json.indexOf(key);

		if (keyIndex < 0) {
			return 0L;
		}

		int start = keyIndex + key.length();

		int end = start;

		while (end < json.length()
				&& Character.isDigit(json.charAt(end))) {

			end++;
		}

		if (end == start) {
			return 0L;
		}

		return Long.parseLong(json.substring(start, end));
	}

	private static String jsonString(String value) {

		if (value == null) {
			return "null";
		}

		return "\""
				+ value
						.replace("\\", "\\\\")
						.replace("\"", "\\\"")
						.replace("\n", "\\n")
						.replace("\r", "\\r")
				+ "\"";
	}
}

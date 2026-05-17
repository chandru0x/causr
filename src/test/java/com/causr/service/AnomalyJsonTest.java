package com.causr.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

import com.causr.dto.AnomalyDto;

class AnomalyJsonTest {

	@Test
	void roundTripsAnomalyJson() {

		AnomalyDto original = new AnomalyDto();

		original.setService("payments");

		original.setType("HIGH_ERROR_RATE");

		original.setSeverity("critical");

		original.setMessage("Error rate 12.0% exceeds 5.0%");

		original.setTimestamp(1_700_000_000_000L);

		String json = AnomalyJson.toJson(original);

		AnomalyDto parsed = AnomalyJson.fromJson(json);

		assertEquals(original.getService(), parsed.getService());

		assertEquals(original.getType(), parsed.getType());

		assertEquals(original.getSeverity(), parsed.getSeverity());

		assertEquals(original.getMessage(), parsed.getMessage());

		assertEquals(original.getTimestamp(), parsed.getTimestamp());
	}
}

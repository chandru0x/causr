package com.cursr.backend.services;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.andromedia")
public record AndromediaProperties(String baseUrl) {

  public String normalizedBaseUrl() {
    if (baseUrl == null || baseUrl.isBlank()) {
      return "http://localhost:8083";
    }
    String trimmed = baseUrl.trim();
    return trimmed.endsWith("/") ? trimmed.substring(0, trimmed.length() - 1) : trimmed;
  }
}

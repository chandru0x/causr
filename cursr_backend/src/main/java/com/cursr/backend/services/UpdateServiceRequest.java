package com.cursr.backend.services;

import jakarta.validation.constraints.NotBlank;

public record UpdateServiceRequest(
    @NotBlank String repoUrl,
    String branch) {}

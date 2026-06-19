package com.cursr.backend.services;

public record UpdateServiceRequest(
    String indexSource,
    String repoUrl,
    String branch,
    String localPath,
    String repoSubpath) {}

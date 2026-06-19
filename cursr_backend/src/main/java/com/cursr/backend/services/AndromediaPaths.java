package com.cursr.backend.services;

public final class AndromediaPaths {

  private AndromediaPaths() {}

  public static String clonePath(String serviceName) {
    return PathSanitizer.sanitize(serviceName, "repos");
  }

  public static String indexPath(String serviceName) {
    return PathSanitizer.sanitize(serviceName, "index/by-service");
  }

  private static final class PathSanitizer {

    private PathSanitizer() {}

    private static String sanitize(String serviceName, String segment) {
      if (serviceName == null || serviceName.isBlank()) {
        throw new IllegalArgumentException("service name is required");
      }
      String safeName = serviceName.replaceAll("[^a-zA-Z0-9._-]", "_");
      String home = System.getProperty("user.home");
      return home + "/.andromedia/" + segment + "/" + safeName;
    }
  }
}

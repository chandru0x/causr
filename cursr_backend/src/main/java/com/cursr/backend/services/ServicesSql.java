package com.cursr.backend.services;

public final class ServicesSql {

  public static final String DISCOVERED_SERVICE_NAMES =
      """
      SELECT DISTINCT service_name
      FROM observability.logs_hot
      WHERE timestamp > now() - INTERVAL 7 DAY
        AND service_name != ''
      ORDER BY service_name
      """;

  public static final String FIND_BY_NAME =
      """
      SELECT id::text AS id,
             service_name,
             repo_url,
             branch,
             status,
             indexed_at,
             index_stats::text AS index_stats,
             last_index_job_id,
             created_at,
             updated_at
      FROM services
      WHERE service_name = ?
      """;

  public static final String FIND_ALL =
      """
      SELECT id::text AS id,
             service_name,
             repo_url,
             branch,
             status,
             indexed_at,
             index_stats::text AS index_stats,
             last_index_job_id,
             created_at,
             updated_at
      FROM services
      ORDER BY service_name
      """;

  public static final String UPSERT =
      """
      INSERT INTO services (service_name, repo_url, branch, status, updated_at)
      VALUES (?, ?, ?, ?, now())
      ON CONFLICT (service_name) DO UPDATE SET
        repo_url = EXCLUDED.repo_url,
        branch = EXCLUDED.branch,
        status = EXCLUDED.status,
        updated_at = now()
      RETURNING id::text AS id,
                service_name,
                repo_url,
                branch,
                status,
                indexed_at,
                index_stats::text AS index_stats,
                last_index_job_id,
                created_at,
                updated_at
      """;

  public static final String UPDATE_INDEX_JOB =
      """
      UPDATE services
      SET last_index_job_id = ?,
          status = ?,
          updated_at = now()
      WHERE service_name = ?
      """;

  public static final String UPDATE_INDEX_COMPLETE =
      """
      UPDATE services
      SET status = ?,
          indexed_at = ?,
          index_stats = ?::jsonb,
          updated_at = now()
      WHERE service_name = ?
      """;

  public static final String FIND_INDEXING =
      """
      SELECT service_name, last_index_job_id
      FROM services
      WHERE status = 'indexing'
        AND last_index_job_id IS NOT NULL
      """;

  private ServicesSql() {}
}

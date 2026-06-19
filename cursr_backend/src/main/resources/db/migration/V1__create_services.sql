CREATE TABLE services (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name      TEXT NOT NULL UNIQUE,
  repo_url          TEXT,
  branch            TEXT NOT NULL DEFAULT 'main',
  status            TEXT NOT NULL DEFAULT 'discovered',
  indexed_at        TIMESTAMPTZ,
  index_stats       JSONB,
  last_index_job_id TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_services_status ON services (status);

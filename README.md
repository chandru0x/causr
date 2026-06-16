# Causr / Cursr Observability Platform

Monorepo for an observability and incident-intelligence platform: OTLP telemetry flows through Kafka into ClickHouse, with AI-based anomaly detection and dashboard APIs.

**Full project guide:** [PROJECT.md](PROJECT.md) — architecture, APIs, data model, and recent work.

## Repository layout

| Directory | Role | Port |
|-----------|------|------|
| `log-sender-backend` | Synthetic OTLP log producer | 8082 |
| `log-processor-service` | Kafka ingest, ClickHouse writer, anomaly detection | 8080 |
| `cursr_backend` | Production dashboard BFF (REST + WebSocket) | 8090 |
| `causr-dashboard` | Developer dashboard UI (Vite React) | 5173 |
| `observability-dashboard` | Dev UI (Next.js) | 3000 |
| `cursr_landing` | Marketing landing page (Vite) | 5173 |

## Quick start: infrastructure

Start Redis, Kafka (with topics), ClickHouse (with schema), and OpenTelemetry Collector:

```bash
docker compose up -d
```

### Verify

```bash
# ClickHouse
curl http://localhost:8123/ping

# Kafka topics (logs.raw, traces.raw, anomaly-alerts, logs.anomalies)
docker exec kafka kafka-topics --bootstrap-server localhost:9092 --list

# ClickHouse tables
curl 'http://localhost:8123/?query=SHOW+TABLES+FROM+observability'

# OTel Collector HTTP (connection refused = not running; 404/405 = running)
curl -s -o /dev/null -w "%{http_code}" http://localhost:4318/v1/logs
```

### Kafka topics

| Topic | Partitions | Purpose |
|-------|------------|---------|
| `logs.raw` | 3 | OTLP logs (protobuf) from OTel Collector |
| `traces.raw` | 3 | OTLP traces (protobuf) from OTel Collector |
| `anomaly-alerts` | 1 | Anomaly events from log-processor-service |
| `logs.anomalies` | 1 | Legacy topic (created for compatibility) |

Host JVM apps connect to Kafka at **`localhost:29092`**. Containers use **`kafka:9092`**.

## Quick start: applications

After infrastructure is healthy, start services in order:

```bash
# 1. Log processor (consumes Kafka, writes ClickHouse)
cd log-processor-service && mvn spring-boot:run

# 2. Log sender (OTLP → collector → Kafka → ClickHouse)
cd log-sender-backend && mvn spring-boot:run

# 3. Dashboard BFF
cd cursr_backend && mvn spring-boot:run

# 4. Dev dashboard UI (optional)
cd observability-dashboard && npm run dev

# Or the Vite developer dashboard (recommended)
cd causr-dashboard && npm install && npm run dev
```

### causr-dashboard

Dense dark-themed developer UI with three pages:

| Page | Backend | Port |
|------|---------|------|
| Dashboard | `cursr_backend` | 8090 |
| Logs | `log-processor-service` | 8080 |
| Anomalies | `cursr_backend` | 8090 |

```bash
cd causr-dashboard
cp .env.example .env   # optional — defaults work for local Docker stack
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Requires Docker infra plus `log-processor-service`, `log-sender-backend`, and `cursr_backend` running.

Environment variables:

- `VITE_BFF_API_BASE` — default `http://localhost:8090`
- `VITE_PROCESSOR_API_BASE` — default `http://localhost:8080`

### End-to-end smoke test

```bash
# Wait a few seconds for logs to flow, then:
curl http://localhost:8080/api/logs/recent
curl http://localhost:8090/api/health
```

## Configuration

Spring Boot apps default to `localhost` endpoints matching the Docker stack:

- Kafka: `localhost:29092`
- Redis: `localhost:6379`
- ClickHouse: `localhost:8123/observability`
- OTel Collector: `localhost:4317` (gRPC), `localhost:4318` (HTTP)

See [`.env.example`](.env.example) for optional Docker port overrides.

## Data flow

```
log-sender-backend  ──OTLP HTTP :4318──►  OTel Collector
                                              │
                                              ▼
                                         Kafka (logs.raw, traces.raw)
                                              │
                                              ▼
                                    log-processor-service
                                              │
                         ┌────────────────────┼────────────────────┐
                         ▼                    ▼                    ▼
                    ClickHouse              Redis            anomaly-alerts
                         │                                         │
                         ▼                                         ▼
                   cursr_backend  ◄── Redis pub/sub ─── cursr_backend
                   (REST queries)      WebSocket
```

## Per-service docs

- [log-processor-service/README.md](log-processor-service/README.md)
- [cursr_backend/README.md](cursr_backend/README.md)
- [log-sender-backend/README.md](log-sender-backend/README.md)

## Stopping infrastructure

```bash
docker compose down
```

To remove ClickHouse data as well (required after `log_clusters` schema changes):

```bash
docker compose down -v
docker compose up -d
```

For an existing ClickHouse volume without wiping all data, drop and recreate the clusters rollup:

```sql
DROP VIEW IF EXISTS observability.log_clusters_mv;
DROP TABLE IF EXISTS observability.log_clusters;
-- then re-run infra/clickhouse/init.sql cluster section or restart clickhouse-init
```

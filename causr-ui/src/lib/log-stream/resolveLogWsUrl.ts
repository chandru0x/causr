/** Tailscale-hosted Causr-log-processor (UI is hosted separately, e.g. Netlify). */
const DEFAULT_LOG_WS_URL = 'wss://chan.tail6b030d.ts.net/ws-stream'

/**
 * STOMP broker URL for Spring's native WebSocket endpoint {@code /ws-stream}.
 *
 * Always targets the log processor host (not the UI origin). Override with
 * {@code VITE_LOG_WS_URL} in .env.development / .env.production.
 */
export function resolveLogWsUrl(): string {
  return import.meta.env.VITE_LOG_WS_URL?.trim() || DEFAULT_LOG_WS_URL
}

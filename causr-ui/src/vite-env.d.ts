/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Full WebSocket STOMP broker URL, e.g. wss://chan.tail6b030d.ts.net/ws-stream */
  readonly VITE_LOG_WS_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

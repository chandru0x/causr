import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Log stream WebSocket: the app connects directly to Causr-log-processor in dev
  // (wss://chan.tail6b030d.ts.net/ws-stream) — see resolveLogWsUrl.ts.
})

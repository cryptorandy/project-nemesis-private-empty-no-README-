import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
// @ts-expect-error local JS middleware plugin — no declaration file
import { bookApiPlugin } from './scripts/vite-book-api-plugin.mjs'

// Root-hosted on *.apps.grok.bot — keep absolute asset paths at /
export default defineConfig({
  base: '/',
  plugins: [react(), bookApiPlugin()],
  build: {
    // Prefer relative modulepreload where host CORS is strict
    modulePreload: { polyfill: true },
  },
  server: {
    // Local /api/book is served by bookApiPlugin (mirrors published api/book.ts)
  },
})

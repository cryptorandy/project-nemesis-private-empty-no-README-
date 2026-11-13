import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Root-hosted on *.apps.grok.bot — keep absolute asset paths at /
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    // Prefer relative modulepreload where host CORS is strict
    modulePreload: { polyfill: true },
  },
})

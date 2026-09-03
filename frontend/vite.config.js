import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// AagniShield frontend -- proxies /api to the FastAPI backend during dev
// so the frontend never needs to know the backend's port/host.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})

import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },

  server: {
    port: 3000,
    proxy: {
      // Laravel backend endpoints (specific routes first)
      '/api/pmu/races': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/api/pmu/horses': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/api/pmu/find-race': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      // PMU external API (catch-all for programme data)
      '/api/pmu': {
        target: 'https://online.turfinfo.api.pmu.fr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/pmu/, '/rest/client/1/programme'),
        secure: false
      }
    }
  }
})
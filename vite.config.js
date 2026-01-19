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
      '/api/pmu': {
        target: 'https://offline.turfinfo.api.pmu.fr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/pmu/, '/rest/client/7/programme'),
        secure: false
      }
    }
  }
})
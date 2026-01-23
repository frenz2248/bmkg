import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },

  server: {
    proxy: {
      '/api-bmkg': {
        target: 'https://api.bmkg.go.id',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-bmkg/, '')
      },

      '/gempa-bmkg': {
        target: 'https://data.bmkg.go.id',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gempa-bmkg/, '')
      }
    }
  }
})

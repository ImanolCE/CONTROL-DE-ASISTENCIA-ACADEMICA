import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // 🔥 VITAL: Permite que Ubuntu exponga la web a la red (0.0.0.0)
    port: 5173, // Puerto del frontend
    proxy: {
      // 🔥 MAGIA: Todo lo que empiece por /api se redirige al backend automáticamente
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
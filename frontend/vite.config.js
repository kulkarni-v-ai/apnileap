import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5001', changeOrigin: true },
      '/tasks': { target: 'http://localhost:5001', changeOrigin: true },
      '/hub': { target: 'http://localhost:5001', changeOrigin: true },
      '/moderator': { target: 'http://localhost:5001', changeOrigin: true },
      '/meetings': { target: 'http://localhost:5001', changeOrigin: true },
      '/submissions': { target: 'http://localhost:5001', changeOrigin: true },
      '/campuses': { target: 'http://localhost:5001', changeOrigin: true },
      '/campus': { target: 'http://localhost:5001', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5001', changeOrigin: true }
    }
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const DJANGO_PORT = process.env.VITE_BACKEND_PORT || '8001'
const DJANGO_BACKEND = process.env.VITE_BACKEND_URL || `http://127.0.0.1:${DJANGO_PORT}`

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5000,
    proxy: {
      // All API routes → Django
      '/api': {
        target: DJANGO_BACKEND,
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: 'localhost',
      },
      // Google Auth routes → Django
      '/auth': {
        target: DJANGO_BACKEND,
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: 'localhost',
      },
      // MT5 trading routes → Django
      '/mt5': {
        target: DJANGO_BACKEND,
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: 'localhost',
      },
      // Admin API routes → Django
      '/admin/api': {
        target: DJANGO_BACKEND,
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: 'localhost',
      },
      // Django static files
      '/static': {
        target: DJANGO_BACKEND,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})


import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import * as path from 'path'

export default defineConfig(({ mode }) => {
  // Automatically load env vars based on the current mode
  const env = loadEnv(mode, process.cwd(), '')

  // Auto-detect environment: development uses localhost:3000, production uses env var
  const backendUrl = mode === 'development'
    ? 'http://localhost:5000'
    : env.VITE_BACKEND_URL

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@assets': path.resolve(__dirname, './src/assets'),
        '@public': path.resolve(__dirname, './public'),
        '@image': path.resolve(__dirname, './public/images'),
        '@views': path.resolve(__dirname, './src/views'),
      }
    },

  }
})
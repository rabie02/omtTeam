import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import * as path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

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
    build: {
      outDir: 'dist'
    },
  }
})

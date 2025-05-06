import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import * as path from 'path' // 🛠️ Fixed path import

const backendUrl = import.meta.env.VITE_BACKEND_URL;


export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@public': path.resolve(__dirname, './public'),
      '@image': path.resolve(__dirname, './public/images'), // 🆕 Added missing alias
      '@views': path.resolve(__dirname, './src/views'),
    }
  }
})
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  define: {
    // Mappt "global" auf "window" (oder ein leeres Object, falls dir das lieber ist)
    global: 'window',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Listen on both IPv4 and IPv6
    port: 5173,
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      // Remove hardcoded alias - let workspace resolution handle @rot-ritual/addresses
    },
  },
  optimizeDeps: {
    include: ['buffer'],
  },
})
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
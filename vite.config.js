import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4000,
    host: '0.0.0.0', // Exposes the server on your local network, necessary for ngrok
    allowedHosts: ["65accb449966.ngrok-free.app"]
  }
})
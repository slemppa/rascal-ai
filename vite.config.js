import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Automaattinen päivitys ja HMR
    hmr: {
      overlay: true, // Näyttää virheet overlayllä
      host: '0.0.0.0', // Salli yhteys mistä tahansa IP:stä (mobiili)
      port: 5173, // Vite:n HMR portti
    },
    watch: {
      usePolling: false, // Poista polling mobiililla
      interval: 100, // Tarkista muutokset 100ms välein
    },
    // Automaattinen sivu päivitys
    liveReload: true,
    // Salli yhteys mistä tahansa IP:stä (mobiili)
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  }
})

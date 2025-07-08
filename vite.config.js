import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Lataa vain tarvittavat ympäristömuuttujat
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react()
    ],
    define: {
      'process.env.N8N_SINGLE_CALL': JSON.stringify(env.N8N_SINGLE_CALL),
      'process.env.N8N_SECRET_KEY': JSON.stringify(env.N8N_SECRET_KEY),
      'process.env.NODE_ENV': JSON.stringify(mode)
    },
    server: {
      proxy: {
        '/api': 'http://localhost:3000'
      },
      historyApiFallback: true
    }
  }
})

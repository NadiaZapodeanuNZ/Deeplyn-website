import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
 

// sets up a development server on port 5173 
// and proxies API requests starting with /api to the Django backend
//  running on port 8000. This allows the frontend to communicate with the backend 
// without CORS issues during development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      //every request that starts with /api will be forwarded to http://localhost:8000 (Django backend)
      '/api': {
        target: 'http://localhost:8000', 
        changeOrigin: true, 
        // secure: false - if backend is running on https
      },
    },
  },
})
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // El build sale a Backend/static_frontend: Django (whitenoise) sirve
  // el panel y la API desde el mismo dominio en produccion.
  // base '/static/': los assets quedan bajo la ruta de whitenoise.
  base: '/static/',
  build: {
    outDir: '../Backend/static_frontend',
    emptyOutDir: true,
  },
})

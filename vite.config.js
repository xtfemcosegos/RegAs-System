import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANTE: Rutas relativas para que funcione en cualquier repositorio de GitHub Pages
  base: './', 
})
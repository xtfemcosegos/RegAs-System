import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // CAMBIO: Usamos la ruta absoluta del repositorio en lugar de relativa.
  // Esto hace que las rutas de imágenes y scripts sean infalibles en GitHub Pages.
  base: '/RegAs-System/', 
})

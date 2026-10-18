import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/CRONO/', // <-- Agrega esta línea
  // Ruta base. Con un valor relativo la misma build funciona en local y en
  // alojamientos estáticos como GitHub Pages, sin conocer el nombre del repositorio.
  base: process.env.VITE_BASE || './',
  // Marca la build como demostración pública: abre la interfaz con una sesión
  // sintética y sin conexión al API. Se define de forma explícita para que
  // dependa solo de VITE_DEMO en el entorno de compilación.
  define: {
    __CRONO_DEMO__: JSON.stringify(process.env.VITE_DEMO === 'true'),
  },
  server: {
    port: 3000,
    open: true,
    watch: {
      ignored: ['**/backend/**', '**/node_modules/**', '**/dist/**']
    }
  }
})

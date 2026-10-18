import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { AuthProvider } from './auth'
import App from './App'
import './styles/index.css'

// ------------------------------------------------------------
// Demostración pública (solo en una build con VITE_DEMO=true).
// Abre la interfaz con una sesión sintética y sin token: no hay conexión con
// el API, por lo que todos los listados quedan vacíos. Se muestra el aspecto
// de la aplicación, nunca datos de Crono, y ninguna operación puede escribir
// porque el token de sesión es nulo.
// ------------------------------------------------------------
const ES_DEMO = typeof __CRONO_DEMO__ !== 'undefined' && __CRONO_DEMO__

if (ES_DEMO && !localStorage.getItem('crono_session')) {
  localStorage.setItem('crono_session', JSON.stringify({
    token: null,
    staff: { personaId: 0, nombre: 'Demostración', rol: 'Dueño', roles: ['Dueño'] },
  }))
}

function AvisoDemostracion() {
  return (
    <div style={{
      padding: '8px 16px',
      fontSize: '12px',
      textAlign: 'center',
      color: '#ffffff',
      backgroundColor: '#8a6d3b',
      fontFamily: 'system-ui, sans-serif',
    }}>
      Demostración de interfaz. No hay conexión con el servidor: los listados
      están vacíos y no se puede guardar nada.
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        {ES_DEMO && <AvisoDemostracion />}
        <App />
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
)

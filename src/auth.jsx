import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { login as apiLogin, setAuthToken } from './api';
import { STAFF } from './constants.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('crono_user');
      const token = localStorage.getItem('crono_token');
      if (token) setAuthToken(token);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Descartar sesiones corruptas (sin rol) de versiones anteriores
        if (parsed && parsed.rol) {
          // Sesiones antiguas guardadas sin lista de roles
          if (!Array.isArray(parsed.roles) || parsed.roles.length === 0) {
            parsed.roles = [parsed.rol];
          }
          return parsed;
        }
        localStorage.removeItem('crono_user');
        localStorage.removeItem('crono_token');
      }
      return null;
    } catch {
      return null;
    }
  });

  const [authError, setAuthError] = useState(null);

  // Login con credenciales (correo + contraseña) vía API
  const loginWithCredentials = useCallback(async (email, password) => {
    setAuthError(null);
    try {
      const data = await apiLogin(email, password);
      // El backend serializa en camelCase
      const staff = data.staff || {};
      const rolPrincipal = staff.rol ?? staff.Rol;
      const rolesBackend = Array.isArray(staff.roles) ? staff.roles.filter(Boolean) : [];
      const roles = rolesBackend.length > 0 ? rolesBackend : (rolPrincipal ? [rolPrincipal] : []);
      const user = {
        persona_id: staff.personaId ?? staff.PersonaId,
        nombre: staff.nombre ?? staff.Nombre,
        rol: rolPrincipal,
        roles,
        correo: email,
        fecha_contratacion: staff.fechaContratacion ?? staff.FechaContratacion,
      };
      setCurrentUser(user);
      localStorage.setItem('crono_user', JSON.stringify(user));
      setAuthToken(data.token);
      return { success: true, user };
    } catch (err) {
      const msg = err.message || 'Credenciales inválidas';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  }, []);

  // Login rápido por staff — obtiene token JWT real del backend
  const loginAsRole = useCallback(async (rolOrPersonaId) => {
    setAuthError(null);
    let member;
    if (typeof rolOrPersonaId === 'number') {
      member = STAFF.find(s => s.persona_id === rolOrPersonaId);
    } else {
      member = STAFF.find(s => s.rol === rolOrPersonaId);
    }

    if (!member) {
      const err = 'Rol de staff no encontrado';
      setAuthError(err);
      return { success: false, error: err };
    }

    // Obtener token real del backend
    try {
      const result = await loginWithCredentials(member.correo, 'crono2026');
      if (result.success) return result;
    } catch (err) {
      // Backend no disponible: continuar sin token (modo demo)
      console.warn('Backend no disponible, sesión local:', err.message);
    }

    // Fallback local (sin API)
    const user = {
      persona_id: member.persona_id,
      nombre: member.nombre,
      rol: member.rol,
      roles: [member.rol],
      correo: member.correo,
      fecha_contratacion: member.fecha_contratacion,
    };
    setCurrentUser(user);
    localStorage.setItem('crono_user', JSON.stringify(user));
    return { success: true, user };
  }, [loginWithCredentials]);

  const login = loginAsRole;

  const logout = useCallback(() => {
    setCurrentUser(null);
    setAuthError(null);
    localStorage.removeItem('crono_user');
    localStorage.removeItem('crono_token');
    setAuthToken(null);
  }, []);

  const value = useMemo(() => ({
    currentUser,
    login,
    loginAsRole,
    loginWithCredentials,
    logout,
    authError,
    staffList: STAFF,
  }), [currentUser, loginAsRole, loginWithCredentials, logout, authError]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

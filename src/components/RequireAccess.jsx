import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { canAccess } from '../permissions';

// acepta `recurso` (string) o `recursos` (array): basta con tener acceso a uno
export default function RequireAccess({ recurso, recursos, accion = 'read', children }) {
  const { currentUser } = useAuth();
  // Autorización con varios roles: basta con que uno de ellos permita el acceso.
  const roles = currentUser?.roles?.length ? currentUser.roles : (currentUser?.rol ? [currentUser.rol] : []);

  const lista = recursos || (recurso ? [recurso] : []);
  const permitido = roles.length > 0 && lista.some(r => canAccess(roles, r, accion));

  if (!permitido) {
    return <Navigate to="/mi-espacio" replace />;
  }

  return children;
}

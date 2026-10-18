// ============================================================
// CRONO — Matriz de permisos centralizada (única fuente de verdad)
// Rol → Recurso → Acciones + Alcance
// ============================================================

export const PERMISSIONS = {
  "Entrevistador": {
    // ACTIVE: solo candidatos con el rol de aspirante activo (spec §3.2.3).
    aspirantes: { read: 'ACTIVE', write: 'ACTIVE' },
    modelos: { read: false, write: false },
    clientes: { read: false, write: false },
    produccion: { read: false, write: false },
    finanzas: { read: false, write: false },
    academia: { read: false, write: false },
    rrhh: { read: false, write: false },
    formatos: { read: ['Reclutamiento'], write: false },
    documentos: { read: false, write: false },
    contratos: { read: false, write: false },
    privado: { read: false, write: false },
    // Reclutamiento: solo sus entrevistas y los candidatos asignados.
    entrevistas: { read: 'OWN', write: 'OWN' },
    reclutamiento: { read: true, write: false },
  },
  "Scouter": {
    aspirantes: { read: 'ALL', write: 'ALL' },
    modelos: { read: false, write: false },
    clientes: { read: false, write: false },
    produccion: { read: false, write: false },
    finanzas: { read: false, write: false },
    academia: { read: false, write: false },
    rrhh: { read: false, write: false },
    formatos: { read: ['Reclutamiento'], write: false },
    documentos: { read: false, write: false },
    contratos: { read: false, write: false },
    privado: { read: false, write: false },
    // Scouter de modelos: gestiona candidatos, castings y revisa su formulario.
    entrevistas: { read: 'ALL', write: false },
    castings: { read: 'ALL', write: 'ALL' },
    reclutamiento: { read: true, write: false },
    envios: { read: 'ALL', write: 'ALL' },
  },
  "Scouter de Aliados": {
    // Rol de Reclutamiento sin acceso al resto de módulos.
    aspirantes: { read: false, write: false },
    modelos: { read: false, write: false },
    clientes: { read: false, write: false },
    produccion: { read: false, write: false },
    finanzas: { read: false, write: false },
    academia: { read: false, write: false },
    rrhh: { read: false, write: false },
    formatos: { read: ['Reclutamiento'], write: false },
    documentos: { read: false, write: false },
    contratos: { read: false, write: false },
    privado: { read: false, write: false },
    aliados: { read: 'ALL', write: 'ALL' },
    reclutamiento: { read: true, write: false },
    envios: { read: 'ALL', write: 'ALL' },
  },
  "Booker": {
    aspirantes: { read: false, write: false },
    modelos: { read: 'ASSIGNED', write: false },
    clientes: { read: 'ASSIGNED', write: true },
    produccion: { read: false, write: false },
    finanzas: { read: false, write: false },
    academia: { read: false, write: false },
    rrhh: { read: false, write: false },
    formatos: { read: ['Booking'], write: false },
    documentos: { read: false, write: false },
    contratos: { read: 'ASSIGNED', write: false },
    privado: { read: false, write: false },
  },
  "Head Booker": {
    aspirantes: { read: false, write: false },
    modelos: { read: 'ALL', write: 'ASSIGN' },
    clientes: { read: 'ALL', write: 'REASSIGN' },
    produccion: { read: false, write: false },
    finanzas: { read: false, write: false },
    academia: { read: false, write: false },
    rrhh: { read: false, write: false },
    formatos: { read: ['Booking'], write: false },
    documentos: { read: false, write: false },
    contratos: { read: 'ALL', write: false },
    privado: { read: false, write: false },
  },
  "Producción": {
    aspirantes: { read: false, write: false },
    modelos: { read: false, write: false },
    clientes: { read: 'READ_ONLY', write: false },
    produccion: { read: 'RW', write: 'RW' },
    finanzas: { read: false, write: false },
    academia: { read: false, write: false },
    rrhh: { read: false, write: false },
    formatos: { read: ['Producción'], write: false },
    documentos: { read: false, write: false },
    contratos: { read: false, write: false },
    privado: { read: false, write: false },
  },
  "Creativo": {
    aspirantes: { read: false, write: false },
    modelos: { read: false, write: false },
    clientes: { read: false, write: false },
    produccion: { read: 'LIMITED', write: false },
    finanzas: { read: false, write: false },
    academia: { read: false, write: false },
    rrhh: { read: false, write: false },
    formatos: { read: ['Creativo'], write: false },
    documentos: { read: false, write: false },
    contratos: { read: false, write: false },
    privado: { read: false, write: false },
  },
  "Tesorería Agencia": {
    aspirantes: { read: false, write: false },
    modelos: { read: false, write: false },
    clientes: { read: false, write: false },
    produccion: { read: false, write: false },
    finanzas: { read: 'AGENCIA', write: 'AGENCIA' },
    academia: { read: false, write: false },
    rrhh: { read: false, write: false },
    formatos: { read: ['Finanzas'], write: false },
    documentos: { read: false, write: false },
    contratos: { read: false, write: false },
    privado: { read: false, write: false },
  },
  "Tesorería Academia": {
    aspirantes: { read: false, write: false },
    modelos: { read: false, write: false },
    clientes: { read: false, write: false },
    produccion: { read: false, write: false },
    finanzas: { read: 'ACADEMIA', write: 'ACADEMIA' },
    academia: { read: 'READ_ONLY', write: false },
    rrhh: { read: false, write: false },
    formatos: { read: ['Finanzas'], write: false },
    documentos: { read: false, write: false },
    contratos: { read: false, write: false },
    privado: { read: false, write: false },
  },
  "Administrativo": {
    aspirantes: { read: false, write: false },
    modelos: { read: 'READ_ONLY', write: false },
    clientes: { read: 'READ_ONLY', write: false },
    produccion: { read: 'READ_ONLY', write: false },
    finanzas: { read: 'ALL', write: false },
    academia: { read: 'RW', write: 'RW' },
    rrhh: { read: 'RW', write: 'RW' },
    formatos: { read: 'ALL', write: false },
    documentos: { read: 'ALL', write: false },
    contratos: { read: 'ALL', write: false },
    privado: { read: false, write: false },
    // Documentación de reclutamiento y copys: los administra, pero no el flujo
    // operativo de candidatos (spec §5: Aspirantes = No).
    reclutamiento: { read: 'ALL', write: 'ALL' },
  },
  "Dueño": {
    aspirantes: { read: 'ALL', write: 'ALL' },
    modelos: { read: 'ALL', write: 'ALL' },
    clientes: { read: 'ALL', write: 'ALL' },
    produccion: { read: 'ALL', write: 'ALL' },
    finanzas: { read: 'ALL', write: 'ALL' },
    academia: { read: 'ALL', write: 'ALL' },
    rrhh: { read: 'ALL', write: 'ALL' },
    formatos: { read: 'ALL', write: false },
    documentos: { read: 'ALL', write: 'ALL' },
    contratos: { read: 'ALL', write: 'ALL' },
    privado: { read: 'EXCLUSIVE', write: 'EXCLUSIVE' },
    // Departamento de Reclutamiento completo.
    entrevistas: { read: 'ALL', write: 'ALL' },
    castings: { read: 'ALL', write: 'ALL' },
    aliados: { read: 'ALL', write: 'ALL' },
    reclutamiento: { read: 'ALL', write: 'ALL' },
    envios: { read: 'ALL', write: 'ALL' },
  },
};

// Lista de roles de un usuario de sesión (acepta también un rol suelto).
export function userRoles(user) {
  if (!user) return [];
  if (Array.isArray(user.roles) && user.roles.length > 0) return user.roles.filter(Boolean);
  return user.rol ? [user.rol] : [];
}

// `rol` admite un rol (string) o una lista de roles: con varios roles se
// concede el acceso si al menos uno de ellos lo permite (misma regla que el backend).
export function canAccess(rol, recurso, accion = 'read') {
  if (Array.isArray(rol)) {
    return rol.some(r => Boolean(r) && canAccess(r, recurso, accion));
  }
  if (!rol) return false;

  const perm = PERMISSIONS[rol];
  if (!perm) return false;
  const rule = perm[recurso];
  if (!rule) return false;
  const value = rule[accion];
  if (value === false) return false;
  if (value === true || value === 'ALL' || value === 'RW') return true;
  if (accion === 'read') return Boolean(value);
  if (accion === 'write') {
    if (value === 'READ_ONLY' || value === 'LIMITED') return false;
    if (value === 'CREATE_ONLY') return true;
  }
  return Boolean(value);
}

export function getScope(rol, recurso) {
  const lista = Array.isArray(rol) ? rol : [rol];
  for (const r of lista) {
    const perm = PERMISSIONS[r];
    if (!perm) continue;
    const rule = perm[recurso];
    if (!rule) continue;
    if (rule.read !== false) return rule.read;
  }
  return null;
}

export function filterByScope(data, scope, currentUser, recurso) {
  if (!scope || scope === 'ALL' || scope === true) return data;
  if (scope === 'ASSIGNED') {
    return data.filter(item => {
      if (recurso === 'modelos') {
        return (currentUser?.asignaciones || []).includes(item.persona_id);
      }
      if (recurso === 'clientes') {
        return item.booker_persona_id === currentUser?.persona_id;
      }
      return true;
    });
  }
  if (scope === 'AGENCIA') return data.filter(item => item.division === 'Agencia');
  if (scope === 'ACADEMIA') return data.filter(item => item.division === 'Academia');
  if (scope === 'ACTIVE') return data.filter(item => !item.fecha_fin);
  return data;
}

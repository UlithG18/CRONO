// ============================================================
// CRONO — Cliente API (fetch con JWT)
// ============================================================

const API_BASE = 'http://localhost:5000/api';

// Serializa los parámetros de filtrado de listado omitiendo los vacíos.
function qs(params = {}) {
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return query ? `?${query}` : '';
}

let authToken = localStorage.getItem('crono_token') || null;

export function setAuthToken(token) {
  authToken = token;
  if (token) {
    localStorage.setItem('crono_token', token);
  } else {
    localStorage.removeItem('crono_token');
  }
}

export function getAuthToken() {
  return authToken;
}

async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de servidor' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Auth
export async function login(email, password) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(data.token);
  return data;
}

export async function getMe() {
  return apiFetch('/auth/me');
}

// Data endpoints
export const api = {
  getModelos: () => apiFetch('/data/modelos'),
  getClientes: () => apiFetch('/data/clientes'),
  getTransacciones: () => apiFetch('/data/transacciones'),
  getAspirantes: () => apiFetch('/data/aspirantes'),
  getNotificaciones: () => apiFetch('/data/notificaciones'),
  getProducciones: () => apiFetch('/data/producciones'),
  getPersonas: () => apiFetch('/data/personas'),
  getCortes: () => apiFetch('/data/cortes'),
  getCorteHistorial: () => apiFetch('/data/corte-historial'),
  getHabilidades: () => apiFetch('/data/habilidades'),
  getEntrevistas: () => apiFetch('/data/entrevistas'),
  getFormatos: () => apiFetch('/data/formatos'),
  getActas: () => apiFetch('/data/actas'),
  getColaboradores: () => apiFetch('/data/colaboradores'),
  getCursos: () => apiFetch('/data/cursos'),
  getMatriculas: () => apiFetch('/data/matriculas'),
  getAsignaciones: () => apiFetch('/data/asignaciones'),
  getRoles: () => apiFetch('/data/roles'),
  getAspectos: () => apiFetch('/data/aspectos'),
  getTipoRoles: () => apiFetch('/data/tipo-roles'),
  getDocumentos: () => apiFetch('/data/documentos'),
  getContratos: () => apiFetch('/data/contratos'),
  getEstadisticas: () => apiFetch('/data/estadisticas'),

  // Recursos Humanos: ficha de trabajadores, sus roles y su hoja de vida
  getStaff: () => apiFetch('/rrhh/trabajadores'),
  getStaffRoles: () => apiFetch('/rrhh/roles'),
  createStaff: (payload) => apiFetch('/rrhh/trabajadores', { method: 'POST', body: JSON.stringify(payload) }),
  updateStaff: (id, payload) => apiFetch(`/rrhh/trabajadores/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteStaff: (id) => apiFetch(`/rrhh/trabajadores/${id}`, { method: 'DELETE' }),

  // Documentos de CEO y Dirección y de Formatos Oficiales
  createDocumento: (payload) => apiFetch('/documentos', { method: 'POST', body: JSON.stringify(payload) }),
  updateDocumento: (id, payload) => apiFetch(`/documentos/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteDocumento: (id) => apiFetch(`/documentos/${id}`, { method: 'DELETE' }),

  // Documentos de Horizonte Crono (Junta del Oráculo)
  createDocumentoJunta: (payload) => apiFetch('/junta-oraculo/documentos', { method: 'POST', body: JSON.stringify(payload) }),
  updateDocumentoJunta: (id, payload) => apiFetch(`/junta-oraculo/documentos/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteDocumentoJunta: (id) => apiFetch(`/junta-oraculo/documentos/${id}`, { method: 'DELETE' }),

  // Contratos firmados
  createContrato: (payload) => apiFetch('/contratos-firmados', { method: 'POST', body: JSON.stringify(payload) }),
  updateContrato: (id, payload) => apiFetch(`/contratos-firmados/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteContrato: (id) => apiFetch(`/contratos-firmados/${id}`, { method: 'DELETE' }),

  // Minutas de reunión de la Junta del Oráculo
  createActa: (payload) => apiFetch('/junta-oraculo/minutas', { method: 'POST', body: JSON.stringify(payload) }),
  updateActa: (id, payload) => apiFetch(`/junta-oraculo/minutas/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteActa: (id) => apiFetch(`/junta-oraculo/minutas/${id}`, { method: 'DELETE' }),

  // ===== Departamento de Reclutamiento =====

  // Candidatos (modelos en proceso de reclutamiento)
  getCandidatos: (params = {}) => apiFetch(`/reclutamiento/candidatos${qs(params)}`),
  getCandidato: (personaId) => apiFetch(`/reclutamiento/candidatos/${personaId}`),
  createCandidato: (payload) => apiFetch('/reclutamiento/candidatos', { method: 'POST', body: JSON.stringify(payload) }),
  updateCandidato: (personaId, payload) => apiFetch(`/reclutamiento/candidatos/${personaId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  cambiarEstadoCandidato: (personaId, estado) => apiFetch(`/reclutamiento/candidatos/${personaId}/estado`, { method: 'PUT', body: JSON.stringify({ estado }) }),
  deleteCandidato: (personaId) => apiFetch(`/reclutamiento/candidatos/${personaId}`, { method: 'DELETE' }),

  // Entrevistas
  getEntrevistasReclutamiento: (params = {}) => apiFetch(`/reclutamiento/entrevistas${qs(params)}`),
  createEntrevista: (payload) => apiFetch('/reclutamiento/entrevistas', { method: 'POST', body: JSON.stringify(payload) }),
  updateEntrevista: (id, payload) => apiFetch(`/reclutamiento/entrevistas/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteEntrevista: (id) => apiFetch(`/reclutamiento/entrevistas/${id}`, { method: 'DELETE' }),

  // Documentos de reclutamiento
  getDocumentosReclutamiento: (params = {}) => apiFetch(`/reclutamiento/documentos${qs(params)}`),
  createDocumentoReclutamiento: (payload) => apiFetch('/reclutamiento/documentos', { method: 'POST', body: JSON.stringify(payload) }),
  updateDocumentoReclutamiento: (id, payload) => apiFetch(`/reclutamiento/documentos/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteDocumentoReclutamiento: (id) => apiFetch(`/reclutamiento/documentos/${id}`, { method: 'DELETE' }),

  // Copys
  getCopys: (params = {}) => apiFetch(`/reclutamiento/copys${qs(params)}`),
  createCopy: (payload) => apiFetch('/reclutamiento/copys', { method: 'POST', body: JSON.stringify(payload) }),
  updateCopy: (id, payload) => apiFetch(`/reclutamiento/copys/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCopy: (id) => apiFetch(`/reclutamiento/copys/${id}`, { method: 'DELETE' }),
  getTextosLegales: () => apiFetch('/reclutamiento/textos-legales'),
  upsertTextoLegal: (clave, valor) => apiFetch(`/reclutamiento/textos-legales/${encodeURIComponent(clave)}`, { method: 'PUT', body: JSON.stringify({ valor }) }),

  // Casting calls
  getCastings: (params = {}) => apiFetch(`/castings${qs(params)}`),
  getCatalogosCastings: () => apiFetch('/castings/catalogos'),
  createCasting: (payload) => apiFetch('/castings', { method: 'POST', body: JSON.stringify(payload) }),
  updateCasting: (id, payload) => apiFetch(`/castings/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  cerrarCasting: (id) => apiFetch(`/castings/${id}/cerrar`, { method: 'POST' }),
  deleteCasting: (id) => apiFetch(`/castings/${id}`, { method: 'DELETE' }),
  getParticipantes: (castingId, params = {}) => apiFetch(`/castings/${castingId}/participantes${qs(params)}`),
  addParticipante: (castingId, payload) => apiFetch(`/castings/${castingId}/participantes`, { method: 'POST', body: JSON.stringify(payload) }),
  updateParticipante: (castingId, participanteId, payload) => apiFetch(`/castings/${castingId}/participantes/${participanteId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteParticipante: (castingId, participanteId) => apiFetch(`/castings/${castingId}/participantes/${participanteId}`, { method: 'DELETE' }),
  crearFichaParticipante: (castingId, participanteId) => apiFetch(`/castings/${castingId}/participantes/${participanteId}/ficha`, { method: 'POST' }),
  vincularFichaParticipante: (castingId, participanteId, personaId) => apiFetch(`/castings/${castingId}/participantes/${participanteId}/vincular`, { method: 'POST', body: JSON.stringify({ aspirantePersonaId: personaId }) }),

  // Aliados creativos y locaciones aliadas
  getAliados: (params = {}) => apiFetch(`/aliados${qs(params)}`),
  getCatalogosAliados: () => apiFetch('/aliados/catalogos'),
  createAliado: (payload) => apiFetch('/aliados', { method: 'POST', body: JSON.stringify(payload) }),
  updateAliado: (personaId, payload) => apiFetch(`/aliados/${personaId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteAliado: (personaId) => apiFetch(`/aliados/${personaId}`, { method: 'DELETE' }),
  getLocacionesAliadas: (params = {}) => apiFetch(`/aliados/locaciones${qs(params)}`),
  createLocacionAliada: (payload) => apiFetch('/aliados/locaciones', { method: 'POST', body: JSON.stringify(payload) }),
  updateLocacionAliada: (id, payload) => apiFetch(`/aliados/locaciones/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteLocacionAliada: (id) => apiFetch(`/aliados/locaciones/${id}`, { method: 'DELETE' }),

  // Revisión de envíos de formularios públicos
  getEnvios: (params = {}) => apiFetch(`/envios-publicos${qs(params)}`),
  aprobarEnvio: (id, payload) => apiFetch(`/envios-publicos/${id}/aprobar`, { method: 'POST', body: JSON.stringify(payload || {}) }),
  rechazarEnvio: (id, payload) => apiFetch(`/envios-publicos/${id}/rechazar`, { method: 'POST', body: JSON.stringify(payload || {}) }),

  seed: () => apiFetch('/seed', { method: 'POST' }),
};

// Formularios públicos: sin sesión y sin acceso a ningún registro interno.
export const apiPublica = {
  enviarCasting: (payload) => apiFetch('/publico/casting', { method: 'POST', body: JSON.stringify(payload) }),
  enviarRedCreativa: (payload) => apiFetch('/publico/red-creativa', { method: 'POST', body: JSON.stringify(payload) }),
  getTextosLegales: () => apiFetch('/publico/textos-legales'),
};

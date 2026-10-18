// ============================================================
// CRONO — Capa de datos (API con caché local)
// Carga todas las entidades y las mapea al formato usado por las páginas.
// ============================================================

import { api, getAuthToken } from './api.js';
import { STAFF, TABS_POR_ROL } from './constants.js';

let cache = null;
let cacheTimestamp = 0;
let cacheVersion = 0;
const CACHE_TTL = 30000; // 30 segundos

function generateId() {
  return Date.now() + Math.random().toString(36).substr(2, 9);
}

// Versión de la caché: las páginas la observan para re-renderizar cuando llegan datos
export function getCacheVersion() {
  return cacheVersion;
}

// Suscripción a cambios de datos
const listeners = new Set();
export function subscribeCache(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function notifyCacheChange() {
  listeners.forEach(cb => cb(cacheVersion));
}

// --- Mapeadores PascalCase (C#) -> snake_case (JS) ---
const mapModelo = m => ({
  persona_id: m.personaId ?? m.PersonaId,
  nombre_artistico: m.nombreArtistico ?? m.NombreArtistico,
  genero: m.genero ?? m.Genero,
  rasgo_distintivo: m.rasgoDistintivo ?? m.RasgoDistintivo,
  enfoque: m.enfoque ?? m.Enfoque,
  portafolio_drive_link: m.portafolioDriveLink ?? m.PortafolioDriveLink,
  fecha_inicio_agencia: m.fechaInicioAgencia ?? m.FechaInicioAgencia,
});

const mapCliente = c => ({
  id: c.id ?? c.Id,
  persona_id: c.personaId ?? c.PersonaId,
  razon_social: c.razonSocial ?? c.RazonSocial,
  tipo_relacion: c.tipoRelacion ?? c.TipoRelacion,
  categoria: c.categoria ?? c.Categoria,
  estado_relacion: c.estadoRelacion ?? c.EstadoRelacion,
  booker_persona_id: c.bookerPersonaId ?? c.BookerPersonaId,
});

const mapTransaccion = t => ({
  id: t.id ?? t.Id,
  tipo: t.tipo ?? t.Tipo,
  division: t.division ?? t.Division,
  fecha: t.fecha ?? t.Fecha,
  contraparte_persona_id: t.contrapartePersonaId ?? t.ContrapartePersonaId,
  concepto: t.concepto ?? t.Concepto,
  valor: t.valor ?? t.Valor,
  estado_pago: t.estadoPago ?? t.EstadoPago,
});

const mapAspirante = a => ({
  persona_id: a.personaId ?? a.PersonaId,
  medio_contacto: a.medioContacto ?? a.MedioContacto,
  fecha_contacto: a.fechaContacto ?? a.FechaContacto,
  responsable_persona_id: a.responsablePersonaId ?? a.ResponsablePersonaId,
  estado: a.estado ?? a.Estado,
});

const mapNotificacion = n => ({
  id: n.id ?? n.Id,
  persona_id: n.personaId ?? n.PersonaId,
  corte_objetivo_id: n.corteObjetivoId ?? n.CorteObjetivoId,
  score_alcanzado: n.scoreAlcanzado ?? n.ScoreAlcanzado,
  estado: n.estado ?? n.Estado,
  fecha_generada: n.fechaGenerada ?? n.FechaGenerada,
  fecha_atencion: n.fechaAtencion ?? n.FechaAtencion,
});

const mapProduccion = p => ({
  id: p.id ?? p.Id,
  fecha: p.fecha ?? p.Fecha,
  cliente_id: p.clienteId ?? p.ClienteId,
  locacion_id: p.locacionId ?? p.LocacionId,
  tipo_evento: p.tipoEvento ?? p.TipoEvento,
  estado: p.estado ?? p.Estado,
});

const mapPersona = p => ({
  id: p.id ?? p.Id,
  nombre_completo: p.nombreCompleto ?? p.NombreCompleto,
  fecha_nacimiento: p.fechaNacimiento ?? p.FechaNacimiento,
  telefono: p.telefono ?? p.Telefono,
  correo: p.correo ?? p.Correo,
  instagram_usuario: p.instagramUsuario ?? p.InstagramUsuario,
  instagram_link: p.instagramLink ?? p.InstagramLink,
  fecha_creacion: p.fechaCreacion ?? p.FechaCreacion,
});

const mapCorte = c => ({
  id: c.id ?? c.Id,
  nombre: c.nombre ?? c.Nombre,
  orden_jerarquico: c.ordenJerarquico ?? c.OrdenJerarquico,
  criterio_ascenso: c.criterioAscenso ?? c.CriterioAscenso,
});

const mapCorteHistorial = h => ({
  id: h.id ?? h.Id,
  modelo_persona_id: h.modeloPersonaId ?? h.ModeloPersonaId,
  corte_id: h.corteId ?? h.CorteId,
  fecha_asignacion: h.fechaAsignacion ?? h.FechaAsignacion,
  fase: h.fase ?? h.Fase,
});

const mapHabilidad = h => ({
  id: h.id ?? h.Id,
  persona_id: h.personaId ?? h.PersonaId,
  aspecto: h.aspecto ?? h.Aspecto,
  nota: h.nota ?? h.Nota,
  fecha: h.fecha ?? h.Fecha,
});

const mapEntrevista = e => ({
  id: e.id ?? e.Id,
  aspirante_persona_id: e.aspirantePersonaId ?? e.AspirantePersonaId,
  fecha_hora: e.fechaHora ?? e.FechaHora,
  responsable_persona_id: e.responsablePersonaId ?? e.ResponsablePersonaId,
  estado_asistencia: e.estadoAsistencia ?? e.EstadoAsistencia,
});

const mapFormato = f => ({
  id: f.id ?? f.Id,
  nombre: f.nombre ?? f.Nombre,
  categoria: f.categoria ?? f.Categoria,
  roles: f.roles ?? f.Roles,
});

const mapActa = a => ({
  id: a.id ?? a.Id,
  fecha: a.fecha ?? a.Fecha,
  tema: a.tema ?? a.Tema,
  contenido: a.contenido ?? a.Contenido,
  autor_persona_id: a.autorPersonaId ?? a.AutorPersonaId,
});

const mapColaborador = c => ({
  persona_id: c.personaId ?? c.PersonaId,
  categoria: c.categoria ?? c.Categoria,
  es_recluta: c.esRecluta ?? c.EsRecluta,
  es_aliado: c.esAliado ?? c.EsAliado,
  estado_contrato: c.estadoContrato ?? c.EstadoContrato,
});

const mapCurso = c => ({
  id: c.id ?? c.Id,
  nombre: c.nombre ?? c.Nombre,
  modalidad: c.modalidad ?? c.Modalidad,
  descripcion: c.descripcion ?? c.Descripcion,
});

const mapMatricula = m => ({
  id: m.id ?? m.Id,
  estudiante_persona_id: m.estudiantePersonaId ?? m.EstudiantePersonaId,
  curso_id: m.cursoId ?? m.CursoId,
  valor_acordado: m.valorAcordado ?? m.ValorAcordado,
  estado: m.estado ?? m.Estado,
  cuotas: (m.cuotas ?? m.Cuotas ?? []).map(c => ({
    n: c.n ?? c.N,
    valor: c.valor ?? c.Valor,
    estado: c.estado ?? c.Estado,
    fecha: c.fecha ?? c.Fecha,
  })),
});

const mapAsignacion = a => ({
  id: a.id ?? a.Id,
  modelo_persona_id: a.modeloPersonaId ?? a.ModeloPersonaId,
  booker_persona_id: a.bookerPersonaId ?? a.BookerPersonaId,
  fecha_asignacion: a.fechaAsignacion ?? a.FechaAsignacion,
  activo: a.activo ?? a.Activo,
});

const mapRolPersona = r => ({
  id: r.id ?? r.Id,
  persona_id: r.personaId ?? r.PersonaId,
  tipo_rol_id: r.tipoRolId ?? r.TipoRolId,
  fecha_inicio: r.fechaInicio ?? r.FechaInicio,
  fecha_fin: r.fechaFin ?? r.FechaFin,
});

const mapAspecto = a => ({
  id: a.id ?? a.Id,
  nombre: a.nombre ?? a.Nombre,
});

const mapTipoRol = t => ({
  id: t.id ?? t.Id,
  nombre: t.nombre ?? t.Nombre,
});

const mapDocumento = d => ({
  id: d.id ?? d.Id,
  departamento: d.departamento ?? d.Departamento,
  categoria: d.categoria ?? d.Categoria,
  nombre: d.nombre ?? d.Nombre,
  descripcion: d.descripcion ?? d.Descripcion,
  tipo: d.tipo ?? d.Tipo,
  enlace: d.enlace ?? d.Enlace,
  fecha: d.fecha ?? d.Fecha,
  roles: d.roles ?? d.Roles ?? [],
});

const mapContrato = c => ({
  id: c.id ?? c.Id,
  modelo_persona_id: c.modeloPersonaId ?? c.ModeloPersonaId,
  tipo: c.tipo ?? c.Tipo,
  fecha_firma: c.fechaFirma ?? c.FechaFirma,
  estado: c.estado ?? c.Estado,
  enlace_documento: c.enlaceDocumento ?? c.EnlaceDocumento,
  observaciones: c.observaciones ?? c.Observaciones,
});

const mapStaff = s => ({
  persona_id: s.personaId ?? s.PersonaId,
  nombre: s.nombre ?? s.Nombre,
  rol: s.rol ?? s.Rol,
  roles: s.roles ?? s.Roles ?? [],
  fecha_contratacion: s.fechaContratacion ?? s.FechaContratacion,
  correo: s.correo ?? s.Correo ?? null,
  telefono: s.telefono ?? s.Telefono ?? null,
  fecha_nacimiento: s.fechaNacimiento ?? s.FechaNacimiento ?? null,
  instagram_usuario: s.instagramUsuario ?? s.InstagramUsuario ?? null,
  instagram_link: s.instagramLink ?? s.InstagramLink ?? null,
  fecha_creacion: s.fechaCreacion ?? s.FechaCreacion ?? null,
});

const mapStats = s => ({
  modelosActivos: s.modelosActivos ?? 0,
  aspirantesEnProceso: s.aspirantesEnProceso ?? 0,
  estudiantesActivos: s.estudiantesActivos ?? 0,
  notifPendientes: s.notifPendientes ?? 0,
  totalProyectos: s.totalProyectos ?? 0,
  ingresos: s.ingresos ?? 0,
  egresos: s.egresos ?? 0,
  inversiones: s.inversiones ?? 0,
  balance: s.balance ?? 0,
});

// --- Carga desde API ---
async function loadFromAPI() {
  if (!getAuthToken()) return null;

  try {
    const results = await Promise.all([
      api.getModelos(), api.getClientes(), api.getTransacciones(), api.getAspirantes(),
      api.getNotificaciones(), api.getProducciones(), api.getPersonas(), api.getCortes(),
      api.getCorteHistorial(), api.getHabilidades(), api.getEntrevistas(), api.getFormatos(),
      api.getActas(), api.getColaboradores(), api.getCursos(), api.getMatriculas(),
      api.getAsignaciones(), api.getRoles(), api.getAspectos(), api.getTipoRoles(),
      api.getEstadisticas(), api.getDocumentos(), api.getContratos(),
      api.getStaff(),
    ].map(p => p.catch(() => [])));

    cache = {
      personas: results[6].map(mapPersona),
      tipoRoles: results[19].map(mapTipoRol),
      rolPersonas: results[17].map(mapRolPersona),
      modelo: results[0].map(mapModelo),
      aspirante: results[3].map(mapAspirante),
      cortes: results[7].map(mapCorte),
      corteHistorial: results[8].map(mapCorteHistorial),
      cliente: results[1].map(mapCliente),
      colaboradores: results[13].map(mapColaborador),
      producciones: results[5].map(mapProduccion),
      transacciones: results[2].map(mapTransaccion),
      cursos: results[14].map(mapCurso),
      matriculas: results[15].map(mapMatricula),
      aspectosEvaluables: results[18].map(mapAspecto),
      habilidadActual: results[9].map(mapHabilidad),
      notificacionesNivel: results[4].map(mapNotificacion),
      asignacionesBooker: results[16].map(mapAsignacion),
      entrevistas: results[10].map(mapEntrevista),
      formatosOficiales: results[11].map(mapFormato),
      actasReunion: results[12].map(mapActa),
      documentos: results[21].map(mapDocumento),
      contratos: results[22].map(mapContrato),
      staff: results[23].map(mapStaff),
      locaciones: [],
      espacioPrivado: [],
      // También disponibles con prefijo _ para compatibilidad
      _modelos: results[0].map(mapModelo),
      _clientes: results[1].map(mapCliente),
      _transacciones: results[2].map(mapTransaccion),
      _aspirantes: results[3].map(mapAspirante),
      _notificaciones: results[4].map(mapNotificacion),
      _producciones: results[5].map(mapProduccion),
      _estadisticas: mapStats(results[20]),
    };
    cacheTimestamp = Date.now();
    cacheVersion++;
    notifyCacheChange();
    return cache;
  } catch (err) {
    console.error('Error cargando datos de API:', err);
    return null;
  }
}

export async function loadData() {
  if (cache && (Date.now() - cacheTimestamp) < CACHE_TTL) return cache;
  return loadFromAPI();
}

export async function refreshData() {
  cache = null;
  return loadFromAPI();
}

// --- Compatibilidad con la interfaz anterior (síncrona) ---
export function getDB() {
  if (cache) return cache;
  return {
    personas: [], tipoRoles: [], rolPersonas: [], modelo: [], aspirante: [],
    cortes: [], corteHistorial: [], cliente: [], colaboradores: [], producciones: [],
    transacciones: [], cursos: [], matriculas: [], aspectosEvaluables: [],
    habilidadActual: [], notificacionesNivel: [], asignacionesBooker: [],
    entrevistas: [], formatosOficiales: [], actasReunion: [], locaciones: [],
    espacioPrivado: [], documentos: [], contratos: [], staff: [],
  };
}

export function saveDB() { return true; }

export function getTabla(tabla) {
  return getDB()[tabla] || [];
}

export function getById(tabla, id) {
  return getTabla(tabla).find(item => item.id === id || item.persona_id === id);
}

export function getPersonaById(id) {
  return getDB().personas.find(p => p.id === id);
}

export function getPersonaNombre(id) {
  const p = getPersonaById(id);
  return p ? p.nombre_completo : `Persona ${id}`;
}

export function getModeloByPersonaId(personaId) {
  return getDB().modelo.find(m => m.persona_id === personaId);
}

export function getCorteHistorial(modeloPersonaId) {
  return getDB().corteHistorial.filter(h => h.modelo_persona_id === modeloPersonaId);
}

export function getCorteActual(modeloPersonaId) {
  const historial = getCorteHistorial(modeloPersonaId);
  if (historial.length === 0) return null;
  const ultimo = historial.sort((a, b) => new Date(b.fecha_asignacion) - new Date(a.fecha_asignacion))[0];
  return getDB().cortes.find(c => c.id === ultimo.corte_id);
}

export function getScore(personaId) {
  const obs = getDB().habilidadActual.filter(o => o.persona_id === personaId);
  if (obs.length === 0) return null;
  const porAspecto = {};
  obs.forEach(o => {
    if (!porAspecto[o.aspecto] || new Date(o.fecha) > new Date(porAspecto[o.aspecto].fecha)) {
      porAspecto[o.aspecto] = o;
    }
  });
  const notas = Object.values(porAspecto).map(o => o.nota);
  return notas.reduce((a, b) => a + b, 0) / notas.length;
}

export function getEstadisticas() {
  return getDB()._estadisticas;
}

export function addRegistro(tabla, registro) {
  const user = getCurrentUserFromStorage();
  registro.id = registro.id || generateId();
  registro.creado_por_persona_id = user?.persona_id || 14;
  registro.fecha_creacion = registro.fecha_creacion || new Date().toISOString().split('T')[0];
  const db = getDB();
  if (!db[tabla]) db[tabla] = [];
  db[tabla].push(registro);
  return registro;
}

export function updateRegistro(tabla, id, updates) {
  const db = getDB();
  if (!db[tabla]) return null;
  const idx = db[tabla].findIndex(item => item.id === id || item.persona_id === id);
  if (idx === -1) return null;
  updates.modificado_por_persona_id = getCurrentUserFromStorage()?.persona_id || 14;
  updates.fecha_modificacion = new Date().toISOString();
  db[tabla][idx] = { ...db[tabla][idx], ...updates };
  return db[tabla][idx];
}

export function deleteRegistro(tabla, id) {
  const db = getDB();
  if (!db[tabla]) return;
  db[tabla] = db[tabla].filter(item => item.id !== id && item.persona_id !== id);
}

export function getCurrentUserFromStorage() {
  try {
    const raw = localStorage.getItem('crono_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function resetDB() {
  cache = null;
  localStorage.removeItem('crono_user');
  localStorage.removeItem('crono_token');
}

// Compatibilidad
export const RBAC_POLICIES = {};
export function canAccessEntity() { return true; }
export function authorizeMutation() { return true; }
export { STAFF, TABS_POR_ROL };

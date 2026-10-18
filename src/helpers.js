export function cop(value) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function dateInput(dateStr) {
  if (!dateStr) return '';
  return dateStr.split('T')[0];
}

export function today() {
  return new Date().toISOString().split('T')[0];
}

export function scoreGeneral(personaId, observaciones) {
  const obs = observaciones.filter(o => o.persona_id === personaId);
  if (obs.length === 0) return null;
  const porAspecto = {};
  obs.forEach(o => {
    if (!porAspecto[o.aspecto] || new Date(o.fecha) > new Date(porAspecto[o.aspecto].fecha)) {
      porAspecto[o.aspecto] = o;
    }
  });
  const notas = Object.values(porAspecto).map(o => o.nota);
  if (notas.length === 0) return null;
  return notas.reduce((a, b) => a + b, 0) / notas.length;
}

export const CORTES = ["Delta", "Gamma III", "Gamma II", "Gamma I", "Beta III", "Beta II", "Beta I", "Centinela Alpha", "Centinela Omega", "Musa/Muso"];

export const UMBRAL_ASCENSO = 8.0;

export function cortesHistorial(modeloId, historial, cortes) {
  const h = historial.filter(h => h.modelo_persona_id === modeloId);
  return h.sort((a, b) => new Date(a.fecha_asignacion) - new Date(b.fecha_asignacion)).map(h => ({
    ...h,
    corte_nombre: cortes.find(c => c.id === h.corte_id)?.nombre || '?',
  }));
}

export function corteActual(modeloId, historial, cortes) {
  const h = historial.filter(h => h.modelo_persona_id === modeloId);
  if (h.length === 0) return null;
  const ultimo = h.sort((a, b) => new Date(b.fecha_asignacion) - new Date(a.fecha_asignacion))[0];
  return cortes.find(c => c.id === ultimo.corte_id);
}

export function proyectosPorPersona(personaId, proyectos) {
  return proyectos.filter(p => p.participantes.includes(personaId));
}

export function asistenciasPorPersona(personaId, asistencias) {
  return asistencias.filter(a => a.persona_id === personaId);
}
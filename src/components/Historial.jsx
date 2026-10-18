import React from 'react';
import { getDB, getPersonaNombre } from '../db';
import { formatDate } from '../helpers';

export default function Historial({ entidadTipo, entidadId }) {
  const db = getDB();

  // Buscar registros modificados de esta entidad
  const historial = [];
  Object.keys(db).forEach(tabla => {
    if (Array.isArray(db[tabla])) {
      db[tabla].forEach(item => {
        if (item.modificado_por_persona_id && (
          (item.persona_id === entidadId && tabla === 'personas') ||
          (item.persona_id === entidadId && tabla === 'aspirante') ||
          (item.modelo_persona_id === entidadId && tabla === 'corteHistorial') ||
          (item.estudiante_persona_id === entidadId && tabla === 'matriculas') ||
          (item.booker_persona_id === entidadId && tabla === 'asignacionesBooker')
        )) {
          historial.push({
            tabla,
            campo: 'modificado',
            autor: getPersonaNombre(item.modificado_por_persona_id),
            fecha: item.fecha_modificacion,
            detalle: `Modificación en ${tabla}`,
          });
        }
      });
    }
  });

  // También incluir creación
  const registros = db[entidadTipo.toLowerCase()] || [];
  const registro = registros.find(r => r.id === entidadId || r.persona_id === entidadId);

  if (registro?.creado_por_persona_id) {
    historial.push({
      tabla: entidadTipo.toLowerCase(),
      campo: 'creado',
      autor: getPersonaNombre(registro.creado_por_persona_id),
      fecha: registro.fecha_creacion,
      detalle: 'Creación del registro',
    });
  }

  historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  if (historial.length === 0) {
    return (
      <div className="card" style={{ padding: '24px', backgroundColor: 'var(--color-mist-gray)' }}>
        <p style={{ color: 'var(--color-smoke)', fontSize: '13px' }}>No hay historial de movimientos registrado.</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '24px' }}>
      <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>HISTORIAL DE MOVIMIENTOS</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {historial.map((h, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'var(--color-mist-gray)', borderRadius: '8px' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px' }}>{h.detalle}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-smoke)' }}>por {h.autor}</div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-smoke)' }}>
              {formatDate(h.fecha)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

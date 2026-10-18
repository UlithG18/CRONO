import React, { useState } from 'react';
import { getDB, getPersonaNombre, addRegistro, updateRegistro } from '../db';
import { scoreGeneral, UMBRAL_ASCENSO, today } from '../helpers';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Table } from '../components/ui/Table';

const TIPOS_EVENTO = ['Clase', 'Entrevista', 'Prueba de ascenso'];

export default function Evaluaciones({ rol }) {
  const [reloadKey, setReloadKey] = useState(0);
  const [eventoId, setEventoId] = useState('');
  const [scores, setScores] = useState({});
  const [observaciones, setObservaciones] = useState({});
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showFormEvento, setShowFormEvento] = useState(false);

  const [formEvento, setFormEvento] = useState({
    fecha: today(),
    tipo: 'Clase',
    tema: '',
    curso_id: '1',
    persona_id: '',
  });

  const db = getDB();
  const eventos = db.eventosEvaluativos || [];
  const eventoActivo = eventos.find(e => e.id === Number(eventoId)) || eventos[0];

  const getSubjects = (evt) => {
    if (!evt) return [];
    if (evt.tipo === 'Clase') {
      const mats = (db.matriculas || []).filter(m => m.curso_id === evt.curso_id && m.estado === 'Activo');
      return mats.map(m => ({ persona_id: m.estudiante_persona_id }));
    }
    if (evt.tipo === 'Entrevista' && evt.persona_id) {
      return [{ persona_id: evt.persona_id }];
    }
    if (evt.tipo === 'Prueba de ascenso') {
      return (db.modelo || []).map(m => ({ persona_id: m.persona_id }));
    }
    return (db.personas || []).slice(0, 5).map(p => ({ persona_id: p.id }));
  };

  const getAspectos = () => {
    return [
      { id: 1, nombre: 'Foto Pose' },
      { id: 2, nombre: 'Pasarela' },
      { id: 3, nombre: 'Expresión Corporal' },
      { id: 4, nombre: 'Actitud & Profesionalismo' },
    ];
  };

  const subjects = eventoActivo ? getSubjects(eventoActivo) : [];
  const aspectos = getAspectos();

  const handleScoreChange = (personaId, aspectoId, val) => {
    const num = parseFloat(val);
    setScores(prev => ({
      ...prev,
      [`${personaId}_${aspectoId}`]: isNaN(num) ? '' : num,
    }));
  };

  const handleAddEvento = (e) => {
    e.preventDefault();
    if (!formEvento.tema.trim()) return;

    const nuevo = addRegistro('eventosEvaluativos', {
      fecha: formEvento.fecha || today(),
      tipo: formEvento.tipo,
      tema: formEvento.tema.trim(),
      curso_id: formEvento.tipo === 'Clase' ? Number(formEvento.curso_id) : null,
      persona_id: formEvento.persona_id ? Number(formEvento.persona_id) : null,
      aspectos: [1, 2, 3, 4],
    });

    setFormEvento({ fecha: today(), tipo: 'Clase', tema: '', curso_id: '1', persona_id: '' });
    setShowFormEvento(false);
    setEventoId(String(nuevo.id));
    setReloadKey(k => k + 1);
  };

  const handleSaveEvaluaciones = () => {
    setSaving(true);
    const hoy = today();
    let count = 0;

    subjects.forEach(sub => {
      aspectos.forEach(asp => {
        const key = `${sub.persona_id}_${asp.id}`;
        const nota = scores[key];
        if (nota !== undefined && nota !== '') {
          // 1. Guardar observación inmutable en historial
          addRegistro('observacionesAspecto', {
            persona_id: sub.persona_id,
            aspecto: asp.nombre,
            aspecto_id: asp.id,
            nota: Number(nota),
            fecha: hoy,
            observacion: observaciones[key] || '',
            evento_id: eventoActivo?.id,
          });

          // 2. Actualizar última habilidad actual
          const dbNow = getDB();
          let hab = (dbNow.habilidadActual || []).find(h => h.persona_id === sub.persona_id && h.aspecto_id === asp.id);
          if (hab) {
            updateRegistro('habilidadActual', hab.id, { nota_actual: Number(nota), fecha_actualizacion: hoy });
          } else {
            addRegistro('habilidadActual', {
              persona_id: sub.persona_id,
              aspecto_id: asp.id,
              aspecto: asp.nombre,
              nota_actual: Number(nota),
              fecha_actualizacion: hoy,
            });
          }

          count++;
        }
      });

      // 3. Verificar umbral de ascenso de nivel (Regla de negocio 3.2: crear notificación si score >= 8.0)
      const dbRefreshed = getDB();
      const nuevoScore = scoreGeneral(sub.persona_id, dbRefreshed.observacionesAspecto || []);
      if (nuevoScore != null && nuevoScore >= UMBRAL_ASCENSO) {
        const existePendiente = (dbRefreshed.notificacionesNivel || []).some(
          n => n.modelo_persona_id === sub.persona_id && n.estado === 'pendiente'
        );
        if (!existePendiente) {
          addRegistro('notificacionesNivel', {
            modelo_persona_id: sub.persona_id,
            score_alcanzado: Number(nuevoScore.toFixed(1)),
            corte_actual_id: 1,
            corte_sugerido_id: 2,
            estado: 'pendiente',
            fecha: hoy,
          });
        }
      }
    });

    setSaving(false);
    setAlert(`Evaluación guardada exitosamente (${count} notas asentadas). Score y notificaciones actualizados.`);
    setReloadKey(k => k + 1);
  };

  return (
    <div key={reloadKey}>
      <div className="page-header page-header-flex">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-tag-mint">EVALUACIÓN CENTRAL</span>
            <span className="header-meta-pill">MECANISMO UNIFICADO</span>
          </div>
          <h2 className="page-title">SISTEMA EVALUATIVO</h2>
          <p className="page-subtitle">
            Cálculo dinámico de notas por aspecto en entrevistas, clases académicas y pruebas Centinela.
          </p>
        </div>

        <Button variant="primary" onClick={() => setShowFormEvento(!showFormEvento)}>
          {showFormEvento ? 'Cerrar' : '+ Crear Sesión Evaluativa'}
        </Button>
      </div>

      {alert && (
        <div className="alert alert-mint" style={{ marginBottom: '20px' }}>
          <span>✓</span>
          <span>{alert}</span>
        </div>
      )}

      {/* Formulario de Nueva Sesión */}
      {showFormEvento && (
        <div className="card" style={{ marginBottom: '24px', backgroundColor: 'var(--color-mist-gray)' }}>
          <div className="card-header">
            <h3 className="card-title">NUEVA SESIÓN O PRUEBA EVALUATIVA</h3>
            <span className="badge badge-black">EVENTO</span>
          </div>
          <form onSubmit={handleAddEvento}>
            <div className="form-grid-3">
              <Input
                label="Tema o Título"
                value={formEvento.tema}
                onChange={(e) => setFormEvento({ ...formEvento, tema: e.target.value })}
                placeholder="Ej. Evaluación de Pasarela Semestral"
                required
              />
              <Select
                label="Tipo de Evento"
                value={formEvento.tipo}
                onChange={(e) => setFormEvento({ ...formEvento, tipo: e.target.value })}
                options={TIPOS_EVENTO}
              />
              <Input
                label="Fecha"
                type="date"
                value={formEvento.fecha}
                onChange={(e) => setFormEvento({ ...formEvento, fecha: e.target.value })}
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button type="button" variant="ghost" onClick={() => setShowFormEvento(false)}>Cancelar</Button>
              <Button type="submit" variant="primary">Crear Sesión</Button>
            </div>
          </form>
        </div>
      )}

      {/* Selector de Evento Activo */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-smoke)', textTransform: 'uppercase' }}>
            Sesión Evaluativa Activa:
          </span>
          <select
            className="crono-select"
            style={{ maxWidth: '400px' }}
            value={eventoId || (eventoActivo ? String(eventoActivo.id) : '')}
            onChange={(e) => setEventoId(e.target.value)}
          >
            {eventos.map(e => (
              <option key={e.id} value={e.id}>
                #{e.id} &bull; {e.tipo.toUpperCase()}: {e.tema} ({e.fecha})
              </option>
            ))}
          </select>

          {eventoActivo && (
            <span className="badge badge-neutral">
              {eventoActivo.tipo} &bull; {subjects.length} evaluados
            </span>
          )}
        </div>
      </div>

      {/* Matriz Evaluativa */}
      {eventoActivo ? (
        <div className="table-container">
          <table className="crono-table">
            <thead>
              <tr>
                <th className="crono-th" style={{ width: '220px' }}>Persona Evaluada</th>
                {aspectos.map(asp => (
                  <th key={asp.id} className="crono-th" style={{ textAlign: 'center' }}>
                    {asp.nombre}
                  </th>
                ))}
                <th className="crono-th" style={{ width: '100px', textAlign: 'center' }}>Score Promedio</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map(sub => {
                const nombre = getPersonaNombre(sub.persona_id);
                const scoreActual = scoreGeneral(sub.persona_id, db.observacionesAspecto || []);

                return (
                  <tr key={sub.persona_id} className="crono-tr">
                    <td className="crono-td">
                      <div style={{ fontWeight: 600 }}>{nombre}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-smoke)' }}>
                        ID #{sub.persona_id}
                      </div>
                    </td>

                    {aspectos.map(asp => {
                      const key = `${sub.persona_id}_${asp.id}`;
                      const val = scores[key] !== undefined ? scores[key] : '';

                      return (
                        <td key={asp.id} className="crono-td" style={{ textAlign: 'center' }}>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            step="0.5"
                            className="crono-input"
                            style={{ width: '70px', textAlign: 'center', margin: '0 auto', padding: '6px' }}
                            placeholder="—"
                            value={val}
                            onChange={(e) => handleScoreChange(sub.persona_id, asp.id, e.target.value)}
                          />
                        </td>
                      );
                    })}

                    <td className="crono-td" style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {scoreActual != null ? (
                        <span style={{ color: scoreActual >= 8.0 ? 'var(--color-success)' : 'inherit' }}>
                          {scoreActual.toFixed(1)}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ padding: '20px', display: 'flex', justifyContent: 'flex-end', backgroundColor: 'var(--color-paper-white)' }}>
            <Button
              variant="primary"
              size="lg"
              disabled={saving}
              onClick={handleSaveEvaluaciones}
            >
              {saving ? 'Asentando Notas...' : 'Guardar y Recalcular Scores'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="card crono-table-empty">
          No hay eventos evaluativos disponibles. Crea uno para comenzar a calificar.
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { getDB, getPersonaNombre, addRegistro } from '../db';
import { today } from '../helpers';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Table } from '../components/ui/Table';

const TIPO_EVENTO_OPTIONS = ['Clase', 'Entrevista', 'Evaluacion', 'Produccion'];
const TIPO_BRECHA_OPTIONS = ['Produccion', 'Clase', 'Evaluacion', 'Entrevista'];

export default function Recursos({ rol }) {
  const [activeTab, setActiveTab] = useState('asistencias'); // 'asistencias' | 'brechas' | 'proyectos'
  const [asistenciaFilter, setAsistenciaFilter] = useState('Todos');
  const [showFormAsistencia, setShowFormAsistencia] = useState(false);
  const [showFormBrecha, setShowFormBrecha] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [formAsistencia, setFormAsistencia] = useState({
    persona_id: '',
    tipo_evento: 'Clase',
    fecha: today(),
    notas: '',
  });

  const [formBrecha, setFormBrecha] = useState({
    titulo: '',
    persona_id: '',
    tipo: 'Produccion',
    fecha_inicio: today(),
    fecha_fin: today(),
    notas: '',
  });

  const db = getDB();
  const personas = db.personas || [];
  const asistencias = db.historialAsistencias || [];
  const proyectos = db.proyectos || [];
  const brechas = db.brechasTemporales || [];

  const handleAddAsistencia = (e) => {
    e.preventDefault();
    if (!formAsistencia.persona_id) return;

    addRegistro('historialAsistencias', {
      persona_id: Number(formAsistencia.persona_id),
      tipo_evento: formAsistencia.tipo_evento,
      fecha: formAsistencia.fecha || today(),
      estado: 'Presente',
      notas: formAsistencia.notas.trim() || undefined,
    });

    setFormAsistencia({ persona_id: '', tipo_evento: 'Clase', fecha: today(), notas: '' });
    setShowFormAsistencia(false);
    setReloadKey(k => k + 1);
  };

  const handleAddBrecha = (e) => {
    e.preventDefault();
    if (!formBrecha.persona_id || !formBrecha.titulo.trim()) return;

    addRegistro('brechasTemporales', {
      titulo: formBrecha.titulo.trim(),
      persona_id: Number(formBrecha.persona_id),
      tipo: formBrecha.tipo,
      fecha_inicio: formBrecha.fecha_inicio,
      fecha_fin: formBrecha.fecha_fin,
      notas: formBrecha.notas.trim() || undefined,
    });

    setFormBrecha({ titulo: '', persona_id: '', tipo: 'Produccion', fecha_inicio: today(), fecha_fin: today(), notas: '' });
    setShowFormBrecha(false);
    setReloadKey(k => k + 1);
  };

  const asistenciasFiltradas = asistencias.filter(a => {
    return asistenciaFilter === 'Todos' || a.tipo_evento === asistenciaFilter;
  });

  const asistenciasColumns = [
    { key: 'id', header: 'ID', size: '70px', mono: true, render: (val) => `#${val}` },
    { key: 'persona_id', header: 'Talento / Alumno', render: (val) => (
      <div>
        <div style={{ fontWeight: 600 }}>{getPersonaNombre(val)}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-smoke)' }}>ID #{val}</div>
      </div>
    )},
    { key: 'tipo_evento', header: 'Tipo Evento', size: '130px', render: (val) => (
      <span className="badge badge-neutral">{val}</span>
    )},
    { key: 'fecha', header: 'Fecha', size: '120px', mono: true },
    { key: 'estado', header: 'Asistencia', size: '110px', render: (val) => (
      <span className={val === 'Presente' ? 'badge badge-mint' : 'badge badge-rose'}>{val}</span>
    )},
    { key: 'notas', header: 'Observación', render: (val) => (
      <span style={{ fontSize: '12px', color: 'var(--color-slate)' }}>{val || '—'}</span>
    )},
  ];

  const brechasColumns = [
    { key: 'id', header: 'ID', size: '70px', mono: true, render: (val) => `#${val}` },
    { key: 'titulo', header: 'Asignación / Bloqueo', render: (val, row) => (
      <div>
        <div style={{ fontWeight: 600 }}>{val}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-smoke)' }}>{row.notas || 'Sin notas'}</div>
      </div>
    )},
    { key: 'persona_id', header: 'Persona Asignada', render: (val) => (
      <span style={{ fontWeight: 600 }}>{getPersonaNombre(val)}</span>
    )},
    { key: 'tipo', header: 'Categoría', size: '130px', render: (val) => (
      <span className="badge badge-neutral">{val}</span>
    )},
    { key: 'rango', header: 'Período', size: '200px', mono: true, render: (_, row) => (
      `${row.fecha_inicio} &rarr; ${row.fecha_fin}`
    )},
  ];

  return (
    <div key={reloadKey}>
      <div className="page-header page-header-flex">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-tag-mint">RECURSOS &bull; OPERACIONES</span>
            <span className="header-meta-pill">AGENDA &bull; ASISTENCIAS &bull; DISPONIBILIDAD</span>
          </div>
          <h2 className="page-title">GESTIÓN DE RECURSOS</h2>
          <p className="page-subtitle">
            Control de asistencia presencial a clases y rodajes, más gestión de ocupación de talentos.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {activeTab === 'asistencias' && (
            <Button variant="primary" onClick={() => setShowFormAsistencia(!showFormAsistencia)}>
              {showFormAsistencia ? 'Cerrar' : '+ Registrar Asistencia'}
            </Button>
          )}
          {activeTab === 'brechas' && (
            <Button variant="primary" onClick={() => setShowFormBrecha(!showFormBrecha)}>
              {showFormBrecha ? 'Cerrar' : '+ Bloquear Disponibilidad'}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Píldora */}
      <div className="login-tabs-pill" style={{ maxWidth: '440px', marginBottom: '20px' }}>
        <button
          type="button"
          className={`login-tab-btn ${activeTab === 'asistencias' ? 'active' : ''}`}
          onClick={() => setActiveTab('asistencias')}
        >
          Asistencias ({asistencias.length})
        </button>
        <button
          type="button"
          className={`login-tab-btn ${activeTab === 'brechas' ? 'active' : ''}`}
          onClick={() => setActiveTab('brechas')}
        >
          Disponibilidad ({brechas.length})
        </button>
      </div>

      {/* Formularios */}
      {showFormAsistencia && activeTab === 'asistencias' && (
        <div className="card" style={{ marginBottom: '24px', backgroundColor: 'var(--color-mist-gray)' }}>
          <div className="card-header">
            <h3 className="card-title">REGISTRO DE ASISTENCIA A EVENTO</h3>
            <span className="badge badge-black">ASISTENCIA</span>
          </div>
          <form onSubmit={handleAddAsistencia}>
            <div className="form-grid-3">
              <Select
                label="Persona"
                value={formAsistencia.persona_id}
                onChange={(e) => setFormAsistencia({ ...formAsistencia, persona_id: e.target.value })}
                options={[
                  { value: '', label: 'Seleccionar persona...' },
                  ...personas.map(p => ({ value: String(p.id), label: `${p.nombre_completo} (#${p.id})` })),
                ]}
                required
              />
              <Select
                label="Tipo de Evento"
                value={formAsistencia.tipo_evento}
                onChange={(e) => setFormAsistencia({ ...formAsistencia, tipo_evento: e.target.value })}
                options={TIPO_EVENTO_OPTIONS}
              />
              <Input
                label="Fecha"
                type="date"
                value={formAsistencia.fecha}
                onChange={(e) => setFormAsistencia({ ...formAsistencia, fecha: e.target.value })}
                required
              />
            </div>
            <div style={{ marginTop: '12px' }}>
              <Input
                label="Notas / Observaciones"
                value={formAsistencia.notas}
                onChange={(e) => setFormAsistencia({ ...formAsistencia, notas: e.target.value })}
                placeholder="Puntualidad, justificación, etc."
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button type="button" variant="ghost" onClick={() => setShowFormAsistencia(false)}>Cancelar</Button>
              <Button type="submit" variant="primary">Guardar Asistencia</Button>
            </div>
          </form>
        </div>
      )}

      {showFormBrecha && activeTab === 'brechas' && (
        <div className="card" style={{ marginBottom: '24px', backgroundColor: 'var(--color-mist-gray)' }}>
          <div className="card-header">
            <h3 className="card-title">BLOQUEAR CALENDARIO / OCUPACIÓN</h3>
            <span className="badge badge-black">DISPONIBILIDAD</span>
          </div>
          <form onSubmit={handleAddBrecha}>
            <div className="form-grid-3">
              <Input
                label="Motivo del Bloqueo"
                value={formBrecha.titulo}
                onChange={(e) => setFormBrecha({ ...formBrecha, titulo: e.target.value })}
                placeholder="Ej. Rodaje Exclusivo Vogue"
                required
              />
              <Select
                label="Persona"
                value={formBrecha.persona_id}
                onChange={(e) => setFormBrecha({ ...formBrecha, persona_id: e.target.value })}
                options={[
                  { value: '', label: 'Seleccionar talento...' },
                  ...personas.map(p => ({ value: String(p.id), label: `${p.nombre_completo} (#${p.id})` })),
                ]}
                required
              />
              <Select
                label="Tipo"
                value={formBrecha.tipo}
                onChange={(e) => setFormBrecha({ ...formBrecha, tipo: e.target.value })}
                options={TIPO_BRECHA_OPTIONS}
              />
            </div>
            <div className="form-grid-2" style={{ marginTop: '12px' }}>
              <Input
                label="Fecha Inicio"
                type="date"
                value={formBrecha.fecha_inicio}
                onChange={(e) => setFormBrecha({ ...formBrecha, fecha_inicio: e.target.value })}
                required
              />
              <Input
                label="Fecha Fin"
                type="date"
                value={formBrecha.fecha_fin}
                onChange={(e) => setFormBrecha({ ...formBrecha, fecha_fin: e.target.value })}
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button type="button" variant="ghost" onClick={() => setShowFormBrecha(false)}>Cancelar</Button>
              <Button type="submit" variant="primary">Guardar Bloqueo</Button>
            </div>
          </form>
        </div>
      )}

      {/* Vistas */}
      {activeTab === 'asistencias' && (
        <div>
          <div className="card" style={{ padding: '16px 20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['Todos', ...TIPO_EVENTO_OPTIONS].map(t => (
                <button
                  key={t}
                  type="button"
                  className={`btn btn-sm ${asistenciaFilter === t ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ borderRadius: 'var(--radius-tag)' }}
                  onClick={() => setAsistenciaFilter(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <Table columns={asistenciasColumns} data={asistenciasFiltradas} emptyMessage="No hay asistencias registradas." />
        </div>
      )}

      {activeTab === 'brechas' && (
        <Table columns={brechasColumns} data={brechas} emptyMessage="No hay registros de ocupación o bloqueos." />
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { getDB, addRegistro, updateRegistro, getPersonaNombre } from '../db';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Table } from '../components/ui/Table';

const MEDIOS_CONTACTO = ['Instagram', 'Referido', 'Scouting', 'Casting call'];
const ESTADOS_ASPIRANTE = ['Todos', 'Pendiente', 'Entrevistado', 'Vinculado', 'Descartado'];

export default function Aspirantes({ rol }) {
  const [showForm, setShowForm] = useState(false);
  const [filterEstado, setFilterEstado] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({
    nombre_completo: '',
    telefono: '',
    correo: '',
    instagram_usuario: '',
    medio_contacto: 'Instagram',
  });

  const canAdd = rol === 'Scouter' || rol === 'Dueño' || rol === 'Administrativo';
  const canEvaluate = rol === 'Entrevistador' || rol === 'Dueño' || rol === 'Administrativo';

  function loadData() {
    const db = getDB();
    const aspirantesRol = (db.rolPersonas || []).filter(r => r.tipo_rol_id === 1);
    return aspirantesRol.map(rp => {
      const aspirante = (db.aspirante || []).find(a => a.persona_id === rp.persona_id) || {};
      const persona = (db.personas || []).find(p => p.id === rp.persona_id) || {};
      return {
        ...aspirante,
        persona_id: rp.persona_id,
        nombre: persona.nombre_completo || getPersonaNombre(rp.persona_id),
        telefono: persona.telefono || '—',
        correo: persona.correo || '—',
        instagram: persona.instagram_usuario || '—',
        fecha_inicio: rp.fecha_inicio || persona.fecha_creacion,
        estado: aspirante.estado || 'Pendiente',
      };
    });
  }

  const [aspirantes, setAspirantes] = useState(loadData());

  function reload() {
    setAspirantes(loadData());
  }

  function handleAdd(e) {
    e.preventDefault();
    if (!form.nombre_completo.trim()) return;

    const fechaHoy = new Date().toISOString().split('T')[0];

    const persona = addRegistro('personas', {
      nombre_completo: form.nombre_completo.trim(),
      telefono: form.telefono.trim() || undefined,
      correo: form.correo.trim() || undefined,
      instagram_usuario: form.instagram_usuario.trim() || undefined,
      fecha_creacion: fechaHoy,
    });

    addRegistro('aspirante', {
      persona_id: persona.id,
      medio_contacto: form.medio_contacto,
      fecha_contacto: fechaHoy,
      responsable_persona_id: null,
      estado: 'Pendiente',
    });

    addRegistro('rolPersonas', {
      persona_id: persona.id,
      tipo_rol_id: 1, // Aspirante
      fecha_inicio: fechaHoy,
      fecha_fin: null,
    });

    setForm({
      nombre_completo: '',
      telefono: '',
      correo: '',
      instagram_usuario: '',
      medio_contacto: 'Instagram',
    });
    setShowForm(false);
    reload();
  }

  function handleUpdateEstado(personaId, nuevoEstado) {
    const db = getDB();
    const hoy = new Date().toISOString().split('T')[0];

    updateRegistro('aspirante', personaId, { estado: nuevoEstado });

    if (nuevoEstado === 'Vinculado') {
      // Cerrar rol Aspirante
      const rolAspirante = (db.rolPersonas || []).find(r => r.persona_id === personaId && r.tipo_rol_id === 1 && !r.fecha_fin);
      if (rolAspirante) {
        updateRegistro('rolPersonas', rolAspirante.id, { fecha_fin: hoy });
      }

      // Abrir rol Modelo
      addRegistro('rolPersonas', {
        persona_id: personaId,
        tipo_rol_id: 2,
        fecha_inicio: hoy,
        fecha_fin: null,
      });

      // Crear ficha de modelo
      const persona = (db.personas || []).find(p => p.id === personaId);
      addRegistro('modelo', {
        persona_id: personaId,
        nombre_artistico: persona?.nombre_completo || 'Sin nombre',
        genero: 'female',
        rasgo_distintivo: '',
        enfoque: 'moda',
        portafolio_drive_link: '',
        fecha_inicio_agencia: hoy,
      });

      // Asignar corte inicial Delta
      addRegistro('corteHistorial', {
        modelo_persona_id: personaId,
        corte_id: 1,
        fecha_asignacion: hoy,
      });
    }

    reload();
  }

  const filteredAspirantes = aspirantes.filter(item => {
    const matchesEstado = filterEstado === 'Todos' || item.estado === filterEstado;
    const matchesSearch = item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.instagram.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesEstado && matchesSearch;
  });

  const getBadgeClass = (estado) => {
    switch (estado) {
      case 'Pendiente': return 'badge badge-yellow';
      case 'Entrevistado': return 'badge badge-blue';
      case 'Vinculado': return 'badge badge-mint';
      case 'Descartado': return 'badge badge-rose';
      default: return 'badge badge-neutral';
    }
  };

  const columns = [
    { key: 'persona_id', header: 'ID', size: '70px', mono: true, render: (val) => `#${val}` },
    { key: 'nombre', header: 'Nombre Completo', render: (val, row) => (
      <div>
        <div style={{ fontWeight: 600 }}>{val}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-smoke)' }}>
          {row.instagram !== '—' ? row.instagram : row.correo}
        </div>
      </div>
    )},
    { key: 'medio_contacto', header: 'Canal', size: '130px', render: (val) => <span className="badge badge-neutral">{val || 'Scouting'}</span> },
    { key: 'fecha_inicio', header: 'Fecha Contacto', size: '130px', mono: true },
    { key: 'estado', header: 'Estado', size: '130px', render: (val) => <span className={getBadgeClass(val)}>{val}</span> },
    { key: 'acciones', header: 'Acciones', size: '200px', render: (_, row) => (
      <div style={{ display: 'flex', gap: '6px' }}>
        {canEvaluate && row.estado === 'Pendiente' && (
          <Button
            variant="mint"
            size="sm"
            onClick={() => handleUpdateEstado(row.persona_id, 'Entrevistado')}
            style={{ fontSize: '11px' }}
          >
            Entrevistar
          </Button>
        )}
        {canEvaluate && row.estado === 'Entrevistado' && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleUpdateEstado(row.persona_id, 'Vinculado')}
            style={{ fontSize: '11px' }}
          >
            Vincular
          </Button>
        )}
        {canEvaluate && row.estado !== 'Descartado' && row.estado !== 'Vinculado' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleUpdateEstado(row.persona_id, 'Descartado')}
            style={{ fontSize: '11px', color: 'var(--color-danger)' }}
          >
            Descartar
          </Button>
        )}
      </div>
    )},
  ];

  return (
    <div>
      <div className="page-header page-header-flex">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-tag-mint">RECLUTAMIENTO</span>
            <span className="header-meta-pill">{filteredAspirantes.length} REGISTROS</span>
          </div>
          <h2 className="page-title">EMBUDO DE ASPIRANTES</h2>
          <p className="page-subtitle">
            Seguimiento de nuevos talentos desde scouting y casting calls hasta vinculación oficial.
          </p>
        </div>

        {canAdd && (
          <Button
            variant="primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cerrar Formulario' : '+ Registrar Aspirante'}
          </Button>
        )}
      </div>

      {/* Formulario Expandible */}
      {showForm && (
        <div className="card" style={{ marginBottom: '24px', backgroundColor: 'var(--color-mist-gray)' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">NUEVO ASPIRANTE</h3>
              <div className="card-subtitle">Registrar identidad inicial en la base central</div>
            </div>
            <span className="badge badge-black">PERSONA &bull; ROL 1</span>
          </div>

          <form onSubmit={handleAdd}>
            <div className="form-grid-3">
              <Input
                label="Nombre Completo"
                value={form.nombre_completo}
                onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })}
                placeholder="Ej. Sofía Mendoza"
                required
              />

              <Input
                label="Teléfono Móvil"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                placeholder="300 123 4567"
              />

              <Input
                label="Correo Electrónico"
                type="email"
                value={form.correo}
                onChange={(e) => setForm({ ...form, correo: e.target.value })}
                placeholder="sofia@email.com"
              />
            </div>

            <div className="form-grid-2" style={{ marginTop: '12px' }}>
              <Input
                label="Usuario de Instagram"
                value={form.instagram_usuario}
                onChange={(e) => setForm({ ...form, instagram_usuario: e.target.value })}
                placeholder="@sofia.mendoza"
              />

              <Select
                label="Medio de Contacto"
                value={form.medio_contacto}
                onChange={(e) => setForm({ ...form, medio_contacto: e.target.value })}
                options={MEDIOS_CONTACTO}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary">
                Guardar e Iniciar Proceso
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {ESTADOS_ASPIRANTE.map(st => (
              <button
                key={st}
                type="button"
                className={`btn btn-sm ${filterEstado === st ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 'var(--radius-tag)' }}
                onClick={() => setFilterEstado(st)}
              >
                {st}
              </button>
            ))}
          </div>

          <div style={{ width: '280px' }}>
            <input
              type="text"
              className="crono-input"
              placeholder="Buscar por nombre o red..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '6px 12px', fontSize: '13px' }}
            />
          </div>
        </div>
      </div>

      {/* Tabla Brutalista */}
      <Table
        columns={columns}
        data={filteredAspirantes}
        emptyMessage="No se encontraron aspirantes que coincidan con los filtros aplicados."
      />
    </div>
  );
}

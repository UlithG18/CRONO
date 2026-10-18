import React, { useState } from 'react';
import { getDB, getPersonaNombre, addRegistro } from '../db';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Table } from '../components/ui/Table';

const TIPOS_PORTAFOLIO = ['Book', 'Polaroids', 'Composite', 'Video Reel'];

export default function Portafolio({ rol }) {
  const [showForm, setShowForm] = useState(false);
  const [filterTipo, setFilterTipo] = useState('Todos');
  const [reloadKey, setReloadKey] = useState(0);

  const [form, setForm] = useState({
    tipo: 'Book',
    nombre: '',
    persona_id: '',
    drive_link: '',
  });

  const canManage = rol === 'Head Booker' || rol === 'Dueño';

  const db = getDB();
  const materiales = db.materialPortafolio || [];
  const modelos = db.modelo || [];

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;

    addRegistro('materialPortafolio', {
      tipo: form.tipo,
      nombre: form.nombre.trim(),
      persona_id: form.persona_id ? Number(form.persona_id) : undefined,
      drive_link: form.drive_link.trim() || 'https://drive.google.com/crono-talent',
      fecha_creacion: new Date().toISOString().split('T')[0],
    });

    setForm({ tipo: 'Book', nombre: '', persona_id: '', drive_link: '' });
    setShowForm(false);
    setReloadKey(k => k + 1);
  };

  const filteredMateriales = materiales.filter(m => {
    return filterTipo === 'Todos' || m.tipo === filterTipo;
  });

  const columns = [
    { key: 'id', header: 'ID', size: '70px', mono: true, render: (val) => `#${val}` },
    { key: 'nombre', header: 'Material / Colección', render: (val, row) => (
      <div>
        <div style={{ fontWeight: 600 }}>{val}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-smoke)' }}>
          Fecha: {row.fecha_creacion || '2026-01-10'}
        </div>
      </div>
    )},
    { key: 'tipo', header: 'Formato', size: '130px', render: (val) => (
      <span className={val === 'Book' ? 'badge badge-blue' : val === 'Polaroids' ? 'badge badge-mint' : 'badge badge-neutral'}>
        {val}
      </span>
    )},
    { key: 'persona_id', header: 'Modelo', size: '180px', render: (val) => (
      val ? <span style={{ fontWeight: 600 }}>{getPersonaNombre(val)}</span> : <span style={{ color: 'var(--color-smoke)' }}>Catálogo General</span>
    )},
    { key: 'drive_link', header: 'Enlace Google Drive', render: (val) => (
      <a
        href={val || '#'}
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
      >
        Abrir Archivo Drive &rarr;
      </a>
    )},
  ];

  return (
    <div key={reloadKey}>
      <div className="page-header page-header-flex">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-tag-mint">BOOKING &bull; TALENTO</span>
            <span className="header-meta-pill">ARCHIVOS EXTERNOS DRIVE</span>
          </div>
          <h2 className="page-title">PORTAFOLIOS &amp; POLAROIDS</h2>
          <p className="page-subtitle">
            Books fotográficos, composites comerciales y enlaces a carpetas Drive seguras para clientes.
          </p>
        </div>

        {canManage && (
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cerrar' : '+ Cargar Nuevo Enlace'}
          </Button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '24px', backgroundColor: 'var(--color-mist-gray)' }}>
          <div className="card-header">
            <h3 className="card-title">REGISTRAR MATERIAL DE PORTAFOLIO</h3>
            <span className="badge badge-black">GOOGLE DRIVE LINK</span>
          </div>
          <form onSubmit={handleAdd}>
            <div className="form-grid-3">
              <Input
                label="Título del Material"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej. Book Editorial Primavera — Valentina"
                required
              />
              <Select
                label="Tipo de Material"
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                options={TIPOS_PORTAFOLIO}
              />
              <Select
                label="Modelo Asociado"
                value={form.persona_id}
                onChange={(e) => setForm({ ...form, persona_id: e.target.value })}
                options={[
                  { value: '', label: 'Ninguno / General' },
                  ...modelos.map(m => ({ value: String(m.persona_id), label: getPersonaNombre(m.persona_id) })),
                ]}
              />
            </div>
            <div style={{ marginTop: '12px' }}>
              <Input
                label="URL de Google Drive (link_drive)"
                value={form.drive_link}
                onChange={(e) => setForm({ ...form, drive_link: e.target.value })}
                placeholder="https://drive.google.com/drive/folders/..."
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" variant="primary">Guardar Enlace</Button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['Todos', ...TIPOS_PORTAFOLIO].map(t => (
            <button
              key={t}
              type="button"
              className={`btn btn-sm ${filterTipo === t ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 'var(--radius-tag)' }}
              onClick={() => setFilterTipo(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <Table
        columns={columns}
        data={filteredMateriales}
        emptyMessage="No hay materiales cargados para este filtro."
      />
    </div>
  );
}
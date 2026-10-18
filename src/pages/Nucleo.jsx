import React, { useState } from 'react';
import { getDB, addRegistro, updateRegistro } from '../db';
import { today } from '../helpers';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';

export default function Nucleo({ rol }) {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [form, setForm] = useState({
    nombre_completo: '',
    telefono: '',
    correo: '',
    instagram_usuario: '',
    fecha_nacimiento: '',
  });

  const canManage = rol === 'Administrativo' || rol === 'Dueño';

  const db = getDB();
  const personas = db.personas || [];
  const tipoRoles = db.tipoRoles || [];
  const rolPersonas = db.rolPersonas || [];

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.nombre_completo.trim()) return;

    addRegistro('personas', {
      nombre_completo: form.nombre_completo.trim(),
      telefono: form.telefono.trim() || undefined,
      correo: form.correo.trim() || undefined,
      instagram_usuario: form.instagram_usuario.trim() || undefined,
      fecha_nacimiento: form.fecha_nacimiento || undefined,
      fecha_creacion: today(),
    });

    setForm({ nombre_completo: '', telefono: '', correo: '', instagram_usuario: '', fecha_nacimiento: '' });
    setShowForm(false);
    setReloadKey(k => k + 1);
  };

  const filteredPersonas = personas.filter(p => {
    const s = searchTerm.toLowerCase();
    return (p.nombre_completo || '').toLowerCase().includes(s) ||
           (p.correo || '').toLowerCase().includes(s) ||
           (p.instagram_usuario || '').toLowerCase().includes(s);
  });

  const columns = [
    { key: 'id', header: 'ID Central', size: '90px', mono: true, render: (val) => `#PER-${val}` },
    { key: 'nombre_completo', header: 'Identidad Legal / Completa', render: (val, row) => (
      <div>
        <div style={{ fontWeight: 600 }}>{val}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-smoke)' }}>
          {row.fecha_nacimiento ? `Nac: ${row.fecha_nacimiento}` : 'Sin fecha nac.'}
        </div>
      </div>
    )},
    { key: 'correo', header: 'Contacto', render: (val, row) => (
      <div>
        <div style={{ fontSize: '13px' }}>{val || '—'}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-smoke)' }}>
          {row.telefono || '—'}
        </div>
      </div>
    )},
    { key: 'instagram_usuario', header: 'Instagram', size: '160px', render: (val) => (
      val ? <span className="badge badge-neutral">{val}</span> : <span style={{ color: 'var(--color-smoke)' }}>—</span>
    )},
    { key: 'roles', header: 'Roles de Negocio', render: (_, row) => {
      const activeRoles = rolPersonas.filter(r => r.persona_id === row.id && !r.fecha_fin);
      if (activeRoles.length === 0) return <span style={{ color: 'var(--color-smoke)', fontSize: '12px' }}>Sin rol activo</span>;
      return (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {activeRoles.map(r => {
            const tr = tipoRoles.find(t => t.id === r.tipo_rol_id);
            return (
              <span key={r.id} className="badge badge-mint" style={{ fontSize: '10px' }}>
                {tr ? tr.nombre : `Rol #${r.tipo_rol_id}`}
              </span>
            );
          })}
        </div>
      );
    }},
  ];

  return (
    <div key={reloadKey}>
      <div className="page-header page-header-flex">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-tag-mint">FUNDACIONAL &bull; IDENTIDAD</span>
            <span className="header-meta-pill">TABLA PERSONA ({filteredPersonas.length})</span>
          </div>
          <h2 className="page-title">NÚCLEO — IDENTIDAD ÚNICA</h2>
          <p className="page-subtitle">
            Entidad madre del sistema. Todas las relaciones operativas (Modelos, Aspirantes, Estudiantes, Clientes y Colaboradores) referencian esta fuente de verdad.
          </p>
        </div>

        {canManage && (
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cerrar' : '+ Registrar Nueva Persona'}
          </Button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '24px', backgroundColor: 'var(--color-mist-gray)' }}>
          <div className="card-header">
            <h3 className="card-title">ALTA DE PERSONA EN SISTEMA CENTRAL</h3>
            <span className="badge badge-black">PERSONA</span>
          </div>
          <form onSubmit={handleAdd}>
            <div className="form-grid-3">
              <Input
                label="Nombre Completo"
                value={form.nombre_completo}
                onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })}
                placeholder="Ej. Andrés Silva Gómez"
                required
              />
              <Input
                label="Teléfono Móvil"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                placeholder="300 000 0000"
              />
              <Input
                label="Correo Electrónico"
                type="email"
                value={form.correo}
                onChange={(e) => setForm({ ...form, correo: e.target.value })}
                placeholder="andres@email.com"
              />
            </div>
            <div className="form-grid-2" style={{ marginTop: '12px' }}>
              <Input
                label="Usuario de Instagram"
                value={form.instagram_usuario}
                onChange={(e) => setForm({ ...form, instagram_usuario: e.target.value })}
                placeholder="@andres.silva"
              />
              <Input
                label="Fecha de Nacimiento"
                type="date"
                value={form.fecha_nacimiento}
                onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" variant="primary">Guardar Persona</Button>
            </div>
          </form>
        </div>
      )}

      {/* Buscador */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '16px' }}>
        <input
          type="text"
          className="crono-input"
          placeholder="Buscar persona por nombre, correo o instagram..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: '400px' }}
        />
      </div>

      <Table
        columns={columns}
        data={filteredPersonas}
        emptyMessage="No hay personas que coincidan con la búsqueda."
      />
    </div>
  );
}
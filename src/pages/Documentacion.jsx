import React, { useState } from 'react';
import { getDB, addRegistro } from '../db';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';

const FORMATO_ROLES = {
  1: ['Administrativo', 'Head Booker', 'Dueño'],
  2: ['Booker', 'Head Booker', 'Dueño'],
  3: ['Entrevistador', 'Scouter', 'Dueño'],
  4: ['Producción', 'Creativo', 'Administrativo', 'Dueño'],
  5: ['Administrativo', 'Dueño'],
  6: ['Administrativo', 'Head Booker', 'Dueño'],
  7: ['Booker', 'Head Booker', 'Dueño'],
  8: ['Producción', 'Creativo', 'Dueño'],
};

export default function Documentacion({ rol }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', categoria: 'Contratos' });
  const [reloadKey, setReloadKey] = useState(0);

  const db = getDB();
  const formatos = db.formatosOficiales || [];

  const misFormatos = formatos.filter(f =>
    rol === 'Dueño' || (FORMATO_ROLES[f.id] && FORMATO_ROLES[f.id].includes(rol))
  );

  const canCreate = ['Dueño', 'Administrativo', 'Head Booker'].includes(rol);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;

    addRegistro('formatosOficiales', {
      nombre: form.nombre.trim(),
      categoria: form.categoria,
      roles: [rol, 'Dueño'],
    });

    setForm({ nombre: '', categoria: 'Contratos' });
    setShowForm(false);
    setReloadKey(k => k + 1);
  };

  return (
    <div key={reloadKey}>
      <div className="page-header page-header-flex">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-tag-mint">GOBIERNO &bull; DOCUMENTACIÓN</span>
            <span className="header-meta-pill">BASE NORMATIVA INSTITUCIONAL</span>
          </div>
          <h2 className="page-title">GESTIÓN DOCUMENTAL</h2>
          <p className="page-subtitle">
            Lineamientos operativos, acuerdos de confidencialidad y guías de procedimiento para Crono.
          </p>
        </div>

        {canCreate && (
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cerrar' : '+ Cargar Nuevo Documento'}
          </Button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '24px', backgroundColor: 'var(--color-mist-gray)' }}>
          <div className="card-header">
            <h3 className="card-title">REGISTRAR NUEVO DOCUMENTO OFICIAL</h3>
            <span className="badge badge-black">NORMATIVA</span>
          </div>
          <form onSubmit={handleAdd}>
            <div className="form-grid-2">
              <Input
                label="Nombre del Documento o Lineamiento"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej. Protocolo de Vestuario y Maquillaje en Set"
                required
              />
              <Select
                label="Categoría"
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                options={['Contratos', 'Booking', 'Reclutamiento', 'Producción', 'Administrativo', 'Vinculación']}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" variant="primary">Asentar Documento</Button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {misFormatos.map((doc, idx) => (
          <div key={doc.id || idx} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="badge badge-neutral">{doc.categoria}</span>
                <span className="badge badge-mint">VIGENTE</span>
              </div>
              <h3 style={{ fontSize: '20px', lineHeight: 1.15, marginBottom: '8px' }}>{doc.nombre}</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-slate)', lineHeight: 1.5 }}>
                Documento de procedimiento oficial regulado por la dirección ejecutiva de Crono.
              </p>
            </div>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-mist-gray)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-smoke)' }}>
                REF #DOC-{doc.id || idx + 1}
              </span>
              <Button variant="outline" size="sm" style={{ fontSize: '11px' }}>
                Consultar &rarr;
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { getDB, getPersonaNombre, addRegistro, STAFF, saveDB } from '../db';
import { today } from '../helpers';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Table } from '../components/ui/Table';

const ROLES_STAFF = [
  'Dueño', 'Head Booker', 'Booker', 'Entrevistador', 'Scouter', 'Scouter de Aliados',
  'Producción', 'Creativo', 'Tesorería Agencia', 'Tesorería Academia', 'Administrativo'
];

export default function RRHH({ rol }) {
  const [activeTab, setActiveTab] = useState('staff'); // 'staff' | 'actas'
  const [showFormActa, setShowFormActa] = useState(false);
  const [showFormStaff, setShowFormStaff] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [formActa, setFormActa] = useState({ tema: '', contenido: '' });
  const [formStaff, setFormStaff] = useState({
    nombre_completo: '',
    rol: 'Booker',
    fecha_contratacion: today(),
  });

  const canCreate = rol === 'Administrativo' || rol === 'Dueño';

  const db = getDB();
  const dynamicStaff = db.staff || [];
  const allStaff = [...STAFF, ...dynamicStaff];
  const actas = (db.actasReunion || []).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const handleAddActa = (e) => {
    e.preventDefault();
    if (!formActa.tema.trim() || !formActa.contenido.trim()) return;

    addRegistro('actasReunion', {
      fecha: today(),
      tema: formActa.tema.trim(),
      contenido: formActa.contenido.trim(),
      autor_persona_id: 14,
    });

    setFormActa({ tema: '', contenido: '' });
    setShowFormActa(false);
    setReloadKey(k => k + 1);
  };

  const handleAddStaff = (e) => {
    e.preventDefault();
    if (!formStaff.nombre_completo.trim()) return;

    const persona = addRegistro('personas', {
      nombre_completo: formStaff.nombre_completo.trim(),
      fecha_creacion: today(),
    });

    const newStaffMember = {
      persona_id: persona.id,
      nombre: formStaff.nombre_completo.trim(),
      rol: formStaff.rol,
      fecha_contratacion: formStaff.fecha_contratacion || today(),
    };

    if (!db.staff) db.staff = [];
    db.staff.push(newStaffMember);
    saveDB(db);

    setFormStaff({ nombre_completo: '', rol: 'Booker', fecha_contratacion: today() });
    setShowFormStaff(false);
    setReloadKey(k => k + 1);
  };

  const staffColumns = [
    { key: 'persona_id', header: 'ID', size: '70px', mono: true, render: (val) => `#${val}` },
    { key: 'nombre', header: 'Colaborador Staff', render: (val) => (
      <div style={{ fontWeight: 600 }}>{val}</div>
    )},
    { key: 'rol', header: 'Rol del Sistema', size: '180px', render: (val) => (
      <span className={val === 'Dueño' ? 'role-tag-yellow' : 'role-tag-mint'}>
        {val}
      </span>
    )},
    { key: 'fecha_contratacion', header: 'Ingreso al Equipo', size: '150px', mono: true },
  ];

  const actasColumns = [
    { key: 'id', header: 'Acta #', size: '80px', mono: true, render: (val) => `ACT-${val}` },
    { key: 'tema', header: 'Tema de Junta del Oráculo', render: (val, row) => (
      <div>
        <div style={{ fontWeight: 600 }}>{val}</div>
        <div style={{ color: 'var(--color-slate)', fontSize: '13px', marginTop: '4px' }}>
          {row.contenido}
        </div>
      </div>
    )},
    { key: 'fecha', header: 'Fecha', size: '120px', mono: true },
  ];

  return (
    <div key={reloadKey}>
      <div className="page-header page-header-flex">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-tag-mint">GOBIERNO &bull; RRHH</span>
            <span className="header-meta-pill">STAFF INSTITUCIONAL</span>
          </div>
          <h2 className="page-title">TALENTO INTERNO &amp; ACTAS</h2>
          <p className="page-subtitle">
            Directorio del equipo administrativo y archivo histórico de la Junta del Oráculo de Crono.
          </p>
        </div>

        {canCreate && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {activeTab === 'staff' && (
              <Button variant="primary" onClick={() => setShowFormStaff(!showFormStaff)}>
                {showFormStaff ? 'Cerrar' : '+ Nuevo Miembro Staff'}
              </Button>
            )}
            {activeTab === 'actas' && (
              <Button variant="primary" onClick={() => setShowFormActa(!showFormActa)}>
                {showFormActa ? 'Cerrar' : '+ Levantar Acta de Junta'}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="login-tabs-pill" style={{ maxWidth: '400px', marginBottom: '20px' }}>
        <button
          type="button"
          className={`login-tab-btn ${activeTab === 'staff' ? 'active' : ''}`}
          onClick={() => setActiveTab('staff')}
        >
          Equipo Staff ({allStaff.length})
        </button>
        <button
          type="button"
          className={`login-tab-btn ${activeTab === 'actas' ? 'active' : ''}`}
          onClick={() => setActiveTab('actas')}
        >
          Actas del Oráculo ({actas.length})
        </button>
      </div>

      {showFormStaff && activeTab === 'staff' && (
        <div className="card" style={{ marginBottom: '24px', backgroundColor: 'var(--color-mist-gray)' }}>
          <div className="card-header">
            <h3 className="card-title">INCORPORACIÓN AL STAFF</h3>
            <span className="badge badge-black">RRHH</span>
          </div>
          <form onSubmit={handleAddStaff}>
            <div className="form-grid-3">
              <Input
                label="Nombre Completo"
                value={formStaff.nombre_completo}
                onChange={(e) => setFormStaff({ ...formStaff, nombre_completo: e.target.value })}
                placeholder="Ej. Mateo Gómez"
                required
              />
              <Select
                label="Rol de Sistema"
                value={formStaff.rol}
                onChange={(e) => setFormStaff({ ...formStaff, rol: e.target.value })}
                options={ROLES_STAFF}
              />
              <Input
                label="Fecha de Contratación"
                type="date"
                value={formStaff.fecha_contratacion}
                onChange={(e) => setFormStaff({ ...formStaff, fecha_contratacion: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button type="button" variant="ghost" onClick={() => setShowFormStaff(false)}>Cancelar</Button>
              <Button type="submit" variant="primary">Guardar en Staff</Button>
            </div>
          </form>
        </div>
      )}

      {showFormActa && activeTab === 'actas' && (
        <div className="card" style={{ marginBottom: '24px', backgroundColor: 'var(--color-mist-gray)' }}>
          <div className="card-header">
            <h3 className="card-title">NUEVA ACTA DE JUNTA DEL ORÁCULO</h3>
            <span className="badge badge-black">ACTA OFICIAL</span>
          </div>
          <form onSubmit={handleAddActa}>
            <div style={{ marginBottom: '12px' }}>
              <Input
                label="Tema o Agenda Central"
                value={formActa.tema}
                onChange={(e) => setFormActa({ ...formActa, tema: e.target.value })}
                placeholder="Ej. Revisión Trimestral de Escalares y Expansión"
                required
              />
            </div>
            <div>
              <label className="form-label">Minuta / Acuerdos de la Sesión</label>
              <textarea
                className="form-textarea"
                rows={5}
                value={formActa.contenido}
                onChange={(e) => setFormActa({ ...formActa, contenido: e.target.value })}
                placeholder="Puntos tratados, votos y compromisos adquiridos..."
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button type="button" variant="ghost" onClick={() => setShowFormActa(false)}>Cancelar</Button>
              <Button type="submit" variant="primary">Firmar y Asentar Acta</Button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'staff' && (
        <Table columns={staffColumns} data={allStaff} emptyMessage="No hay miembros de staff registrados." />
      )}

      {activeTab === 'actas' && (
        <Table columns={actasColumns} data={actas} emptyMessage="No hay actas registradas." />
      )}
    </div>
  );
}

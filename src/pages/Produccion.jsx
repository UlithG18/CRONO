import React, { useState } from 'react';
import { getDB, getPersonaNombre, addRegistro, updateRegistro } from '../db';
import { cop, today } from '../helpers';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Table } from '../components/ui/Table';

const TIPO_PRODUCCION = ['Book', 'Sesión de fotos', 'Video', 'Evento', 'Editorial', 'Campaña'];
const CATEGORIAS_CREATIVO = ['Fotografía', 'Estilismo', 'Dirección creativa', 'Maquillaje', 'Peluquería', 'Apoyo'];
const ESTADOS_PRODUCCION = ['Pendiente', 'En curso', 'Completado', 'Cancelado'];

export default function Produccion({ rol }) {
  const [activeSection, setActiveSection] = useState('producciones'); // 'producciones' | 'locaciones' | 'colaboradores'
  const [reloadKey, setReloadKey] = useState(0);

  // Formularios
  const [showFormLocacion, setShowFormLocacion] = useState(false);
  const [formLocacion, setFormLocacion] = useState({ nombre: '', direccion: '', costo: '' });

  const [showFormProduccion, setShowFormProduccion] = useState(false);
  const [formProduccion, setFormProduccion] = useState({
    fecha: today(),
    tipo: 'Book',
    cliente_id: '',
    locacion_id: '',
    estado: 'Pendiente',
    nombre: '',
  });

  const [showFormCreativo, setShowFormCreativo] = useState(false);
  const [formCreativo, setFormCreativo] = useState({
    nombre_completo: '',
    categoria: 'Fotografía',
    es_recluta: true,
    es_aliado: true,
  });

  const db = getDB();
  const locaciones = db.locaciones || [];
  const producciones = db.producciones || [];
  const creativos = db.creativos || [];
  const clientes = db.cliente || [];

  const esCreativo = rol === 'Creativo';
  const esDueñoOProduccion = rol === 'Dueño' || rol === 'Producción' || rol === 'Administrativo';

  const handleAddLocacion = (e) => {
    e.preventDefault();
    if (!formLocacion.nombre.trim()) return;

    addRegistro('locaciones', {
      nombre: formLocacion.nombre.trim(),
      direccion: formLocacion.direccion.trim() || undefined,
      costo: formLocacion.costo ? Number(formLocacion.costo) : 0,
    });

    setFormLocacion({ nombre: '', direccion: '', costo: '' });
    setShowFormLocacion(false);
    setReloadKey(k => k + 1);
  };

  const handleAddProduccion = (e) => {
    e.preventDefault();
    if (!formProduccion.nombre.trim()) return;

    addRegistro('producciones', {
      nombre: formProduccion.nombre.trim(),
      fecha: formProduccion.fecha || today(),
      tipo: formProduccion.tipo,
      cliente_id: formProduccion.cliente_id ? Number(formProduccion.cliente_id) : null,
      locacion_id: formProduccion.locacion_id ? Number(formProduccion.locacion_id) : null,
      estado: formProduccion.estado,
    });

    setFormProduccion({ fecha: today(), tipo: 'Book', cliente_id: '', locacion_id: '', estado: 'Pendiente', nombre: '' });
    setShowFormProduccion(false);
    setReloadKey(k => k + 1);
  };

  const handleAddCreativo = (e) => {
    e.preventDefault();
    if (!formCreativo.nombre_completo.trim()) return;

    const hoy = today();
    const persona = addRegistro('personas', {
      nombre_completo: formCreativo.nombre_completo.trim(),
      fecha_creacion: hoy,
    });

    addRegistro('rolPersonas', {
      persona_id: persona.id,
      tipo_rol_id: 3, // Colaborador
      fecha_inicio: hoy,
      fecha_fin: null,
    });

    addRegistro('creativos', {
      persona_id: persona.id,
      categoria: formCreativo.categoria,
      es_recluta: Boolean(formCreativo.es_recluta),
      es_aliado: Boolean(formCreativo.es_aliado),
      estado_contrato: 'Activo',
    });

    setFormCreativo({ nombre_completo: '', categoria: 'Fotografía', es_recluta: true, es_aliado: true });
    setShowFormCreativo(false);
    setReloadKey(k => k + 1);
  };

  const produccionesColumns = [
    { key: 'id', header: 'ID', size: '70px', mono: true, render: (val) => `#${val}` },
    { key: 'nombre', header: 'Producción / Proyecto', render: (val, row) => (
      <div>
        <div style={{ fontWeight: 600 }}>{val || `Producción #${row.id}`}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-smoke)' }}>
          {row.fecha} &bull; {row.tipo}
        </div>
      </div>
    )},
    { key: 'cliente_id', header: 'Marca / Cliente', render: (val) => {
      if (esCreativo) return <span style={{ color: 'var(--color-smoke)', fontSize: '12px' }}>[Confidencial]</span>;
      const c = clientes.find(x => x.id === val || x.persona_id === val);
      return <span style={{ fontSize: '13px' }}>{c ? c.razon_social : 'Proyecto Interno'}</span>;
    }},
    { key: 'locacion_id', header: 'Locación', render: (val) => {
      const loc = locaciones.find(x => x.id === val);
      return <span className="badge badge-neutral">{loc ? loc.nombre : 'Estudio Central'}</span>;
    }},
    { key: 'estado', header: 'Estado', size: '130px', render: (val) => (
      <span className={val === 'Completado' ? 'badge badge-mint' : val === 'En curso' ? 'badge badge-blue' : 'badge badge-yellow'}>
        {val}
      </span>
    )},
  ];

  const locacionesColumns = [
    { key: 'id', header: 'ID', size: '70px', mono: true, render: (val) => `#${val}` },
    { key: 'nombre', header: 'Nombre del Espacio', render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
    { key: 'direccion', header: 'Dirección / Zona', render: (val) => <span style={{ color: 'var(--color-slate)' }}>{val || '—'}</span> },
    { key: 'costo', header: 'Tarifa COP', size: '150px', align: 'right', mono: true, render: (val) => (
      esCreativo ? '—' : (val ? cop(val) : 'Propia / Sin costo')
    )},
  ];

  const colaboradoresColumns = [
    { key: 'persona_id', header: 'ID', size: '70px', mono: true, render: (val) => `#${val}` },
    { key: 'nombre', header: 'Colaborador', render: (_, row) => (
      <div style={{ fontWeight: 600 }}>{getPersonaNombre(row.persona_id)}</div>
    )},
    { key: 'categoria', header: 'Especialidad', size: '160px', render: (val) => (
      <span className="badge badge-neutral">{val}</span>
    )},
    { key: 'es_recluta', header: 'Recluta', size: '100px', render: (val) => (
      val ? <span className="badge badge-mint">Sí</span> : <span style={{ color: 'var(--color-smoke)' }}>No</span>
    )},
    { key: 'es_aliado', header: 'Aliado', size: '100px', render: (val) => (
      val ? <span className="badge badge-violet">Sí</span> : <span style={{ color: 'var(--color-smoke)' }}>No</span>
    )},
    { key: 'estado_contrato', header: 'Estado', size: '110px', render: (val) => (
      <span className="badge badge-neutral">{val || 'Activo'}</span>
    )},
  ];

  return (
    <div key={reloadKey}>
      <div className="page-header page-header-flex">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-tag-mint">PRODUCCIÓN OPERATIVA</span>
            <span className="header-meta-pill">RODAJES &bull; LOCACIONES &bull; CREATIVOS</span>
          </div>
          <h2 className="page-title">CENTRO DE PRODUCCIÓN</h2>
          <p className="page-subtitle">
            Coordinación logística de rodajes, red colaborativa de fotógrafos y espacios de estudio.
          </p>
        </div>

        {esDueñoOProduccion && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {activeSection === 'producciones' && (
              <Button variant="primary" onClick={() => setShowFormProduccion(!showFormProduccion)}>
                {showFormProduccion ? 'Cerrar' : '+ Nueva Producción'}
              </Button>
            )}
            {activeSection === 'locaciones' && (
              <Button variant="primary" onClick={() => setShowFormLocacion(!showFormLocacion)}>
                {showFormLocacion ? 'Cerrar' : '+ Nueva Locación'}
              </Button>
            )}
            {activeSection === 'colaboradores' && (
              <Button variant="primary" onClick={() => setShowFormCreativo(!showFormCreativo)}>
                {showFormCreativo ? 'Cerrar' : '+ Nuevo Colaborador'}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tabs Píldora Brutalistas */}
      <div className="login-tabs-pill" style={{ maxWidth: '500px', marginBottom: '20px' }}>
        <button
          type="button"
          className={`login-tab-btn ${activeSection === 'producciones' ? 'active' : ''}`}
          onClick={() => setActiveSection('producciones')}
        >
          Producciones ({producciones.length})
        </button>
        <button
          type="button"
          className={`login-tab-btn ${activeSection === 'locaciones' ? 'active' : ''}`}
          onClick={() => setActiveSection('locaciones')}
        >
          Locaciones ({locaciones.length})
        </button>
        <button
          type="button"
          className={`login-tab-btn ${activeSection === 'colaboradores' ? 'active' : ''}`}
          onClick={() => setActiveSection('colaboradores')}
        >
          Red Creativa ({creativos.length})
        </button>
      </div>

      {/* Formularios Condicionales */}
      {showFormProduccion && activeSection === 'producciones' && (
        <div className="card" style={{ marginBottom: '24px', backgroundColor: 'var(--color-mist-gray)' }}>
          <div className="card-header">
            <h3 className="card-title">REGISTRAR RODAJE / PRODUCCIÓN</h3>
            <span className="badge badge-black">PRODUCCIÓN</span>
          </div>
          <form onSubmit={handleAddProduccion}>
            <div className="form-grid-3">
              <Input
                label="Título del Proyecto"
                value={formProduccion.nombre}
                onChange={(e) => setFormProduccion({ ...formProduccion, nombre: e.target.value })}
                placeholder="Ej. Campaña Invierno Aura Cosmetics"
                required
              />
              <Select
                label="Tipo de Producción"
                value={formProduccion.tipo}
                onChange={(e) => setFormProduccion({ ...formProduccion, tipo: e.target.value })}
                options={TIPO_PRODUCCION}
              />
              <Input
                label="Fecha Programada"
                type="date"
                value={formProduccion.fecha}
                onChange={(e) => setFormProduccion({ ...formProduccion, fecha: e.target.value })}
                required
              />
            </div>
            <div className="form-grid-3" style={{ marginTop: '12px' }}>
              <Select
                label="Marca o Cliente"
                value={formProduccion.cliente_id}
                onChange={(e) => setFormProduccion({ ...formProduccion, cliente_id: e.target.value })}
                options={[
                  { value: '', label: 'Proyecto Propio / Interno' },
                  ...clientes.map(c => ({ value: String(c.id || c.persona_id), label: c.razon_social })),
                ]}
              />
              <Select
                label="Locación"
                value={formProduccion.locacion_id}
                onChange={(e) => setFormProduccion({ ...formProduccion, locacion_id: e.target.value })}
                options={[
                  { value: '', label: 'Estudio Central' },
                  ...locaciones.map(l => ({ value: String(l.id), label: l.nombre })),
                ]}
              />
              <Select
                label="Estado Inicial"
                value={formProduccion.estado}
                onChange={(e) => setFormProduccion({ ...formProduccion, estado: e.target.value })}
                options={ESTADOS_PRODUCCION}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button type="button" variant="ghost" onClick={() => setShowFormProduccion(false)}>Cancelar</Button>
              <Button type="submit" variant="primary">Guardar Producción</Button>
            </div>
          </form>
        </div>
      )}

      {showFormLocacion && activeSection === 'locaciones' && (
        <div className="card" style={{ marginBottom: '24px', backgroundColor: 'var(--color-mist-gray)' }}>
          <div className="card-header">
            <h3 className="card-title">REGISTRAR NUEVA LOCACIÓN</h3>
            <span className="badge badge-black">LOCACIÓN</span>
          </div>
          <form onSubmit={handleAddLocacion}>
            <div className="form-grid-3">
              <Input
                label="Nombre del Espacio"
                value={formLocacion.nombre}
                onChange={(e) => setFormLocacion({ ...formLocacion, nombre: e.target.value })}
                placeholder="Ej. Terraza Creativa Zona Norte"
                required
              />
              <Input
                label="Dirección o Ubicación"
                value={formLocacion.direccion}
                onChange={(e) => setFormLocacion({ ...formLocacion, direccion: e.target.value })}
                placeholder="Cra 15 # 85-30"
              />
              <Input
                label="Costo Estimado COP"
                type="number"
                value={formLocacion.costo}
                onChange={(e) => setFormLocacion({ ...formLocacion, costo: e.target.value })}
                placeholder="500000"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button type="button" variant="ghost" onClick={() => setShowFormLocacion(false)}>Cancelar</Button>
              <Button type="submit" variant="primary">Guardar Locación</Button>
            </div>
          </form>
        </div>
      )}

      {showFormCreativo && activeSection === 'colaboradores' && (
        <div className="card" style={{ marginBottom: '24px', backgroundColor: 'var(--color-mist-gray)' }}>
          <div className="card-header">
            <h3 className="card-title">VINCULAR COLABORADOR EXTERNO</h3>
            <span className="badge badge-black">RED CREATIVA</span>
          </div>
          <form onSubmit={handleAddCreativo}>
            <div className="form-grid-2">
              <Input
                label="Nombre del Profesional"
                value={formCreativo.nombre_completo}
                onChange={(e) => setFormCreativo({ ...formCreativo, nombre_completo: e.target.value })}
                placeholder="Ej. Andrés Muñoz"
                required
              />
              <Select
                label="Especialidad Creativa"
                value={formCreativo.categoria}
                onChange={(e) => setFormCreativo({ ...formCreativo, categoria: e.target.value })}
                options={CATEGORIAS_CREATIVO}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button type="button" variant="ghost" onClick={() => setShowFormCreativo(false)}>Cancelar</Button>
              <Button type="submit" variant="primary">Vincular a Red</Button>
            </div>
          </form>
        </div>
      )}

      {/* Tablas según la sección activa */}
      {activeSection === 'producciones' && (
        <Table columns={produccionesColumns} data={producciones} emptyMessage="No hay producciones registradas." />
      )}
      {activeSection === 'locaciones' && (
        <Table columns={locacionesColumns} data={locaciones} emptyMessage="No hay locaciones registradas." />
      )}
      {activeSection === 'colaboradores' && (
        <Table columns={colaboradoresColumns} data={creativos} emptyMessage="No hay colaboradores en la red creativa." />
      )}
    </div>
  );
}

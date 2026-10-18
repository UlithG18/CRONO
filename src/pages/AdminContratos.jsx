import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getDB, getPersonaNombre, refreshData } from '../db';
import { api } from '../api';
import { canAccess, userRoles } from '../permissions';
import { useAuth } from '../auth';
import { Table } from '../components/ui/Table';
import { Input, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/Modal';
import { IconDocument, IconScale } from '../components/Icons';

const TIPOS_CONTRATO = [
  { key: 'todos', label: 'Todos' },
  { key: 'colaboracion', label: 'Colaboración' },
  { key: 'exclusividad', label: 'Exclusividad' },
  { key: 'representacion', label: 'Representación' },
  { key: 'vinculacion', label: 'Vinculación' },
];

// Mapea la sub-ruta al tipo exacto guardado en backend
const SUBPATH_TO_TIPO = {
  colaboracion: 'Colaboración',
  exclusividad: 'Exclusividad',
  representacion: 'Representación',
  vinculacion: 'Vinculación',
};

function EstadoBadge({ estado }) {
  const cls = estado === 'Vigente' ? 'badge badge-mint'
    : estado === 'Vencido' ? 'badge badge-yellow'
    : 'badge badge-neutral';
  return <span className={cls}>{estado}</span>;
}

// Tipos y estados admitidos en el modelo de datos
const TIPOS_LISTA = ['Colaboración', 'Exclusividad', 'Representación', 'Vinculación'];
const ESTADOS_LISTA = ['Vigente', 'Vencido'];

function emptyFormContrato() {
  return {
    modeloPersonaId: '',
    tipo: 'Colaboración',
    fechaFirma: new Date().toISOString().split('T')[0],
    estado: 'Vigente',
    enlaceDocumento: '',
    observaciones: '',
  };
}

export default function AdminContratos() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [busqueda, setBusqueda] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [form, setForm] = useState(emptyFormContrato());
  const [contratoAEliminar, setContratoAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');

  const parts = location.pathname.split('/').filter(Boolean);
  const sub = parts[3] || 'todos'; // /d/admin/contratos/<tipo>

  const rol = currentUser?.rol;
  const roles = userRoles(currentUser);
  const puedeVer = canAccess(roles, 'contratos');
  const puedeEscribir = canAccess(roles, 'contratos', 'write');

  const db = getDB();
  const contratos = db.contratos || [];
  const modelos = db.modelo || [];

  // Opciones para el selector de modelo: solo las personas con ficha de modelo
  // pueden ser parte de un contrato.
  const opcionesModelo = useMemo(() => modelos
    .map(m => ({
      value: String(m.persona_id),
      label: getPersonaNombre(m.persona_id) + (m.nombre_artistico ? ` (${m.nombre_artistico})` : ''),
    }))
    .sort((a, b) => a.label.localeCompare(b.label)), [modelos]);

  const data = useMemo(() => {
    let list = contratos;

    const tipoFiltro = SUBPATH_TO_TIPO[sub];
    if (tipoFiltro) list = list.filter(c => c.tipo === tipoFiltro);

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      list = list.filter(c => {
        const nombre = getPersonaNombre(c.modelo_persona_id).toLowerCase();
        return nombre.includes(q) ||
          (c.tipo || '').toLowerCase().includes(q) ||
          (c.estado || '').toLowerCase().includes(q);
      });
    }

    return list.map(c => ({
      ...c,
      modelo_nombre: getPersonaNombre(c.modelo_persona_id),
      modelo_artistico: (modelos.find(m => m.persona_id === c.modelo_persona_id) || {}).nombre_artistico || '',
    }));
  }, [contratos, modelos, sub, busqueda]);

  const titulo = TIPOS_CONTRATO.find(t => t.key === sub)?.label || 'Contratos';

  function abrirNuevo() {
    const porTipo = SUBPATH_TO_TIPO[sub];
    const inicial = emptyFormContrato();
    if (porTipo) inicial.tipo = porTipo;
    setForm(inicial);
    setEditandoId(null);
    setErrorForm('');
    setShowForm(true);
  }

  function abrirEditar(contrato) {
    setForm({
      modeloPersonaId: String(contrato.modelo_persona_id),
      tipo: contrato.tipo,
      fechaFirma: contrato.fecha_firma,
      estado: contrato.estado,
      enlaceDocumento: contrato.enlace_documento || '',
      observaciones: contrato.observaciones || '',
    });
    setEditandoId(contrato.id);
    setErrorForm('');
    setShowForm(true);
  }

  function cerrarForm() {
    setShowForm(false);
    setEditandoId(null);
    setErrorForm('');
    setForm(emptyFormContrato());
  }

  async function guardar(e) {
    e.preventDefault();

    if (!form.modeloPersonaId) return setErrorForm('Debe seleccionarse un modelo.');
    if (!form.fechaFirma) return setErrorForm('La fecha de firma es obligatoria.');

    const payload = {
      modeloPersonaId: Number(form.modeloPersonaId),
      tipo: form.tipo,
      fechaFirma: form.fechaFirma,
      estado: form.estado,
      enlaceDocumento: form.enlaceDocumento.trim(),
      observaciones: form.observaciones.trim(),
    };

    setGuardando(true);
    setErrorForm('');

    try {
      if (editandoId) await api.updateContrato(editandoId, payload);
      else await api.createContrato(payload);

      await refreshData();
      cerrarForm();
    } catch (err) {
      setErrorForm(err.message || 'No se pudo guardar el contrato.');
    } finally {
      setGuardando(false);
    }
  }

  function pedirBorrado(contrato) {
    setErrorEliminar('');
    setContratoAEliminar(contrato);
  }

  async function eliminar() {
    if (!contratoAEliminar) return;

    setEliminando(true);
    setErrorEliminar('');

    try {
      await api.deleteContrato(contratoAEliminar.id);
      await refreshData();
      setContratoAEliminar(null);
    } catch (err) {
      setErrorEliminar(err.message || 'No se pudo eliminar el contrato.');
    } finally {
      setEliminando(false);
    }
  }

  const columnas = [
    {
      key: 'modelo_nombre',
      header: 'Modelo',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{val}</div>
          {row.modelo_artistico && (
            <div style={{ fontSize: '11px', color: 'var(--color-smoke)', marginTop: '2px' }}>
              {row.modelo_artistico}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      size: '150px',
      render: (val) => <span className="badge badge-neutral">{val}</span>,
    },
    {
      key: 'fecha_firma',
      header: 'Fecha de firma',
      size: '130px',
      mono: true,
    },
    {
      key: 'estado',
      header: 'Estado',
      size: '110px',
      render: (val) => <EstadoBadge estado={val} />,
    },
    {
      key: 'observaciones',
      header: 'Observaciones',
      render: (val) => val
        ? <span style={{ fontSize: '12px', color: 'var(--color-smoke)' }}>{val}</span>
        : <span style={{ color: 'var(--color-smoke)' }}>—</span>,
    },
    {
      key: 'enlace_documento',
      header: '',
      size: '110px',
      align: 'right',
      sortable: false,
      render: (val) => val ? (
        <a
          href={val}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline btn-sm"
          style={{ fontSize: '11px' }}
          onClick={(e) => e.stopPropagation()}
        >
          Ver contrato
        </a>
      ) : <span style={{ color: 'var(--color-smoke)', fontSize: '11px' }}>Pendiente</span>,
    },
    ...(puedeEscribir ? [{
      key: 'acciones',
      header: '',
      size: '180px',
      align: 'right',
      sortable: false,
      render: (val, row) => (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); abrirEditar(row); }}>
            Editar
          </Button>
          <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); pedirBorrado(row); }}>
            Eliminar
          </Button>
        </div>
      ),
    }] : []),
  ];

  if (!puedeVer) {
    return (
      <div className="card">
        <div className="card-content" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <IconScale size={32} />
          <h3 style={{ margin: '12px 0 6px' }}>Sin acceso a contratos</h3>
          <p style={{ color: 'var(--color-smoke)', fontSize: '13px' }}>
            Tu rol ({rol}) no tiene permisos para consultar contratos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header page-header-flex">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-tag-mint">ADMINISTRACIÓN</span>
            <span className="header-meta-pill">CONTRATOS FIRMADOS</span>
          </div>
          <h2 className="page-title">{titulo.toUpperCase()}</h2>
          <p className="page-subtitle">
            {contratos.length} contratos registrados · Filtra por modelo, tipo y fecha de firma.
            Un contrato siempre queda asociado a una persona con ficha de modelo.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <div style={{ minWidth: '240px' }}>
            <Input
              placeholder="Buscar por modelo o tipo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          {puedeEscribir && (
            <Button variant="primary" onClick={() => (showForm ? cerrarForm() : abrirNuevo())}>
              {showForm ? 'Cerrar' : 'Nuevo contrato'}
            </Button>
          )}
        </div>
      </div>

      {/* Filtros por tipo */}
      <div className="login-tabs-pill" style={{ marginBottom: '20px', maxWidth: '640px' }}>
        {TIPOS_CONTRATO.map(t => (
          <button
            key={t.key}
            type="button"
            className={`login-tab-btn ${sub === t.key ? 'active' : ''}`}
            onClick={() => navigate(`/d/admin/contratos/${t.key}`)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h3 className="card-title">{editandoId ? 'EDITAR CONTRATO' : 'NUEVO CONTRATO'}</h3>
            <span className="badge badge-black">CONTRATOS FIRMADOS</span>
          </div>
          <form onSubmit={guardar}>
            <div className="form-grid-3">
              <Select
                label="Modelo"
                value={form.modeloPersonaId}
                onChange={(e) => setForm({ ...form, modeloPersonaId: e.target.value })}
                options={[{ value: '', label: 'Selecciona un modelo…' }, ...opcionesModelo]}
                required
              />
              <Select
                label="Tipo de contrato"
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                options={TIPOS_LISTA.map(t => ({ value: t, label: t }))}
                required
              />
              <Select
                label="Estado"
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                options={ESTADOS_LISTA.map(t => ({ value: t, label: t }))}
                required
              />
            </div>

            <div className="form-grid-3" style={{ marginTop: '14px' }}>
              <Input
                label="Fecha de firma"
                type="date"
                value={form.fechaFirma}
                onChange={(e) => setForm({ ...form, fechaFirma: e.target.value })}
                required
              />
              <Input
                label="Enlace al contrato firmado"
                type="url"
                value={form.enlaceDocumento}
                onChange={(e) => setForm({ ...form, enlaceDocumento: e.target.value })}
                placeholder="https://..."
                helperText="Opcional. Déjalo vacío si aún no está cargado."
              />
              <Input
                label="Observaciones"
                value={form.observaciones}
                onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                placeholder="Condiciones o notas del contrato"
              />
            </div>

            {errorForm && (
              <div
                role="alert"
                style={{
                  marginTop: '14px', padding: '10px 12px', fontSize: '12px',
                  border: '1px solid var(--color-ash)', borderRadius: '6px',
                  backgroundColor: 'var(--color-paper-white)', color: 'var(--color-carbon-black)',
                }}
              >
                {errorForm}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button type="button" variant="ghost" onClick={cerrarForm}>Cancelar</Button>
              <Button type="submit" variant="primary" disabled={guardando}>
                {guardando ? 'Guardando…' : (editandoId ? 'Guardar cambios' : 'Crear contrato')}
              </Button>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--color-smoke)', marginTop: '10px' }}>
              El backend valida que el modelo exista, que el tipo esté en el catálogo y que la fecha
              tenga el formato correcto.
            </p>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <IconDocument size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            {titulo.toUpperCase()}
          </h3>
          <span className="badge badge-black">{data.length} REGISTROS</span>
        </div>
        <Table
          columns={columnas}
          data={data}
          pageSize={10}
          emptyMessage={busqueda ? 'Ningún contrato coincide con la búsqueda.' : 'No hay contratos en esta categoría.'}
        />
      </div>

      <ConfirmDialog
        open={!!contratoAEliminar}
        title="ELIMINAR CONTRATO"
        mensaje={contratoAEliminar
          ? `Se eliminará el contrato de ${contratoAEliminar.modelo_nombre} (${contratoAEliminar.tipo}, firmado el ${contratoAEliminar.fecha_firma}).`
          : ''}
        detalle={[
          'Solo se borra el registro del contrato: la ficha del modelo y sus demás contratos no se modifican.',
        ]}
        confirmLabel="Eliminar contrato"
        cargando={eliminando}
        error={errorEliminar}
        onConfirm={eliminar}
        onCancel={() => setContratoAEliminar(null)}
      />
    </div>
  );
}

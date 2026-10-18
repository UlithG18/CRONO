import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getDB, refreshData } from '../db';
import { api } from '../api';
import { canAccess, userRoles } from '../permissions';
import { useAuth } from '../auth';
import { Table } from '../components/ui/Table';
import { Input, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/Modal';
import { IconDocument, IconFolder, IconArrow, IconStamp, IconScale } from '../components/Icons';

// Etiquetas legibles para departamento y categoría
const DEPT_LABELS = {
  'ceo-direccion': 'CEO y Dirección',
  formatos: 'Formatos oficiales',
  'junta-oraculo': 'Junta del Oráculo',
};

// Departamentos que administra este módulo. /api/documentos solo acepta estos dos;
// la Junta del Oráculo se gestiona desde su propio módulo y allí se crean sus documentos.
const DEPT_MODULO = ['ceo-direccion', 'formatos'];

// Estructura documental vigente. Debe coincidir con la que valida el backend.
const DEPT_CATEGORIAS = {
  'ceo-direccion': ['legal', 'institucional'],
  formatos: ['logos', 'papeleria', 'plantillas'],
  'junta-oraculo': ['horizonte', 'minutas'],
};

const TIPOS_DOCUMENTO = ['Documento', 'Logo', 'Plantilla', 'Enlace'];

// Roles de trabajo del catálogo (misma fuente que el backend)
const ROLES_DOCUMENTO = [
  'Dueño', 'Head Booker', 'Booker', 'Entrevistador', 'Scouter', 'Scouter de Aliados',
  'Producción', 'Creativo', 'Tesorería Agencia', 'Tesorería Academia', 'Administrativo',
];

const CAT_LABELS = {
  legal: 'Legal',
  institucional: 'Documentación institucional',
  logos: 'Logotipos',
  papeleria: 'Papelería corporativa',
  plantillas: 'Plantillas',
  horizonte: 'Horizonte Crono',
  minutas: 'Minutas de reunión',
  'camara-comercio': 'Cámara de Comercio',
  'documentacion-legal': 'Documentación legal',
  'documentos-institucionales': 'Documentos institucionales',
  'nucleo-operativo': 'Núcleo operativo Crono',
  'libro-regente': 'Libro del regente',
  organizacion: 'Organización y funcionamiento',
  'planes-anuales': 'Planes anuales',
  objetivos: 'Objetivos',
  'tareas-pendientes': 'Tareas pendientes',
  acuerdos: 'Acuerdos',
  contratos: 'Contratos',
  'cuentas-cobro': 'Cuentas de cobro',
  facturas: 'Facturas',
  cotizaciones: 'Cotizaciones',
};

// Algunas sub-rutas agrupan varias categorías del backend
const SUBCATEGORY_ALIASES = {
  'camara-comercio': ['legal'],
  'documentacion-legal': ['legal'],
  'documentos-institucionales': ['legal'],
  'nucleo-operativo': ['institucional'],
  'libro-regente': ['institucional'],
  organizacion: ['institucional'],
  'planes-anuales': ['horizonte'],
  objetivos: ['horizonte'],
  'tareas-pendientes': ['horizonte'],
  acuerdos: ['plantillas'],
  contratos: ['plantillas'],
  'cuentas-cobro': ['plantillas'],
  facturas: ['plantillas'],
  cotizaciones: ['plantillas'],
};

// Documentos semilla de ejemplo para categorías sin archivos reales cargados
const PLACEHOLDER_HINT = 'No hay archivos registrados en esta categoría.';

function IconByType({ tipo }) {
  if (tipo === 'Logo') return <IconStamp size={16} />;
  if (tipo === 'Plantilla') return <IconFolder size={16} />;
  if (tipo === 'Enlace') return <IconArrow size={16} />;
  return <IconDocument size={16} />;
}

function emptyForm(dept, seccion) {
  const departamento = DEPT_CATEGORIAS[dept] ? dept : 'ceo-direccion';
  const categorias = DEPT_CATEGORIAS[departamento];
  const categoria = categorias.includes(seccion) ? seccion : categorias[0];
  return {
    departamento,
    categoria,
    nombre: '',
    tipo: 'Documento',
    fecha: new Date().toISOString().split('T')[0],
    enlace: '',
    descripcion: '',
    roles: [],
  };
}

export default function AdminDocumentos() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [busqueda, setBusqueda] = useState('');

  const parts = location.pathname.split('/').filter(Boolean);
  // /d/admin/<dept>/<seccion>[/<sub>]
  const dept = parts[2] || '';
  const seccion = parts[3] || '';
  const sub = parts[4] || '';

  const rol = currentUser?.rol;
  const roles = userRoles(currentUser);
  const puedeVer = canAccess(roles, 'documentos');
  // Escritura: la matriz de permisos habilita la gestión solo a quien la tiene.
  const puedeEscribir = canAccess(roles, 'documentos', 'write');

  const [showForm, setShowForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [form, setForm] = useState(emptyForm(dept, seccion));
  const [docAEliminar, setDocAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');

  const db = getDB();
  const todos = db.documentos || [];

  const docs = useMemo(() => {
    let list = todos.filter(d => d.departamento === dept);

    // Sección (legal / institucional / logos / plantillas / horizonte / minutas)
    if (seccion) list = list.filter(d => d.categoria === seccion);

    // Sub-categoría
    if (sub) {
      const aliases = SUBCATEGORY_ALIASES[sub];
      if (aliases) {
        // La sub-ruta es una vista más específica de la misma categoría
        list = todos.filter(d => d.departamento === dept && aliases.includes(d.categoria));
      } else {
        list = list.filter(d => d.categoria === sub);
      }
    }

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      list = list.filter(d =>
        (d.nombre || '').toLowerCase().includes(q) ||
        (d.descripcion || '').toLowerCase().includes(q) ||
        (d.tipo || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [todos, dept, seccion, sub, busqueda]);

  const tituloSeccion = CAT_LABELS[sub || seccion] || CAT_LABELS[seccion] || DEPT_LABELS[dept] || 'Documentos';
  const tituloDept = DEPT_LABELS[dept] || 'Documentación';

  function cambiarDepartamento(departamento) {
    const categorias = DEPT_CATEGORIAS[departamento] || [];
    setForm(prev => ({
      ...prev,
      departamento,
      categoria: categorias.includes(prev.categoria) ? prev.categoria : categorias[0],
    }));
    setErrorForm('');
  }

  function cambiarCategoria(categoria) {
    setForm(prev => ({ ...prev, categoria }));
    setErrorForm('');
  }

  function toggleRolDocumento(rolDocumento) {
    setForm(prev => ({
      ...prev,
      roles: prev.roles.includes(rolDocumento)
        ? prev.roles.filter(r => r !== rolDocumento)
        : [...prev.roles, rolDocumento],
    }));
    setErrorForm('');
  }

  function abrirNuevo() {
    setForm(emptyForm(dept, seccion));
    setEditandoId(null);
    setErrorForm('');
    setShowForm(true);
  }

  function abrirEditar(doc) {
    setForm({
      departamento: doc.departamento,
      categoria: doc.categoria,
      nombre: doc.nombre || '',
      tipo: TIPOS_DOCUMENTO.includes(doc.tipo) ? doc.tipo : 'Documento',
      fecha: doc.fecha || new Date().toISOString().split('T')[0],
      enlace: doc.enlace || '',
      descripcion: doc.descripcion || '',
      roles: Array.isArray(doc.roles) ? doc.roles : [],
    });
    setEditandoId(doc.id);
    setErrorForm('');
    setShowForm(true);
  }

  function cerrarForm() {
    setShowForm(false);
    setEditandoId(null);
    setErrorForm('');
    setForm(emptyForm(dept, seccion));
  }

  async function guardar(e) {
    e.preventDefault();

    if (!form.nombre.trim()) return setErrorForm('El nombre del documento es obligatorio.');

    const payload = {
      departamento: form.departamento,
      categoria: form.categoria,
      nombre: form.nombre.trim(),
      tipo: form.tipo,
      fecha: form.fecha,
      enlace: form.enlace.trim(),
      descripcion: form.descripcion.trim(),
      roles: form.roles,
    };

    setGuardando(true);
    setErrorForm('');

    try {
      if (editandoId) await api.updateDocumento(editandoId, payload);
      else await api.createDocumento(payload);

      await refreshData();
      cerrarForm();
    } catch (err) {
      setErrorForm(err.message || 'No se pudo guardar el documento.');
    } finally {
      setGuardando(false);
    }
  }

  function pedirBorrado(doc) {
    setErrorEliminar('');
    setDocAEliminar(doc);
  }

  async function eliminar() {
    if (!docAEliminar) return;

    setEliminando(true);
    setErrorEliminar('');

    try {
      await api.deleteDocumento(docAEliminar.id);
      await refreshData();
      setDocAEliminar(null);
    } catch (err) {
      setErrorEliminar(err.message || 'No se pudo eliminar el documento.');
    } finally {
      setEliminando(false);
    }
  }

  const columnas = [
    {
      key: 'nombre',
      header: 'Documento',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: 'var(--color-smoke)', display: 'inline-flex' }}>
            <IconByType tipo={row.tipo} />
          </span>
          <div>
            <div style={{ fontWeight: 600 }}>{val}</div>
            {row.descripcion && (
              <div style={{ fontSize: '11px', color: 'var(--color-smoke)', marginTop: '2px' }}>
                {row.descripcion}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      size: '120px',
      render: (val) => <span className="badge badge-neutral">{val}</span>,
    },
    {
      key: 'categoria',
      header: 'Categoría',
      size: '170px',
      render: (val) => CAT_LABELS[val] || val,
    },
    {
      key: 'fecha',
      header: 'Actualizado',
      size: '120px',
      mono: true,
    },
    {
      key: 'enlace',
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
          Abrir
        </a>
      ) : <span style={{ color: 'var(--color-smoke)', fontSize: '11px' }}>Sin archivo</span>,
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
          <h3 style={{ margin: '12px 0 6px' }}>Sin acceso a documentación</h3>
          <p style={{ color: 'var(--color-smoke)', fontSize: '13px' }}>
            Tu rol ({rol}) no tiene permisos para consultar los documentos de este departamento.
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
            <span className="header-meta-pill">{tituloDept.toUpperCase()}</span>
          </div>
          <h2 className="page-title">{tituloSeccion.toUpperCase()}</h2>
          <p className="page-subtitle">
            {todos.filter(d => d.departamento === dept).length} documentos registrados en este
            departamento. El registro guarda la referencia del archivo; el enlace se completa cuando
            el archivo está disponible en el repositorio.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <div style={{ minWidth: '240px' }}>
            <Input
              placeholder="Buscar documento..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          {puedeEscribir && (
            <Button variant="primary" onClick={() => (showForm ? cerrarForm() : abrirNuevo())}>
              {showForm ? 'Cerrar' : 'Nuevo documento'}
            </Button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h3 className="card-title">{editandoId ? 'EDITAR DOCUMENTO' : 'NUEVO DOCUMENTO'}</h3>
            <span className="badge badge-black">{tituloDept.toUpperCase()}</span>
          </div>
          <form onSubmit={guardar}>
            <div className="form-grid-3">
              <Select
                label="Departamento"
                value={form.departamento}
                onChange={(e) => cambiarDepartamento(e.target.value)}
                options={DEPT_MODULO.map(value => ({ value, label: DEPT_LABELS[value] }))}
                required
              />
              <Select
                label="Categoría"
                value={form.categoria}
                onChange={(e) => cambiarCategoria(e.target.value)}
                options={(DEPT_CATEGORIAS[form.departamento] || []).map(c => ({ value: c, label: CAT_LABELS[c] || c }))}
                required
              />
              <Select
                label="Tipo"
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                options={TIPOS_DOCUMENTO.map(t => ({ value: t, label: t }))}
                required
              />
            </div>

            <div className="form-grid-3" style={{ marginTop: '14px' }}>
              <Input
                label="Nombre del documento"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej. Matrícula mercantil 2026"
                required
              />
              <Input
                label="Fecha"
                type="date"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                required
              />
              <Input
                label="Enlace al archivo"
                type="url"
                value={form.enlace}
                onChange={(e) => setForm({ ...form, enlace: e.target.value })}
                placeholder="https://..."
                helperText="Opcional. Déjalo vacío si aún no existe el archivo."
              />
            </div>

            <div style={{ marginTop: '14px' }}>
              <label className="crono-label" htmlFor="doc-descripcion">Descripción</label>
              <textarea
                id="doc-descripcion"
                className="crono-input"
                rows={2}
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Qué contiene o para qué sirve este documento"
              />
            </div>

            <div style={{ marginTop: '18px' }}>
              <div className="form-label">
                Roles con acceso
                <span style={{ marginLeft: '8px', color: 'var(--color-smoke)', fontWeight: 400 }}>
                  {form.roles.length === 0 ? 'acceso administrativo general' : `${form.roles.length} seleccionado${form.roles.length === 1 ? '' : 's'}`}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {ROLES_DOCUMENTO.map(r => {
                  const activo = form.roles.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      className={`btn btn-sm ${activo ? 'btn-primary' : 'btn-outline'}`}
                      aria-pressed={activo}
                      onClick={() => toggleRolDocumento(r)}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--color-smoke)', marginTop: '8px' }}>
                Sin roles seleccionados el documento queda en la documentación administrativa
                general. Con roles, solo los seleccionados podrán verlo.
              </p>
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
                {guardando ? 'Guardando…' : (editandoId ? 'Guardar cambios' : 'Crear documento')}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            {sub || seccion ? tituloSeccion.toUpperCase() : 'TODOS LOS DOCUMENTOS'}
          </h3>
          <span className="badge badge-black">{docs.length} REGISTROS</span>
        </div>
        <Table
          columns={columnas}
          data={docs}
          pageSize={10}
          emptyMessage={busqueda ? 'Ningún documento coincide con la búsqueda.' : PLACEHOLDER_HINT}
          onRowClick={(row) => row.enlace && window.open(row.enlace, '_blank', 'noopener')}
        />
      </div>

      <ConfirmDialog
        open={!!docAEliminar}
        title="ELIMINAR DOCUMENTO"
        mensaje={docAEliminar
          ? `Se eliminará el registro de "${docAEliminar.nombre}".`
          : ''}
        detalle={docAEliminar
          ? [
              `Departamento: ${DEPT_LABELS[docAEliminar.departamento] || docAEliminar.departamento}.`,
              `Categoría: ${CAT_LABELS[docAEliminar.categoria] || docAEliminar.categoria}.`,
              'Solo se borra el registro: el archivo externo, si existe, no se modifica.',
            ]
          : []}
        confirmLabel="Eliminar documento"
        cargando={eliminando}
        error={errorEliminar}
        onConfirm={eliminar}
        onCancel={() => setDocAEliminar(null)}
      />
    </div>
  );
}

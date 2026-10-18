import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { getDB, getPersonaNombre, refreshData } from '../db';
import { api } from '../api';
import { canAccess, userRoles } from '../permissions';
import { useAuth } from '../auth';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ConfirmDialog } from '../components/ui/Modal';
import { IconTarget, IconScale } from '../components/Icons';

// Plantilla oficial de minuta (estructura documentada, no es un dato inventado)
const PLANTILLA_MINUTA = [
  { campo: 'Fecha y hora', obligatorio: true },
  { campo: 'Asistentes', obligatorio: true },
  { campo: 'Orden del día', obligatorio: true },
  { campo: 'Relatoría por punto', obligatorio: true },
  { campo: 'Acuerdos', obligatorio: true },
  { campo: 'Tareas asignadas (responsable y fecha)', obligatorio: true },
  { campo: 'Próxima reunión', obligatorio: false },
];

function emptyFormHorizonte() {
  return {
    nombre: '',
    fecha: new Date().toISOString().split('T')[0],
    enlace: '',
    descripcion: '',
  };
}

function emptyFormActa() {
  return {
    fecha: new Date().toISOString().split('T')[0],
    tema: '',
    contenido: '',
  };
}

export default function AdminJuntaOraculo() {
  const location = useLocation();
  const { currentUser } = useAuth();
  const [busqueda, setBusqueda] = useState('');
  const [actaAbierta, setActaAbierta] = useState(null);

  const parts = location.pathname.split('/').filter(Boolean);
  const seccion = parts[3] || 'horizonte'; // /d/admin/junta-oraculo/<seccion>

  const rol = currentUser?.rol;
  const roles = userRoles(currentUser);
  const puedeVer = canAccess(roles, 'documentos');
  // Escritura: la matriz de permisos habilita la gestión solo a quien la tiene.
  const puedeEscribir = canAccess(roles, 'documentos', 'write');

  // Formulario de Horizonte Crono (documentos de la Junta)
  const [showFormDoc, setShowFormDoc] = useState(false);
  const [editandoDocId, setEditandoDocId] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [formDoc, setFormDoc] = useState(emptyFormHorizonte());

  // Formulario de minutas (actas de reunión)
  const [showFormActa, setShowFormActa] = useState(false);
  const [editandoActaId, setEditandoActaId] = useState(null);
  const [formActa, setFormActa] = useState(emptyFormActa());

  // Borrados con confirmación
  const [docAEliminar, setDocAEliminar] = useState(null);
  const [actaAEliminar, setActaAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');

  const db = getDB();
  const documentos = db.documentos || [];
  const actas = db.actasReunion || [];

  const horizonte = useMemo(() => {
    let list = documentos.filter(d => d.departamento === 'junta-oraculo' && d.categoria === 'horizonte');
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      list = list.filter(d => (d.nombre || '').toLowerCase().includes(q));
    }
    return list;
  }, [documentos, busqueda]);

  const minutas = useMemo(() => {
    let list = [...actas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      list = list.filter(a =>
        (a.tema || '').toLowerCase().includes(q) ||
        (a.contenido || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [actas, busqueda]);

  // ---- Horizonte Crono: CRUD de documentos de la Junta ----
  function abrirNuevoDoc() {
    setFormDoc(emptyFormHorizonte());
    setEditandoDocId(null);
    setErrorForm('');
    setShowFormDoc(true);
  }

  function abrirEditarDoc(doc) {
    setFormDoc({
      nombre: doc.nombre || '',
      fecha: doc.fecha || new Date().toISOString().split('T')[0],
      enlace: doc.enlace || '',
      descripcion: doc.descripcion || '',
    });
    setEditandoDocId(doc.id);
    setErrorForm('');
    setShowFormDoc(true);
  }

  function cerrarFormDoc() {
    setShowFormDoc(false);
    setEditandoDocId(null);
    setErrorForm('');
    setFormDoc(emptyFormHorizonte());
  }

  async function guardarDoc(e) {
    e.preventDefault();
    if (!formDoc.nombre.trim()) return setErrorForm('El nombre del documento es obligatorio.');

    const payload = {
      departamento: 'junta-oraculo',
      categoria: 'horizonte',
      nombre: formDoc.nombre.trim(),
      tipo: 'Documento',
      fecha: formDoc.fecha,
      enlace: formDoc.enlace.trim(),
      descripcion: formDoc.descripcion.trim(),
      roles: [],
    };

    setGuardando(true);
    setErrorForm('');
    try {
      if (editandoDocId) await api.updateDocumentoJunta(editandoDocId, payload);
      else await api.createDocumentoJunta(payload);
      await refreshData();
      cerrarFormDoc();
    } catch (err) {
      setErrorForm(err.message || 'No se pudo guardar el documento.');
    } finally {
      setGuardando(false);
    }
  }

  // ---- Minutas: CRUD de actas de reunión ----
  function abrirNuevaActa() {
    setFormActa(emptyFormActa());
    setEditandoActaId(null);
    setErrorForm('');
    setShowFormActa(true);
  }

  function abrirEditarActa(acta) {
    setFormActa({
      fecha: acta.fecha || new Date().toISOString().split('T')[0],
      tema: acta.tema || '',
      contenido: acta.contenido || '',
    });
    setEditandoActaId(acta.id);
    setErrorForm('');
    setActaAbierta(null);
    setShowFormActa(true);
  }

  function cerrarFormActa() {
    setShowFormActa(false);
    setEditandoActaId(null);
    setErrorForm('');
    setFormActa(emptyFormActa());
  }

  async function guardarActa(e) {
    e.preventDefault();
    if (!formActa.tema.trim()) return setErrorForm('El tema de la reunión es obligatorio.');
    if (!formActa.contenido.trim()) return setErrorForm('El contenido de la minuta es obligatorio.');

    const payload = {
      fecha: formActa.fecha,
      tema: formActa.tema.trim(),
      contenido: formActa.contenido.trim(),
    };

    setGuardando(true);
    setErrorForm('');
    try {
      if (editandoActaId) await api.updateActa(editandoActaId, payload);
      else await api.createActa(payload);
      await refreshData();
      cerrarFormActa();
    } catch (err) {
      setErrorForm(err.message || 'No se pudo guardar la minuta.');
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminacion() {
    const objetivo = docAEliminar || actaAEliminar;
    if (!objetivo) return;

    setEliminando(true);
    setErrorEliminar('');

    try {
      if (docAEliminar) await api.deleteDocumentoJunta(docAEliminar.id);
      else await api.deleteActa(actaAEliminar.id);
      await refreshData();
      setDocAEliminar(null);
      setActaAEliminar(null);
    } catch (err) {
      setErrorEliminar(err.message || 'No se pudo eliminar el registro.');
    } finally {
      setEliminando(false);
    }
  }

  if (!puedeVer) {
    return (
      <div className="card">
        <div className="card-content" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <IconScale size={32} />
          <h3 style={{ margin: '12px 0 6px' }}>Sin acceso a la Junta del Oráculo</h3>
          <p style={{ color: 'var(--color-smoke)', fontSize: '13px' }}>
            Tu rol ({rol}) no tiene permisos para consultar esta sección.
          </p>
        </div>
      </div>
    );
  }

  const renderHorizonte = () => (
    <>
      {showFormDoc && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <h3 className="card-title">{editandoDocId ? 'EDITAR DOCUMENTO' : 'NUEVO DOCUMENTO'}</h3>
            <span className="badge badge-black">HORIZONTE CRONO</span>
          </div>
          <form onSubmit={guardarDoc}>
            <div className="form-grid-3">
              <Input
                label="Nombre del documento"
                value={formDoc.nombre}
                onChange={(e) => setFormDoc({ ...formDoc, nombre: e.target.value })}
                placeholder="Ej. Plan anual 2027"
                required
              />
              <Input
                label="Fecha"
                type="date"
                value={formDoc.fecha}
                onChange={(e) => setFormDoc({ ...formDoc, fecha: e.target.value })}
                required
              />
              <Input
                label="Enlace al archivo"
                type="url"
                value={formDoc.enlace}
                onChange={(e) => setFormDoc({ ...formDoc, enlace: e.target.value })}
                placeholder="https://..."
                helperText="Opcional. Déjalo vacío si aún no existe el archivo."
              />
            </div>
            <div style={{ marginTop: '14px' }}>
              <label className="crono-label" htmlFor="horizonte-descripcion">Descripción</label>
              <textarea
                id="horizonte-descripcion"
                className="crono-input"
                rows={2}
                value={formDoc.descripcion}
                onChange={(e) => setFormDoc({ ...formDoc, descripcion: e.target.value })}
                placeholder="Qué contiene este documento"
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
              <Button type="button" variant="ghost" onClick={cerrarFormDoc}>Cancelar</Button>
              <Button type="submit" variant="primary" disabled={guardando}>
                {guardando ? 'Guardando…' : (editandoDocId ? 'Guardar cambios' : 'Crear documento')}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">HORIZONTE CRONO</h3>
          <span className="badge badge-black">{horizonte.length} DOCUMENTOS</span>
        </div>
        <Table
          columns={[
            {
              key: 'nombre',
              header: 'Documento',
              render: (val, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <IconTarget size={15} />
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
            { key: 'fecha', header: 'Actualizado', size: '130px', mono: true },
            {
              key: 'enlace',
              header: '',
              size: '110px',
              align: 'right',
              sortable: false,
              render: (val) => val ? (
                <a href={val} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm" style={{ fontSize: '11px' }}>
                  Abrir
                </a>
              ) : <span style={{ color: 'var(--color-smoke)', fontSize: '11px' }}>—</span>,
            },
            ...(puedeEscribir ? [{
              key: 'acciones',
              header: '',
              size: '180px',
              align: 'right',
              sortable: false,
              render: (val, row) => (
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); abrirEditarDoc(row); }}>
                    Editar
                  </Button>
                  <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); setDocAEliminar(row); }}>
                    Eliminar
                  </Button>
                </div>
              ),
            }] : []),
          ]}
          data={horizonte}
          pageSize={10}
          emptyMessage={busqueda ? 'Sin resultados.' : 'No hay documentos en Horizonte Crono.'}
        />
      </div>

      <ConfirmDialog
        open={!!docAEliminar}
        title="ELIMINAR DOCUMENTO"
        mensaje={docAEliminar ? `Se eliminará el registro de "${docAEliminar.nombre}".` : ''}
        detalle={[
          'Solo se borra el registro de Horizonte Crono: el archivo externo, si existe, no se modifica.',
        ]}
        confirmLabel="Eliminar documento"
        cargando={eliminando}
        error={errorEliminar}
        onConfirm={confirmarEliminacion}
        onCancel={() => setDocAEliminar(null)}
      />
    </>
  );

  const renderMinutas = () => (
    <>
      {showFormActa && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <h3 className="card-title">{editandoActaId ? 'EDITAR MINUTA' : 'NUEVA MINUTA'}</h3>
            <span className="badge badge-black">JUNTA DEL ORÁCULO</span>
          </div>
          <form onSubmit={guardarActa}>
            <div className="form-grid-3">
              <Input
                label="Fecha de la reunión"
                type="date"
                value={formActa.fecha}
                onChange={(e) => setFormActa({ ...formActa, fecha: e.target.value })}
                required
              />
              <Input
                label="Tema"
                value={formActa.tema}
                onChange={(e) => setFormActa({ ...formActa, tema: e.target.value })}
                placeholder="Ej. Balance Q4 2026"
                required
              />
            </div>

            <div style={{ marginTop: '14px' }}>
              <label className="crono-label" htmlFor="acta-contenido">
                Contenido <span className="crono-required">*</span>
              </label>
              <textarea
                id="acta-contenido"
                className="crono-input"
                rows={7}
                value={formActa.contenido}
                onChange={(e) => setFormActa({ ...formActa, contenido: e.target.value })}
                placeholder="Asistentes, orden del día, relatoría por punto, acuerdos y tareas asignadas"
              />
              <span className="crono-helper-text">
                Sigue la plantilla oficial: asistentes, orden del día, relatoría, acuerdos y tareas.
              </span>
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
              <Button type="button" variant="ghost" onClick={cerrarFormActa}>Cancelar</Button>
              <Button type="submit" variant="primary" disabled={guardando}>
                {guardando ? 'Guardando…' : (editandoActaId ? 'Guardar cambios' : 'Crear minuta')}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Plantilla oficial */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <h3 className="card-title">PLANTILLA OFICIAL DE MINUTA</h3>
          <span className="badge badge-neutral">FORMATO</span>
        </div>
        <div className="card-content">
          <p style={{ fontSize: '13px', color: 'var(--color-smoke)', marginBottom: '14px' }}>
            Estructura obligatoria para registrar la relatoría de cada reunión de la Junta.
          </p>
          <div style={{ display: 'grid', gap: '8px' }}>
            {PLANTILLA_MINUTA.map((item, i) => (
              <div
                key={item.campo}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px',
                  border: '1px solid var(--color-ash)',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              >
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '11px',
                  color: 'var(--color-smoke)', minWidth: '18px',
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{ flex: 1 }}>{item.campo}</span>
                <span className={`badge ${item.obligatorio ? 'badge-black' : 'badge-neutral'}`}>
                  {item.obligatorio ? 'OBLIGATORIO' : 'OPCIONAL'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Archivo histórico */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">ARCHIVO HISTÓRICO DE MINUTAS</h3>
          <span className="badge badge-black">{minutas.length} REGISTROS</span>
        </div>
        <Table
          columns={[
            { key: 'fecha', header: 'Fecha', size: '120px', mono: true },
            { key: 'tema', header: 'Tema', render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
            {
              key: 'autor_persona_id',
              header: 'Relator',
              size: '170px',
              render: (val) => getPersonaNombre(val),
            },
            {
              key: 'contenido',
              header: 'Contenido',
              render: (val) => (
                <span style={{ fontSize: '12px', color: 'var(--color-smoke)' }}>
                  {(val || '').length > 90 ? `${val.slice(0, 90)}…` : val}
                </span>
              ),
            },
            {
              key: 'acciones',
              header: '',
              size: puedeEscribir ? '250px' : '110px',
              align: 'right',
              sortable: false,
              render: (val, row) => (
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  <Button variant="outline" size="sm" onClick={() => setActaAbierta(row)}>Ver</Button>
                  {puedeEscribir && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => abrirEditarActa(row)}>Editar</Button>
                      <Button variant="danger" size="sm" onClick={() => { setErrorEliminar(''); setActaAEliminar(row); }}>
                        Eliminar
                      </Button>
                    </>
                  )}
                </div>
              ),
            },
          ]}
          data={minutas}
          pageSize={8}
          emptyMessage={busqueda ? 'Sin resultados.' : 'No hay minutas registradas.'}
        />
      </div>

      {/* Modal de minuta */}
      {actaAbierta && (
        <div className="modal-backdrop" onClick={() => setActaAbierta(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-smoke)' }}>
                  {actaAbierta.fecha}
                </div>
                <h3 style={{ marginTop: '4px' }}>{actaAbierta.tema}</h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setActaAbierta(null)}>Cerrar</button>
            </div>
            <div style={{ fontSize: '13px', lineHeight: '1.7', color: 'var(--color-carbon-black)' }}>
              {actaAbierta.contenido}
            </div>
            <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--color-smoke)' }}>
              Relator: <strong>{getPersonaNombre(actaAbierta.autor_persona_id)}</strong>
            </div>
            {puedeEscribir && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <Button variant="outline" size="sm" onClick={() => abrirEditarActa(actaAbierta)}>
                  Editar minuta
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!actaAEliminar}
        title="ELIMINAR MINUTA"
        mensaje={actaAEliminar
          ? `Se eliminará la minuta del ${actaAEliminar.fecha} sobre "${actaAEliminar.tema}".`
          : ''}
        detalle={[
          'Solo se borra el registro de la relatoría: no afecta a otros documentos de la Junta.',
        ]}
        confirmLabel="Eliminar minuta"
        cargando={eliminando}
        error={errorEliminar}
        onConfirm={confirmarEliminacion}
        onCancel={() => setActaAEliminar(null)}
      />
    </>
  );

  return (
    <div>
      <div className="page-header page-header-flex">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-tag-mint">ADMINISTRACIÓN</span>
            <span className="header-meta-pill">JUNTA DEL ORÁCULO</span>
          </div>
          <h2 className="page-title">
            {(seccion === 'minutas' ? 'MINUTAS DE REUNIÓN' : 'HORIZONTE CRONO').toUpperCase()}
          </h2>
          <p className="page-subtitle">
            {seccion === 'minutas'
              ? 'Plantilla oficial y archivo histórico de las relatorías de la Junta.'
              : 'Planes anuales, objetivos y tareas pendientes de la agencia.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <div style={{ minWidth: '240px' }}>
            <Input
              placeholder="Buscar..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          {puedeEscribir && (
            <Button
              variant="primary"
              onClick={() => (seccion === 'minutas'
                ? (showFormActa ? cerrarFormActa() : abrirNuevaActa())
                : (showFormDoc ? cerrarFormDoc() : abrirNuevoDoc()))}
            >
              {(seccion === 'minutas' ? showFormActa : showFormDoc) ? 'Cerrar' : 'Nuevo'}
            </Button>
          )}
        </div>
      </div>

      {seccion === 'minutas' ? renderMinutas() : renderHorizonte()}
    </div>
  );
}

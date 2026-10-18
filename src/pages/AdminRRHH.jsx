import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { getDB, STAFF, refreshData } from '../db';
import { api } from '../api';
import { canAccess, userRoles } from '../permissions';
import { useAuth } from '../auth';
import { Table } from '../components/ui/Table';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/Modal';
import { IconUsers, IconScale, IconCalendar } from '../components/Icons';

const ROLES_STAFF = [
  'Dueño', 'Head Booker', 'Booker', 'Entrevistador', 'Scouter', 'Scouter de Aliados',
  'Producción', 'Creativo', 'Tesorería Agencia', 'Tesorería Academia', 'Administrativo',
];

const HOY = () => new Date().toISOString().split('T')[0];

const emptyForm = () => ({
  nombre: '',
  correo: '',
  telefono: '',
  fecha_nacimiento: '',
  instagram_usuario: '',
  fecha: HOY(),
  roles: ['Booker'],
});

// Roles del sistema (tipo_rol) disponibles para asignar a una persona
function getTipoRolNombre(tipoRolId) {
  const db = getDB();
  const tr = (db.tipoRoles || []).find(t => t.id === tipoRolId);
  return tr ? tr.nombre : `Rol ${tipoRolId}`;
}

function getRolesDePersona(personaId) {
  const db = getDB();
  return (db.rolPersonas || [])
    .filter(r => r.persona_id === personaId && !r.fecha_fin)
    .map(r => getTipoRolNombre(r.tipo_rol_id));
}

function rolesDe(item) {
  if (Array.isArray(item.roles) && item.roles.length > 0) return item.roles.filter(Boolean);
  return item.rol ? [item.rol] : [];
}

export default function AdminRRHH() {
  const location = useLocation();
  const { currentUser } = useAuth();

  const parts = location.pathname.split('/').filter(Boolean);
  const seccion = parts[3] || 'trabajadores'; // /d/admin/recursos-humanos/<seccion>

  const rol = currentUser?.rol;
  const roles = userRoles(currentUser);
  const puedeVer = canAccess(roles, 'rrhh');
  const puedeEditar = canAccess(roles, 'rrhh', 'write');

  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');
  const [trabajadorSel, setTrabajadorSel] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [form, setForm] = useState(emptyForm());

  // Baja de trabajador
  const [trabajadorAEliminar, setTrabajadorAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');

  // El rol Dueño no puede retirarse de quien ya lo tiene: protege que siempre
  // exista un responsable del sistema. Sí pueden sumarse los demás roles.
  const [duenoBloqueado, setDuenoBloqueado] = useState(false);

  const db = getDB();
  const personas = db.personas || [];

  // Fuente real: backend. Se usa constants.js solo como respaldo si aún no cargó.
  const fuente = (db.staff && db.staff.length > 0) ? db.staff : STAFF;
  const todos = fuente.map(s => ({ ...s, roles: rolesDe(s) }));

  const trabajadores = useMemo(() => {
    let list = todos;

    if (filtroRol !== 'todos') list = list.filter(t => t.roles.includes(filtroRol));

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      list = list.filter(t =>
        (t.nombre || '').toLowerCase().includes(q) ||
        t.roles.some(r => r.toLowerCase().includes(q)) ||
        (t.correo || getPersonaCorreo(t.persona_id) || '').toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
  }, [todos, filtroRol, busqueda]);

  function getPersonaCorreo(personaId) {
    const p = personas.find(x => x.id === personaId);
    return p ? (p.correo || '') : '';
  }

  function toggleRol(rolAFiltrar) {
    // El rol Dueño no puede quitarse a quien ya lo tiene.
    if (rolAFiltrar === 'Dueño' && duenoBloqueado) return;

    setForm(prev => {
      const activo = prev.roles.includes(rolAFiltrar);
      // Se permite quitar hasta dejar cero en pantalla: la validación de guardado
      // (y el backend) impiden guardar sin al menos un rol.
      return {
        ...prev,
        roles: activo
          ? prev.roles.filter(r => r !== rolAFiltrar)
          : [...prev.roles, rolAFiltrar],
      };
    });
    setErrorForm('');
  }

  function abrirNuevo() {
    setForm(emptyForm());
    setEditandoId(null);
    setErrorForm('');
    setDuenoBloqueado(false);
    setShowForm(true);
  }

  function abrirEditar(trabajador) {
    setForm({
      nombre: trabajador.nombre || '',
      correo: trabajador.correo || getPersonaCorreo(trabajador.persona_id) || '',
      telefono: trabajador.telefono || '',
      fecha_nacimiento: trabajador.fecha_nacimiento || '',
      instagram_usuario: trabajador.instagram_usuario || '',
      fecha: trabajador.fecha_contratacion || HOY(),
      roles: rolesDe(trabajador),
    });
    setEditandoId(trabajador.persona_id);
    setErrorForm('');
    setDuenoBloqueado(rolesDe(trabajador).includes('Dueño'));
    setShowForm(true);
  }

  function cerrarForm() {
    setShowForm(false);
    setEditandoId(null);
    setErrorForm('');
    setDuenoBloqueado(false);
    setForm(emptyForm());
  }

  function pedirBorrado(trabajador) {
    setErrorEliminar('');
    setTrabajadorAEliminar(trabajador);
  }

  async function eliminar() {
    if (!trabajadorAEliminar) return;

    setEliminando(true);
    setErrorEliminar('');

    try {
      await api.deleteStaff(trabajadorAEliminar.persona_id);
      await refreshData();
      setTrabajadorAEliminar(null);
    } catch (err) {
      // El backend bloquea la baja del rol Dueño y de personas con registros
      // vinculados: su motivo se muestra tal cual.
      setErrorEliminar(err.message || 'No se pudo eliminar el trabajador.');
    } finally {
      setEliminando(false);
    }
  }

  async function guardar(e) {
    e.preventDefault();

    if (!form.nombre.trim()) return setErrorForm('El nombre es obligatorio.');
    if (!form.correo.trim()) return setErrorForm('El correo es obligatorio.');
    if (form.roles.length === 0) {
      return setErrorForm('Debe mantenerse al menos un rol: selecciona uno antes de guardar.');
    }

    setGuardando(true);
    setErrorForm('');

    const payload = {
      nombre: form.nombre.trim(),
      correo: form.correo.trim(),
      telefono: form.telefono.trim(),
      fechaNacimiento: form.fecha_nacimiento.trim(),
      instagramUsuario: form.instagram_usuario.trim(),
      fechaContratacion: form.fecha,
      roles: form.roles,
    };

    try {
      if (editandoId) await api.updateStaff(editandoId, payload);
      else await api.createStaff(payload);

      await refreshData(); // refresca el listado y el resto de vistas
      cerrarForm();
    } catch (err) {
      setErrorForm(err.message || 'No se pudo guardar el trabajador.');
    } finally {
      setGuardando(false);
    }
  }

  // ---- Vistas por sección ----
  const renderFormulario = () => (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div className="card-header">
        <h3 className="card-title">{editandoId ? 'EDITAR TRABAJADOR' : 'NUEVO TRABAJADOR'}</h3>
        <span className="badge badge-black">{editandoId ? 'ACTUALIZACIÓN DE STAFF' : 'ALTA DE STAFF'}</span>
      </div>
      <form onSubmit={guardar}>
        <div className="form-grid-3">
          <Input
            label="Nombre completo"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Ej. María Pérez"
            required
          />
          <Input
            label="Correo electrónico"
            type="email"
            value={form.correo}
            onChange={(e) => setForm({ ...form, correo: e.target.value })}
            placeholder="nombre@crono.com"
            required
          />
          <Input
            label="Teléfono"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            placeholder="300 000 0000"
          />
          <Input
            label="Fecha de nacimiento"
            type="date"
            value={form.fecha_nacimiento}
            onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
          />
          <Input
            label="Instagram"
            value={form.instagram_usuario}
            onChange={(e) => setForm({ ...form, instagram_usuario: e.target.value })}
            placeholder="@usuario"
          />
          <Input
            label="Fecha de contratación"
            type="date"
            value={form.fecha}
            onChange={(e) => setForm({ ...form, fecha: e.target.value })}
          />
        </div>

        {/* Múltiples roles */}
        <div style={{ marginTop: '18px' }}>
          <div className="form-label">
            Roles del trabajador
            <span style={{ marginLeft: '8px', color: 'var(--color-smoke)', fontWeight: 400 }}>
              {form.roles.length} seleccionado{form.roles.length === 1 ? '' : 's'} · mínimo 1
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {ROLES_STAFF.map(r => {
              const activo = form.roles.includes(r);
              const bloqueado = duenoBloqueado && r === 'Dueño';
              return (
                <button
                  key={r}
                  type="button"
                  className={`btn btn-sm ${activo ? 'btn-primary' : 'btn-outline'}`}
                  aria-pressed={activo}
                  disabled={bloqueado}
                  title={bloqueado ? 'El rol Dueño no puede retirarse de este trabajador' : undefined}
                  onClick={() => toggleRol(r)}
                >
                  {r}
                </button>
              );
            })}
          </div>
          {duenoBloqueado && (
            <p style={{ fontSize: '11px', color: 'var(--color-smoke)', marginTop: '8px' }}>
              El rol Dueño se mantiene fijo en este trabajador. Puedes sumarle cualquier otro rol.
            </p>
          )}
        </div>

        {errorForm && (
          <div
            role="alert"
            style={{
              marginTop: '14px', padding: '10px 12px', fontSize: '12px',
              border: '1px solid var(--color-ash)', borderRadius: '6px',
              backgroundColor: 'var(--color-paper-white)', color: 'var(--color-ink)',
            }}
          >
            {errorForm}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
          <Button type="button" variant="ghost" onClick={cerrarForm}>Cancelar</Button>
          <Button
            type="submit"
            variant="primary"
            disabled={guardando || form.roles.length === 0}
          >
            {guardando ? 'Guardando…' : (editandoId ? 'Guardar cambios' : 'Crear trabajador')}
          </Button>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--color-smoke)', marginTop: '10px' }}>
          Los roles se aplican de inmediato a la autorización del sistema. La contraseña de
          acceso se define al activar la cuenta.
        </p>
      </form>
    </div>
  );

  const renderTrabajadores = () => (
    <>
      <div className="page-header page-header-flex">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-tag-mint">RECURSOS HUMANOS</span>
            <span className="header-meta-pill">DIRECTORIO DEL EQUIPO</span>
          </div>
          <h2 className="page-title">TRABAJADORES</h2>
          <p className="page-subtitle">
            {trabajadores.length} de {todos.length} trabajadores registrados.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <div style={{ minWidth: '200px' }}>
            <Input
              placeholder="Buscar por nombre, correo o rol..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          {puedeEditar && (
            <Button variant="primary" onClick={() => (showForm ? cerrarForm() : abrirNuevo())}>
              {showForm ? 'Cerrar' : 'Nuevo trabajador'}
            </Button>
          )}
        </div>
      </div>

      {/* Filtros por rol */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <button
          type="button"
          className={`btn btn-sm ${filtroRol === 'todos' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFiltroRol('todos')}
        >
          Todos ({todos.length})
        </button>
        {ROLES_STAFF.map(r => {
          const count = todos.filter(t => t.roles.includes(r)).length;
          if (count === 0) return null;
          return (
            <button
              key={r}
              type="button"
              className={`btn btn-sm ${filtroRol === r ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFiltroRol(r)}
            >
              {r} ({count})
            </button>
          );
        })}
      </div>

      {showForm && renderFormulario()}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <IconUsers size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            {filtroRol === 'todos' ? 'DIRECTORIO COMPLETO' : filtroRol.toUpperCase()}
          </h3>
          <span className="badge badge-black">{trabajadores.length} REGISTROS</span>
        </div>
        <Table
          columns={[
            {
              key: 'nombre',
              header: 'Trabajador',
              render: (val, row) => (
                <div>
                  <div style={{ fontWeight: 600 }}>{val}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-smoke)', marginTop: '2px' }}>
                    {row.correo || getPersonaCorreo(row.persona_id) || 'Sin correo registrado'}
                  </div>
                </div>
              ),
            },
            {
              key: 'roles',
              header: 'Roles',
              size: '200px',
              render: (val, row) => (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {row.roles.map(r => (
                    <span
                      key={r}
                      className={r === 'Dueño' ? 'role-tag-yellow' : 'role-tag-mint'}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              ),
            },
            {
              key: 'persona_id',
              header: 'Roles del sistema',
              size: '180px',
              render: (val) => {
                const rolesSistema = getRolesDePersona(val);
                if (rolesSistema.length === 0) return <span style={{ color: 'var(--color-smoke)' }}>—</span>;
                return (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {rolesSistema.map(r => <span key={r} className="badge badge-neutral">{r}</span>)}
                  </div>
                );
              },
            },
            { key: 'fecha_contratacion', header: 'Ingreso', size: '120px', mono: true },
            {
              key: 'acciones',
              header: '',
              size: '190px',
              align: 'right',
              sortable: false,
              render: (val, row) => puedeEditar ? (
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  <Button variant="outline" size="sm" onClick={() => abrirEditar(row)}>
                    Editar
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => pedirBorrado(row)}>
                    Eliminar
                  </Button>
                </div>
              ) : null,
            },
          ]}
          data={trabajadores}
          pageSize={10}
          emptyMessage={busqueda || filtroRol !== 'todos'
            ? 'Ningún trabajador coincide con los filtros.'
            : 'No hay trabajadores registrados.'}
        />
      </div>
    </>
  );

  const renderHojasDeVida = () => (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span className="role-tag-mint">RECURSOS HUMANOS</span>
          <span className="header-meta-pill">EXPEDIENTES</span>
        </div>
        <h2 className="page-title">HOJAS DE VIDA</h2>
        <p className="page-subtitle">
          Selecciona un trabajador del directorio para consultar su expediente completo.
        </p>
      </div>
      <div className="card">
        <Table
          columns={[
            { key: 'nombre', header: 'Trabajador', render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
            {
              key: 'roles', header: 'Roles', size: '200px',
              render: (val, row) => (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {row.roles.map(r => <span key={r} className="badge badge-neutral">{r}</span>)}
                </div>
              ),
            },
            { key: 'fecha_contratacion', header: 'Ingreso', size: '130px', mono: true },
            {
              key: 'acciones', header: '', size: '150px', align: 'right', sortable: false,
              render: (val, row) => <Button variant="outline" size="sm" onClick={() => setTrabajadorSel(row)}>Abrir expediente</Button>,
            },
          ]}
          data={todos}
          pageSize={10}
          emptyMessage="No hay expedientes disponibles."
        />
      </div>
    </div>
  );

  const renderRoles = () => (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span className="role-tag-mint">RECURSOS HUMANOS</span>
          <span className="header-meta-pill">AUTORIZACIÓN</span>
        </div>
        <h2 className="page-title">ROLES Y ACCESOS</h2>
        <p className="page-subtitle">
          Matriz de permisos vigente por rol. Un trabajador puede acumular varios roles:
          los permisos aplicados son la unión de todos ellos.
        </p>
      </div>
      <div className="card">
        <Table
          columns={[
            { key: 'nombre', header: 'Rol', size: '190px', render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
            {
              key: 'descripcion', header: 'Descripción',
              render: () => <span style={{ fontSize: '12px', color: 'var(--color-smoke)' }}>
                Define el alcance de lectura y escritura sobre los módulos del sistema.
              </span>,
            },
            {
              key: 'acciones', header: '', size: '120px', align: 'right', sortable: false,
              render: (val, row) => <span className="badge badge-neutral">{row.nombre}</span>,
            },
          ]}
          data={ROLES_STAFF.map(r => ({ nombre: r }))}
          pageSize={10}
        />
      </div>
    </div>
  );

  if (!puedeVer) {
    return (
      <div className="card">
        <div className="card-content" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <IconScale size={32} />
          <h3 style={{ margin: '12px 0 6px' }}>Sin acceso a Recursos Humanos</h3>
          <p style={{ color: 'var(--color-smoke)', fontSize: '13px' }}>
            Tu rol ({rol}) no tiene permisos para consultar esta sección.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {seccion === 'hojas-vida' ? renderHojasDeVida()
        : seccion === 'roles-accesos' ? renderRoles()
        : renderTrabajadores()}

      {/* Confirmación de baja de trabajador */}
      <ConfirmDialog
        open={!!trabajadorAEliminar}
        title="ELIMINAR TRABAJADOR"
        mensaje={trabajadorAEliminar
          ? `Se eliminará la ficha de ${trabajadorAEliminar.nombre}, su persona asociada y sus roles de trabajo.`
          : ''}
        detalle={trabajadorAEliminar
          ? [
              `Roles que dejarán de existir: ${rolesDe(trabajadorAEliminar).join(', ')}.`,
              'La baja se bloquea si la persona participa en modelos, clientes, aspirantes, entrevistas u otros registros.',
            ]
          : []}
        confirmLabel="Eliminar trabajador"
        cargando={eliminando}
        error={errorEliminar}
        onConfirm={eliminar}
        onCancel={() => setTrabajadorAEliminar(null)}
      />

      {/* Modal: expediente / hoja de vida (solo desde su apartado) */}
      {trabajadorSel && (
        <div className="modal-backdrop" onClick={() => setTrabajadorSel(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <TrabajadorDetalle trabajador={trabajadorSel} onCerrar={() => setTrabajadorSel(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

function TrabajadorDetalle({ trabajador, onCerrar }) {
  const db = getDB();
  const persona = (db.personas || []).find(p => p.id === trabajador.persona_id);
  const rolesSistema = getRolesDePersona(trabajador.persona_id);
  const rolesTrabajo = rolesDe(trabajador);

  const filas = [
    { label: 'Nombre completo', valor: persona?.nombre_completo || trabajador.nombre },
    { label: 'Correo electrónico', valor: persona?.correo || trabajador.correo || 'No registrado' },
    { label: 'Teléfono', valor: persona?.telefono || trabajador.telefono || 'No registrado' },
    { label: 'Fecha de nacimiento', valor: persona?.fecha_nacimiento || trabajador.fecha_nacimiento || 'No registrada' },
    { label: 'Fecha de ingreso', valor: trabajador.fecha_contratacion },
    { label: 'Instagram', valor: persona?.instagram_usuario || trabajador.instagram_usuario || 'No registrado' },
    { label: 'Miembro desde', valor: persona?.fecha_creacion || trabajador.fecha_creacion || '—' },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-smoke)', letterSpacing: '1px' }}>
            HOJA DE VIDA
          </div>
          <h3 style={{ marginTop: '6px' }}>{trabajador.nombre}</h3>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onCerrar}>Cerrar</button>
      </div>

      {/* Roles de trabajo asignados */}
      <div style={{ marginBottom: '18px' }}>
        <div className="form-label">Roles del trabajador</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {rolesTrabajo.map(r => (
            <span key={r} className={r === 'Dueño' ? 'role-tag-yellow' : 'badge badge-black'}>{r}</span>
          ))}
        </div>
      </div>

      {/* Roles del sistema (tipo_rol) asignados */}
      <div style={{ marginBottom: '18px' }}>
        <div className="form-label">Roles del sistema asignados</div>
        {rolesSistema.length > 0 ? (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {rolesSistema.map(r => <span key={r} className="badge badge-neutral">{r}</span>)}
          </div>
        ) : (
          <div style={{ fontSize: '13px', color: 'var(--color-smoke)' }}>
            Esta persona no tiene roles adicionales del sistema (solo su rol de staff).
          </div>
        )}
      </div>

      {/* Información personal */}
      <div style={{ display: 'grid', gap: '1px', backgroundColor: 'var(--color-ash)', border: '1px solid var(--color-ash)', borderRadius: '6px', overflow: 'hidden' }}>
        {filas.map(f => (
          <div key={f.label} style={{ display: 'flex', backgroundColor: 'var(--color-paper-white)', padding: '11px 14px', fontSize: '13px' }}>
            <span style={{ width: '190px', color: 'var(--color-smoke)', flexShrink: 0 }}>{f.label}</span>
            <span style={{ fontWeight: 500 }}>{f.valor}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '11px', color: 'var(--color-smoke)' }}>
        <IconCalendar size={13} />
        <span>Expediente consultado según permisos de tu rol.</span>
      </div>
    </>
  );
}

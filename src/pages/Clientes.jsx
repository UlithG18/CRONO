import React, { useState } from 'react';
import { getDB, getPersonaNombre, addRegistro, updateRegistro, STAFF } from '../db';
import { today } from '../helpers';
import { useAuth } from '../auth';
import { canAccess, userRoles } from '../permissions';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Table } from '../components/ui/Table';

const TIPO_RELACION = ['Cliente', 'Aliado'];
const CATEGORIAS = ['Marca', 'Diseñador', 'Productora', 'Agencia Externa', 'Otro'];

export default function Clientes() {
  const { currentUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [filterTipo, setFilterTipo] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [form, setForm] = useState({
    nombre_completo: '',
    tipo_relacion: 'Cliente',
    categoria: 'Marca',
    telefono: '',
    correo: '',
  });

  const rol = currentUser?.rol;
  const canAdd = canAccess(userRoles(currentUser), 'clientes', 'write');
  const canReassign = rol === 'Head Booker' || rol === 'Dueño';
  const isBooker = rol === 'Booker';

  function loadData() {
    const db = getDB();
    const currentUserId = currentUser?.persona_id;

    const list = (db.cliente || []).map(c => {
      const persona = (db.personas || []).find(p => p.id === c.persona_id) || {};
      return {
        ...c,
        razon_social: c.razon_social || persona.nombre_completo || getPersonaNombre(c.persona_id),
        telefono: persona.telefono || '—',
        correo: persona.correo || '—',
        booker_nombre: c.booker_persona_id ? getPersonaNombre(c.booker_persona_id) : 'Sin asignar',
      };
    });

    if (isBooker && !canReassign) {
      return list.filter(c => c.booker_persona_id === currentUserId);
    }
    return list;
  }

  const clientes = loadData();

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.nombre_completo.trim()) return;

    const hoy = today();
    const bookerId = isBooker ? currentUser?.persona_id : (canReassign ? currentUser?.persona_id : null);

    const persona = addRegistro('personas', {
      nombre_completo: form.nombre_completo.trim(),
      telefono: form.telefono.trim() || undefined,
      correo: form.correo.trim() || undefined,
      fecha_creacion: hoy,
    });

    addRegistro('cliente', {
      persona_id: persona.id,
      razon_social: form.nombre_completo.trim(),
      tipo_relacion: form.tipo_relacion,
      categoria: form.categoria,
      estado_relacion: 'Activo',
      booker_persona_id: bookerId,
    });

    addRegistro('rolPersonas', {
      persona_id: persona.id,
      tipo_rol_id: 5,
      fecha_inicio: hoy,
      fecha_fin: null,
    });

    setForm({ nombre_completo: '', tipo_relacion: 'Cliente', categoria: 'Marca', telefono: '', correo: '' });
    setShowForm(false);
    setReloadKey(k => k + 1);
  };

  const handleReasignar = (clienteId, nuevoBookerId) => {
    if (!canReassign) return;
    if (!confirm('¿Confirmar reasignación de booker? Esta acción quedará registrada en la auditoría.')) return;
    updateRegistro('cliente', clienteId, { booker_persona_id: nuevoBookerId ? Number(nuevoBookerId) : null });
    setReloadKey(k => k + 1);
  };

  const filteredClientes = clientes.filter(c => {
    const matchesTipo = filterTipo === 'Todos' || c.tipo_relacion === filterTipo;
    const matchesSearch = c.razon_social.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTipo && matchesSearch;
  });

  const columns = [
    { key: 'persona_id', header: 'ID', size: '70px', mono: true, render: (val) => `#${val}` },
    { key: 'razon_social', header: 'Razón Social', render: (val, row) => (
      <div>
        <div style={{ fontWeight: 600 }}>{val}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-smoke)' }}>
          {row.correo !== '—' ? row.correo : row.telefono}
        </div>
      </div>
    )},
    { key: 'tipo_relacion', header: 'Tipo', size: '130px', render: (val) => (
      <span className={val === 'Cliente' ? 'badge badge-blue' : 'badge badge-violet'}>{val}</span>
    )},
    { key: 'categoria', header: 'Categoría', size: '130px', render: (val) => <span className="badge badge-neutral">{val}</span> },
    { key: 'booker_nombre', header: 'Booker', size: '180px', render: (val, row) => {
      if (canReassign) {
        return (
          <select className="crono-select" style={{ padding: '4px 8px', fontSize: '12px' }}
            value={row.booker_persona_id || ''}
            onChange={(e) => handleReasignar(row.id || row.persona_id, e.target.value)}>
            <option value="">Sin Asignar</option>
            {STAFF.filter(s => s.rol === 'Booker' || s.rol === 'Head Booker').map(b => (
              <option key={b.persona_id} value={b.persona_id}>{b.nombre}</option>
            ))}
          </select>
        );
      }
      return <span style={{ fontSize: '13px' }}>{val}</span>;
    }},
    { key: 'estado_relacion', header: 'Estado', size: '110px', render: (val) => <span className="badge badge-mint">{val || 'Activo'}</span> },
  ];

  return (
    <div key={reloadKey}>
      <div className="page-header page-header-flex">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-tag-mint">COMERCIAL</span>
            <span className="header-meta-pill">{filteredClientes.length} REGISTROS</span>
          </div>
          <h2 className="page-title">CLIENTES Y ALIADOS</h2>
          <p className="page-subtitle">Gestión de cuentas comerciales y aliados estratégicos.</p>
        </div>
        {canAdd && (
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cerrar' : '+ Nuevo Cliente'}
          </Button>
        )}
      </div>

      {showForm && canAdd && (
        <div className="card" style={{ marginBottom: '24px', backgroundColor: 'var(--color-mist-gray)' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">ALTA DE CLIENTE O ALIADO</h3>
              <div className="card-subtitle">Registro en el directorio comercial</div>
            </div>
          </div>
          <form onSubmit={handleAdd}>
            <div className="form-grid-3">
              <Input label="Razón Social" value={form.nombre_completo} onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })} placeholder="Ej. Studio Blanc" required />
              <Select label="Tipo" value={form.tipo_relacion} onChange={(e) => setForm({ ...form, tipo_relacion: e.target.value })} options={TIPO_RELACION} />
              <Select label="Categoría" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} options={CATEGORIAS} />
            </div>
            <div className="form-grid-2" style={{ marginTop: '12px' }}>
              <Input label="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="300 000 0000" />
              <Input label="Correo" type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} placeholder="contacto@marca.com" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" variant="primary">Guardar</Button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: '16px 20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['Todos', 'Cliente', 'Aliado'].map(t => (
              <button key={t} type="button" className={`btn btn-sm ${filterTipo === t ? 'btn-primary' : 'btn-ghost'}`} style={{ borderRadius: 'var(--radius-tag)' }} onClick={() => setFilterTipo(t)}>{t}</button>
            ))}
          </div>
          <div style={{ width: '280px' }}>
            <input type="text" className="crono-input" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '6px 12px', fontSize: '13px' }} />
          </div>
        </div>
      </div>

      <Table columns={columns} data={filteredClientes} emptyMessage="No se encontraron clientes." />
    </div>
  );
}

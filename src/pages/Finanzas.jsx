import React, { useState } from 'react';
import { getDB, addRegistro } from '../db';
import { cop, today } from '../helpers';
import { useAuth } from '../auth';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Table } from '../components/ui/Table';

const TIPOS = ['Ingreso', 'Egreso', 'Inversión'];
const DIVISIONES = ['Agencia', 'Academia'];
const ESTADOS_PAGO = ['Completo', 'Pendiente', 'Parcial'];

export default function Finanzas({ rol, division: divisionProp }) {
  const { currentUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [filterTipo, setFilterTipo] = useState('Todos');
  const [filterDivision, setFilterDivision] = useState('Todas');
  const [reloadKey, setReloadKey] = useState(0);

  const isTesoreroAgencia = rol === 'Tesorería Agencia';
  const isTesoreroAcademia = rol === 'Tesorería Academia';
  const isDueño = rol === 'Dueño';
  const isAdmin = rol === 'Administrativo';
  const canAccess = isTesoreroAgencia || isTesoreroAcademia || isDueño || isAdmin;

  if (!canAccess) {
    return (
      <div className="card" style={{ padding: '48px', textAlign: 'center', maxWidth: '700px', margin: '40px auto' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-danger)', marginBottom: '8px' }}>
          RESTRICCIÓN FINANCIERA [RBAC]
        </div>
        <h2 style={{ fontSize: '32px', marginBottom: '16px' }}>ACCESO RESTRINGIDO A FINANZAS</h2>
        <p style={{ color: 'var(--color-slate)', lineHeight: 1.6 }}>
          Los estados financieros, balances y transacciones de caja están reservados exclusivamente
          a Tesorería, Dirección Administrativa y Dueño.
        </p>
      </div>
    );
  }

  function resolveFixedDivision() {
    if (isTesoreroAgencia) return 'Agencia';
    if (isTesoreroAcademia) return 'Academia';
    return divisionProp || null;
  }

  const fixedDivision = resolveFixedDivision();

  const [form, setForm] = useState({
    tipo: 'Ingreso',
    concepto: '',
    valor: '',
    fecha: today(),
    division: fixedDivision || 'Agencia',
    estado_pago: 'Completo',
  });

  function loadData() {
    const db = getDB();
    let list = db.transacciones || [];

    if (fixedDivision) {
      list = list.filter(t => t.division === fixedDivision);
    }

    return list.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }

  const transacciones = loadData();

  const ingresos = transacciones.filter(t => t.tipo === 'Ingreso').reduce((s, t) => s + t.valor, 0);
  const egresos = transacciones.filter(t => t.tipo === 'Egreso').reduce((s, t) => s + t.valor, 0);
  const inversiones = transacciones.filter(t => t.tipo === 'Inversión').reduce((s, t) => s + t.valor, 0);
  const balance = ingresos - egresos - inversiones;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.concepto.trim() || !form.valor) return;

    addRegistro('transacciones', {
      fecha: form.fecha || today(),
      tipo: form.tipo,
      concepto: form.concepto.trim(),
      valor: Number(form.valor),
      division: fixedDivision || form.division,
      estado_pago: form.estado_pago,
    });

    setForm({
      tipo: 'Ingreso',
      concepto: '',
      valor: '',
      fecha: today(),
      division: fixedDivision || 'Agencia',
      estado_pago: 'Completo',
    });
    setShowForm(false);
    setReloadKey(k => k + 1);
  };

  const filteredTransacciones = transacciones.filter(t => {
    const matchTipo = filterTipo === 'Todos' || t.tipo === filterTipo;
    const matchDiv = fixedDivision ? true : (filterDivision === 'Todas' || t.division === filterDivision);
    return matchTipo && matchDiv;
  });

  const columns = [
    { key: 'fecha', header: 'Fecha', size: '110px', mono: true },
    { key: 'concepto', header: 'Concepto / Justificación', render: (val, row) => (
      <div>
        <div style={{ fontWeight: 600 }}>{val}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-smoke)' }}>
          Estado: {row.estado_pago} &bull; Ref #{row.id}
        </div>
      </div>
    )},
    { key: 'division', header: 'División', size: '120px', render: (val) => (
      <span className={val === 'Agencia' ? 'badge badge-blue' : 'badge badge-violet'}>
        {val}
      </span>
    )},
    { key: 'tipo', header: 'Tipo', size: '110px', render: (val) => (
      <span className={val === 'Ingreso' ? 'badge badge-mint' : val === 'Egreso' ? 'badge badge-rose' : 'badge badge-yellow'}>
        {val}
      </span>
    )},
    { key: 'valor', header: 'Monto COP', size: '150px', align: 'right', mono: true, render: (val, row) => (
      <span style={{ fontWeight: 700, fontSize: '14px', color: row.tipo === 'Ingreso' ? 'var(--color-success)' : 'inherit' }}>
        {row.tipo === 'Ingreso' ? `+${cop(val)}` : `-${cop(val)}`}
      </span>
    )},
  ];

  return (
    <div key={reloadKey}>
      <div className="page-header page-header-flex">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-tag-mint">MÓDULO FINANCIERO</span>
            <span className="header-meta-pill">
              {fixedDivision ? `DIVISIÓN ${fixedDivision.toUpperCase()}` : 'CONSOLIDADO GENERAL'}
            </span>
          </div>
          <h2 className="page-title">TESORERÍA &amp; FLUJO DE CAJA</h2>
          <p className="page-subtitle">
            Registro unificado de transacciones, liquidaciones de talento y cobros de academia.
          </p>
        </div>

        <Button variant="primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cerrar Formulario' : '+ Registrar Movimiento'}
        </Button>
      </div>

      {/* Tarjetas de Métricas Brutalistas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">TOTAL INGRESOS</span>
            <span className="badge badge-mint">ENTRADAS</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>{cop(ingresos)}</div>
          <div className="stat-subtext">Ventas de booking y matrículas</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">TOTAL EGRESOS</span>
            <span className="badge badge-rose">SALIDAS</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{cop(egresos)}</div>
          <div className="stat-subtext">Costos operativos y honorarios</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">INVERSIONES</span>
            <span className="badge badge-yellow">CAPITAL</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{cop(inversiones)}</div>
          <div className="stat-subtext">Equipos y mejoras de estudio</div>
        </div>

        <div className="stat-card inverted">
          <div className="stat-header">
            <span className="stat-label">BALANCE DISPONIBLE</span>
            <span className="badge badge-mint" style={{ color: '#000000' }}>NETO</span>
          </div>
          <div className="stat-value" style={{ color: '#ffffff' }}>{cop(balance)}</div>
          <div className="stat-subtext" style={{ color: 'var(--color-smoke)' }}>Caja real calculada</div>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="card" style={{ marginBottom: '24px', backgroundColor: 'var(--color-mist-gray)' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">NUEVO MOVIMIENTO FINANCIERO</h3>
              <div className="card-subtitle">Asiento directo en el libro contable de Crono</div>
            </div>
            <span className="badge badge-black">TRANSACCIÓN</span>
          </div>

          <form onSubmit={handleAdd}>
            <div className="form-grid-3">
              <Select
                label="Tipo de Movimiento"
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                options={TIPOS}
              />

              <Input
                label="Concepto / Detalle"
                value={form.concepto}
                onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                placeholder="Ej. Anticipo Campaña Studio Blanc"
                required
              />

              <Input
                label="Monto en COP ($)"
                type="number"
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
                placeholder="2500000"
                required
              />
            </div>

            <div className="form-grid-3" style={{ marginTop: '12px' }}>
              <Input
                label="Fecha de Operación"
                type="date"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                required
              />

              {!fixedDivision ? (
                <Select
                  label="División de Negocio"
                  value={form.division}
                  onChange={(e) => setForm({ ...form, division: e.target.value })}
                  options={DIVISIONES}
                />
              ) : (
                <Input
                  label="División Asignada"
                  value={fixedDivision}
                  disabled
                />
              )}

              <Select
                label="Estado del Pago"
                value={form.estado_pago}
                onChange={(e) => setForm({ ...form, estado_pago: e.target.value })}
                options={ESTADOS_PAGO}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary">
                Asentar Transacción
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['Todos', ...TIPOS].map(t => (
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

          {!fixedDivision && (
            <div style={{ display: 'flex', gap: '6px' }}>
              {['Todas', ...DIVISIONES].map(d => (
                <button
                  key={d}
                  type="button"
                  className={`btn btn-sm ${filterDivision === d ? 'btn-secondary' : 'btn-ghost'}`}
                  style={{ borderRadius: 'var(--radius-tag)', fontSize: '11px' }}
                  onClick={() => setFilterDivision(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Table
        columns={columns}
        data={filteredTransacciones}
        emptyMessage="No hay transacciones registradas para los filtros seleccionados."
      />
    </div>
  );
}

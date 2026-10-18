import React from 'react';
import { getEstadisticas, getDB, getPersonaNombre } from '../db';
import { cop } from '../helpers';
import { useAuth } from '../auth';

export default function DashboardPage({ rol }) {
  const { currentUser } = useAuth();
  const stats = getEstadisticas();
  const db = getDB();

  const isDueño = rol === 'Dueño';
  const isAdmin = rol === 'Administrativo';
  const isHeadBooker = rol === 'Head Booker';
  const isBooker = rol === 'Booker';
  const isTesoreriaAgencia = rol === 'Tesorería Agencia';
  const isTesoreriaAcademia = rol === 'Tesorería Academia';
  const isProduccion = rol === 'Producción';
  const isCreativo = rol === 'Creativo';
  const isReclutamiento = rol === 'Entrevistador' || rol === 'Scouter';

  // Cálculos financieros protegidos por RBAC
  const canSeeFinanzas = isDueño || isAdmin || isTesoreriaAgencia || isTesoreriaAcademia;
  const canSeeAllFinanzas = isDueño || isAdmin;

  const transaccionesFiltradas = (db.transacciones || []).filter(t => {
    if (canSeeAllFinanzas) return true;
    if (isTesoreriaAgencia) return t.division === 'Agencia';
    if (isTesoreriaAcademia) return t.division === 'Academia';
    return false;
  });

  const ingresos = transaccionesFiltradas.filter(t => t.tipo === 'Ingreso').reduce((s, t) => s + t.valor, 0);
  const egresos = transaccionesFiltradas.filter(t => t.tipo === 'Egreso').reduce((s, t) => s + t.valor, 0);
  const inversiones = transaccionesFiltradas.filter(t => t.tipo === 'Inversión').reduce((s, t) => s + t.valor, 0);
  const balance = ingresos - egresos - inversiones;

  // Modelos visibles por RBAC
  const totalModelos = isDueño || isHeadBooker || isAdmin
    ? stats.modelosActivos
    : isBooker
    ? (db.asignacionesBooker || []).filter(a => a.booker_persona_id === currentUser?.persona_id && a.activo).length
    : 0;

  // Notificaciones de nivel pendientes
  const notificacionesPendientes = isDueño || isHeadBooker || isAdmin
    ? (db.notificacionesNivel || []).filter(n => n.estado === 'pendiente').length
    : 0;

  // Aspirantes en embudo
  const aspirantesActivos = isDueño || isAdmin || isReclutamiento
    ? (db.aspirante || []).filter(a => a.estado !== 'Descartado' && a.estado !== 'Vinculado').length
    : 0;

  // Producciones activas
  const produccionesActivas = isDueño || isAdmin || isProduccion || isCreativo
    ? (db.producciones || []).filter(p => p.estado !== 'Completado' && p.estado !== 'Cancelado').length
    : 0;

  return (
    <div>
      {/* Header Editorial del Dashboard */}
      <div className="page-header page-header-flex">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className={isDueño ? 'role-tag-yellow' : 'role-tag-mint'}>{rol}</span>
            <span className="header-meta-pill">ESTADO OPERACIONAL ACTIVO</span>
          </div>
          <h2 className="page-title">PANEL DE CONTROL</h2>
          <p className="page-subtitle">
            Visión global sincronizada para {currentUser?.nombre || 'Operador'} &bull; Base de operaciones Crono.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge badge-black" style={{ padding: '8px 14px', fontSize: '12px' }}>
            FECHA: {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: '2-digit' }).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Grid de KPIs Brutalista */}
      <div className="stats-grid">
        {/* KPI 1: Modelos / Talento */}
        {(isDueño || isHeadBooker || isBooker || isAdmin) && (
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">
                {isBooker ? 'TALENTOS ASIGNADOS' : 'MODELOS ACTIVOS'}
              </span>
              <span className="badge badge-mint">AGENCY</span>
            </div>
            <div className="stat-value">{totalModelos}</div>
            <div className="stat-subtext">
              {isBooker ? 'Bajo tu gestión de booker' : 'En catálogo general'}
            </div>
          </div>
        )}

        {/* KPI 2: Reclutamiento & Aspirantes */}
        {(isDueño || isAdmin || isReclutamiento) && (
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">ASPIRANTES EN EMBUDO</span>
              <span className="badge badge-neutral">SCOUTING</span>
            </div>
            <div className="stat-value">{aspirantesActivos}</div>
            <div className="stat-subtext">En proceso de evaluación</div>
          </div>
        )}

        {/* KPI 3: Notificaciones de Ascenso */}
        {(isDueño || isHeadBooker || isAdmin) && (
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">ALERTAS DE ASCENSO</span>
              <span className="badge badge-yellow">EVALUACIÓN</span>
            </div>
            <div className="stat-value">{notificacionesPendientes}</div>
            <div className="stat-subtext">Modelos con score &ge; 8.0 pendientes</div>
          </div>
        )}

        {/* KPI 4: Producción & Operaciones */}
        {(isDueño || isAdmin || isProduccion || isCreativo) && (
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">PRODUCCIONES ACTIVAS</span>
              <span className="badge badge-blue">RODAJES</span>
            </div>
            <div className="stat-value">{produccionesActivas}</div>
            <div className="stat-subtext">Books, campañas y editoriales</div>
          </div>
        )}

        {/* KPI 5: Balance Financiero (Inverted Card para Contraste Brutalista) */}
        {canSeeFinanzas && (
          <div className="stat-card inverted">
            <div className="stat-header">
              <span className="stat-label">
                {canSeeAllFinanzas ? 'BALANCE NETO TOTAL' : `BALANCE ${isTesoreriaAgencia ? 'AGENCIA' : 'ACADEMIA'}`}
              </span>
              <span className="badge badge-mint" style={{ color: '#000000' }}>FINANZAS</span>
            </div>
            <div className="stat-value" style={{ color: '#ffffff' }}>
              {cop(balance)}
            </div>
            <div className="stat-subtext" style={{ color: 'var(--color-smoke)' }}>
              Ingresos: {cop(ingresos)} &bull; Egresos: {cop(egresos + inversiones)}
            </div>
          </div>
        )}
      </div>

      {/* Bloques de Detalle por Rol */}
      <div style={{ display: 'grid', gridTemplateColumns: canSeeFinanzas ? '1.1fr 0.9fr' : '1fr', gap: '24px' }}>
        {/* Desglose Financiero */}
        {canSeeFinanzas && (
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">ESTADO DE CAJA &amp; FLUJO</h3>
                <div className="card-subtitle">
                  {canSeeAllFinanzas ? 'Consolidado de Agencia y Academia' : `División ${isTesoreriaAgencia ? 'Agencia' : 'Academia'}`}
                </div>
              </div>
              <span className="badge badge-neutral">AUDITADO</span>
            </div>

            <div className="card-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--color-mist-gray)' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-slate)' }}>Total Ingresos Operativos</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-success)' }}>
                  +{cop(ingresos)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--color-mist-gray)' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-slate)' }}>Gastos &amp; Egresos Directos</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-danger)' }}>
                  -{cop(egresos)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--color-mist-gray)' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-slate)' }}>Inversiones Estratégicas</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-warning)' }}>
                  -{cop(inversiones)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 4px', borderTop: '2px solid var(--color-carbon-black)' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, textTransform: 'uppercase' }}>Disponibilidad Neta</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '18px' }}>
                  {cop(balance)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Registro de Actividad y Proyectos Recientes */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">PROYECTOS &amp; OPERACIONES</h3>
              <div className="card-subtitle">Últimos eventos registrados en el sistema</div>
            </div>
            <span className="badge badge-mint">ACTIVO</span>
          </div>

          <div className="card-content">
            {(db.proyectos || []).slice(-4).reverse().map((p, idx) => (
              <div
                key={p.id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: idx < 3 ? '1px solid var(--color-mist-gray)' : 'none',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{p.nombre}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-smoke)' }}>
                    {p.fecha} &bull; {p.participantes?.length || 0} participantes
                  </div>
                </div>

                <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                  {p.tipo}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

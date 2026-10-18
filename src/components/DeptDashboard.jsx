import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { getDB, getPersonaNombre, STAFF } from '../db';
import { cop } from '../helpers';
import { Button } from './ui/Button';
import { Table } from './ui/Table';
import { IconUser, IconCamera, IconFilm, IconDollar, IconBook, IconSettings, IconFolder, IconBriefcase } from './Icons';

// Devuelve el corte actual de una persona según su historial
function corteActual(personaId, historial, cortes) {
  const h = historial
    .filter(x => x.modelo_persona_id === personaId)
    .sort((a, b) => new Date(b.fecha_asignacion) - new Date(a.fecha_asignacion))[0];
  return h ? cortes.find(c => c.id === h.corte_id) : null;
}

// Promedio de las últimas notas por aspecto
function scoreGeneral(personaId, habilidades) {
  const obs = habilidades.filter(o => o.persona_id === personaId);
  if (obs.length === 0) return null;
  const porAspecto = {};
  obs.forEach(o => {
    if (!porAspecto[o.aspecto] || new Date(o.fecha) > new Date(porAspecto[o.aspecto].fecha)) {
      porAspecto[o.aspecto] = o;
    }
  });
  const notas = Object.values(porAspecto).map(o => o.nota);
  return notas.reduce((a, b) => a + b, 0) / notas.length;
}

export default function DeptDashboard({ dept }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const db = getDB();
  const rol = currentUser?.rol;

  const renderReclutamiento = () => {
    const aspirantes = (db.aspirante || []).filter(a => a.estado !== 'Descartado');
    const pendientes = aspirantes.filter(a => a.estado === 'Pendiente').length;
    const entrevistados = aspirantes.filter(a => a.estado === 'Entrevistado').length;

    return (
      <>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header"><span className="stat-label">ASPIRANTES ACTIVOS</span><span className="badge badge-mint">EMBUDO</span></div>
            <div className="stat-value">{aspirantes.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-header"><span className="stat-label">PENDIENTES</span><span className="badge badge-yellow">CONTACTO</span></div>
            <div className="stat-value">{pendientes}</div>
          </div>
          <div className="stat-card">
            <div className="stat-header"><span className="stat-label">ENTREVISTADOS</span><span className="badge badge-blue">EVALUADOS</span></div>
            <div className="stat-value">{entrevistados}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">ASPIRANTES RECIENTES</h3>
            <Button variant="outline" size="sm" onClick={() => navigate('/d/reclutamiento/aspirantes')}>Ver Embudo</Button>
          </div>
          <Table
            columns={[
              { key: 'persona_id', header: 'Prospecto', render: (val) => <div style={{ fontWeight: 600 }}>{getPersonaNombre(val)}</div> },
              { key: 'medio_contacto', header: 'Canal', size: '130px', render: (val) => <span className="badge badge-neutral">{val}</span> },
              { key: 'estado', header: 'Estado', size: '120px', render: (val) => <span className={val === 'Pendiente' ? 'badge badge-yellow' : 'badge badge-mint'}>{val}</span> },
            ]}
            data={aspirantes.slice(0, 5)}
            pageSize={5}
            emptyMessage="No hay aspirantes activos."
          />
        </div>
      </>
    );
  };

  const renderBooking = () => {
    const modelos = (db.rolPersonas || []).filter(r => r.tipo_rol_id === 2 && !r.fecha_fin);
    const alertas = (db.notificacionesNivel || []).filter(n => n.estado === 'pendiente');

    return (
      <>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header"><span className="stat-label">TALENTOS</span><span className="badge badge-mint">ROSTER</span></div>
            <div className="stat-value">{modelos.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-header"><span className="stat-label">ALERTAS ASCENSO</span><span className="badge badge-yellow">PENDIENTES</span></div>
            <div className="stat-value">{alertas.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-header"><span className="stat-label">CLIENTES</span><span className="badge badge-blue">CUENTAS</span></div>
            <div className="stat-value">{(db.cliente || []).length}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">TALENTOS POR CORTE</h3>
            <Button variant="outline" size="sm" onClick={() => navigate('/d/booking/modelos')}>Ver Catálogo</Button>
          </div>
          <Table
            columns={[
              { key: 'persona_id', header: 'Talento', render: (val) => <div style={{ fontWeight: 600 }}>{getPersonaNombre(val)}</div> },
              { key: 'corte', header: 'Corte', size: '140px', render: (val) => <span className="badge badge-neutral">{val}</span> },
              { key: 'score', header: 'Score', size: '90px', mono: true },
            ]}
            data={modelos.map(m => {
              const corte = corteActual(m.persona_id, db.corteHistorial || [], db.cortes || []);
              const score = scoreGeneral(m.persona_id, db.habilidadActual || []);
              return { persona_id: m.persona_id, corte: corte?.nombre || 'Delta', score: score?.toFixed(1) || '—' };
            })}
            pageSize={5}
            emptyMessage="No hay talentos registrados."
          />
        </div>
      </>
    );
  };

  const renderProduccion = () => {
    const producciones = (db.producciones || []).filter(p => p.estado !== 'Completado');
    const locaciones = db.locaciones || [];

    return (
      <>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header"><span className="stat-label">EN CURSO</span><span className="badge badge-mint">RODAJES</span></div>
            <div className="stat-value">{producciones.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-header"><span className="stat-label">LOCACIONES</span><span className="badge badge-blue">ESPACIOS</span></div>
            <div className="stat-value">{locaciones.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-header"><span className="stat-label">COLABORADORES</span><span className="badge badge-neutral">RED</span></div>
            <div className="stat-value">{(db.colaboradores || []).length}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">PRODUCCIONES ACTIVAS</h3>
            <Button variant="outline" size="sm" onClick={() => navigate('/d/produccion/produccion')}>Ver Producción</Button>
          </div>
          <Table
            columns={[
              { key: 'tipo_evento', header: 'Tipo', size: '140px', render: (val) => <span className="badge badge-neutral">{val}</span> },
              { key: 'fecha', header: 'Fecha', size: '120px', mono: true },
              { key: 'estado', header: 'Estado', size: '120px', render: (val) => <span className="badge badge-mint">{val}</span> },
            ]}
            data={producciones}
            pageSize={5}
            emptyMessage="No hay producciones activas."
          />
        </div>
      </>
    );
  };

  const renderFinanzas = () => {
    const transacciones = (db.transacciones || []).filter(t => {
      if (rol === 'Tesorería Agencia') return t.division === 'Agencia';
      if (rol === 'Tesorería Academia') return t.division === 'Academia';
      return true;
    });
    const ingresos = transacciones.filter(t => t.tipo === 'Ingreso').reduce((s, t) => s + t.valor, 0);
    const egresos = transacciones.filter(t => t.tipo === 'Egreso').reduce((s, t) => s + t.valor, 0);

    return (
      <>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header"><span className="stat-label">INGRESOS</span><span className="badge badge-mint">ENTRADAS</span></div>
            <div className="stat-value" style={{ color: 'var(--color-success)' }}>{cop(ingresos)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-header"><span className="stat-label">EGRESOS</span><span className="badge badge-rose">SALIDAS</span></div>
            <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{cop(egresos)}</div>
          </div>
          <div className="stat-card inverted">
            <div className="stat-header"><span className="stat-label">BALANCE</span><span className="badge badge-mint" style={{ color: '#000' }}>NETO</span></div>
            <div className="stat-value" style={{ color: '#fff' }}>{cop(ingresos - egresos)}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">ÚLTIMOS MOVIMIENTOS</h3>
            <Button variant="outline" size="sm" onClick={() => navigate(rol === 'Tesorería Agencia' ? '/d/finanzas/agencia' : '/d/finanzas/academia')}>Ver Libro</Button>
          </div>
          <Table
            columns={[
              { key: 'fecha', header: 'Fecha', size: '100px', mono: true },
              { key: 'concepto', header: 'Concepto' },
              { key: 'valor', header: 'Monto', size: '130px', align: 'right', mono: true, render: (val) => cop(val) },
            ]}
            data={transacciones.slice(0, 5)}
            pageSize={5}
            emptyMessage="No hay movimientos."
          />
        </div>
      </>
    );
  };

  const renderAdmin = () => {
    const staff = STAFF.length;
    const formatos = (db.formatosOficiales || []).length;
    const actas = (db.actasReunion || []).length;

    return (
      <>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header"><span className="stat-label">STAFF</span><span className="badge badge-black">EQUIPO</span></div>
            <div className="stat-value">{staff}</div>
          </div>
          <div className="stat-card">
            <div className="stat-header"><span className="stat-label">FORMATOS</span><span className="badge badge-blue">DOCS</span></div>
            <div className="stat-value">{formatos}</div>
          </div>
          <div className="stat-card">
            <div className="stat-header"><span className="stat-label">ACTAS</span><span className="badge badge-neutral">JUNTA</span></div>
            <div className="stat-value">{actas}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">ACCESOS RÁPIDOS</h3>
          </div>
          <div className="card-content">
            <Button variant="outline" style={{ width: '100%' }} onClick={() => navigate('/d/admin/nucleo')}>Núcleo Personas</Button>
            <Button variant="outline" style={{ width: '100%' }} onClick={() => navigate('/d/admin/rrhh')}>RRHH y Actas</Button>
            <Button variant="outline" style={{ width: '100%' }} onClick={() => navigate('/d/admin/formatos')}>Formatos Oficiales</Button>
          </div>
        </div>
      </>
    );
  };

  const renderers = {
    reclutamiento: renderReclutamiento,
    booking: renderBooking,
    produccion: renderProduccion,
    academia: renderProduccion,
    finanzas: renderFinanzas,
    admin: renderAdmin,
  };

  return (
    <div>
      <div className="page-header page-header-flex">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-tag-mint">DASHBOARD</span>
            <span className="header-meta-pill">{dept?.toUpperCase() || 'GENERAL'}</span>
          </div>
          <h2 className="page-title">{dept?.toUpperCase() || 'DASHBOARD'}</h2>
          <p className="page-subtitle">Resumen operativo del departamento.</p>
        </div>
      </div>
      {renderers[dept]?.() || renderBooking()}
    </div>
  );
}


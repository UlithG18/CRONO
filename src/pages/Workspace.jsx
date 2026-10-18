import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDB, getPersonaNombre, STAFF } from '../db';
import { cop, today, scoreGeneral, corteActual } from '../helpers';
import { useAuth } from '../auth';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';

export default function Workspace() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const db = getDB();
  const rol = currentUser?.rol || 'Staff';
  const currentPersonaId = currentUser?.persona_id;

  const isDueño = rol === 'Dueño';
  const isHeadBooker = rol === 'Head Booker';
  const isBooker = rol === 'Booker';
  const isScouter = rol === 'Scouter';
  const isEntrevistador = rol === 'Entrevistador';
  const isProduccion = rol === 'Producción';
  const isCreativo = rol === 'Creativo';
  const isTesoreriaAgencia = rol === 'Tesorería Agencia';
  const isTesoreriaAcademia = rol === 'Tesorería Academia';
  const isAdmin = rol === 'Administrativo';

  const [activeTab, setActiveTab] = useState('hoy');

  const misAsignaciones = (db.asignacionesBooker || []).filter(
    a => a.booker_persona_id === currentPersonaId && a.activo
  );
  const misModelos = misAsignaciones.map(a => {
    const mod = (db.modelo || []).find(m => m.persona_id === a.modelo_persona_id) || {};
    const corte = corteActual(a.modelo_persona_id, db.corteHistorial || [], db.cortes || []);
    const score = scoreGeneral(a.modelo_persona_id, db.habilidadActual || []);
    return {
      persona_id: a.modelo_persona_id,
      nombre: getPersonaNombre(a.modelo_persona_id),
      nombre_artistico: mod.nombre_artistico || '—',
      corte: corte ? corte.nombre : 'Delta',
      score: score != null ? score.toFixed(1) : '—',
      enfoque: mod.enfoque || 'Moda',
    };
  });

  const misClientes = (db.cliente || []).filter(c => c.booker_persona_id === currentPersonaId);
  const aspirantesPendientes = (db.aspirante || []).filter(a => a.estado === 'Pendiente');
  const aspirantesEntrevistados = (db.aspirante || []).filter(a => a.estado === 'Entrevistado');
  const alertasAscenso = (db.notificacionesNivel || []).filter(n => n.estado === 'pendiente');
  const misProducciones = (db.producciones || []).filter(p => p.estado !== 'Completado' && p.estado !== 'Cancelado');
  const transaccionesAgencia = (db.transacciones || []).filter(t => t.division === 'Agencia');
  const transaccionesAcademia = (db.transacciones || []).filter(t => t.division === 'Academia');

  const cuotasPorCobrar = [];
  (db.matriculas || []).forEach(m => {
    (m.cuotas || []).forEach(c => {
      if (c.estado === 'Pendiente') {
        cuotasPorCobrar.push({
          matricula_id: m.id,
          alumno: getPersonaNombre(m.estudiante_persona_id),
          cuota_num: c.n,
          valor: c.valor,
        });
      }
    });
  });

  const tabs = [
    { key: 'hoy', label: 'Hoy' },
    { key: 'tareas', label: 'Mis Tareas' },
    { key: 'cartera', label: 'Mi Cartera' },
    { key: 'documentos', label: 'Mis Documentos' },
    { key: 'perfil', label: 'Mi Perfil' },
  ];

  return (
    <div className="workspace-container">
      <div className="card" style={{ marginBottom: '24px', backgroundColor: 'var(--color-paper-white)', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className={isDueño ? 'role-tag-yellow' : 'role-tag-mint'}>{rol}</span>
              <span className="header-meta-pill">MI ESCRITORIO PERSONAL</span>
            </div>
            <h1 style={{ fontSize: '48px', lineHeight: 0.9, marginBottom: '8px' }}>
              HOLA, {currentUser?.nombre?.toUpperCase() || 'TRABAJADOR'}
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--color-slate)', maxWidth: '650px' }}>
              Este es tu espacio de trabajo inmersivo en Crono. Desde aquí gestionas tus tareas directas.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <span className="badge badge-black" style={{ padding: '8px 14px', fontSize: '12px' }}>
              CONECTADO
            </span>
          </div>
        </div>
      </div>

      <div className="top-dept-nav" style={{ marginBottom: '24px' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            className={`dept-pill-btn ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'hoy' && (
        <div>
          {isBooker && (
            <div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">MI CARTERA DE TALENTO</span>
                    <span className="badge badge-mint">ASIGNADOS</span>
                  </div>
                  <div className="stat-value">{misModelos.length}</div>
                  <div className="stat-subtext">Modelos bajo tu supervisión directa</div>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">MIS MARCAS Y CLIENTES</span>
                    <span className="badge badge-blue">CUENTAS</span>
                  </div>
                  <div className="stat-value">{misClientes.length}</div>
                  <div className="stat-subtext">Empresas comerciales que gestionas</div>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">RODAJES EN CURSO</span>
                    <span className="badge badge-yellow">PRODUCCIÓN</span>
                  </div>
                  <div className="stat-value">{misProducciones.length}</div>
                  <div className="stat-subtext">Producciones programadas en Crono</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', marginTop: '16px' }}>
                <div className="card">
                  <div className="card-header">
                    <div>
                      <h3 className="card-title">MIS MODELOS ASIGNADOS</h3>
                      <div className="card-subtitle">Talentos a tu cargo directo</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate('/d/booking/modelos')}>
                      Ver Catálogo
                    </Button>
                  </div>
                  <Table
                    columns={[
                      { key: 'nombre_artistico', header: 'Talento', render: (val, row) => (
                        <div><div style={{ fontWeight: 600 }}>{val}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-smoke)' }}>{row.nombre}</div></div>
                      )},
                      { key: 'corte', header: 'Corte', size: '120px', render: (val) => <span className="badge badge-neutral">{val}</span> },
                      { key: 'score', header: 'Score', size: '80px', mono: true },
                    ]}
                    data={misModelos}
                    pageSize={5}
                    emptyMessage="No tienes modelos asignados."
                  />
                </div>
                <div className="card">
                  <div className="card-header"><h3 className="card-title">ACCIONES RÁPIDAS</h3></div>
                  <div className="card-content">
                    <Button variant="primary" style={{ width: '100%' }} onClick={() => navigate('/d/booking/clientes')}>
                      + Nuevo Cliente
                    </Button>
                    <Button variant="outline" style={{ width: '100%' }} onClick={() => navigate('/d/booking/portafolio')}>
                      Ver Portafolio
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isHeadBooker && (
            <div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">TOTAL TALENTOS</span>
                    <span className="badge badge-mint">ROSTER</span>
                  </div>
                  <div className="stat-value">{(db.modelo || []).length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">ALERTAS DE ASCENSO</span>
                    <span className="badge badge-yellow">PENDIENTES</span>
                  </div>
                  <div className="stat-value">{alertasAscenso.length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">EQUIPO BOOKERS</span>
                    <span className="badge badge-black">STAFF</span>
                  </div>
                  <div className="stat-value">{STAFF.filter(s => s.rol === 'Booker').length}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '16px' }}>
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">ALERTAS DE ASCENSO</h3>
                    <Button variant="outline" size="sm" onClick={() => navigate('/d/booking/notifNivel')}>
                      Gestionar
                    </Button>
                  </div>
                  <Table
                    columns={[
                      { key: 'persona_id', header: 'Talento', render: (val) => <div style={{ fontWeight: 600 }}>{getPersonaNombre(val)}</div> },
                      { key: 'score_alcanzado', header: 'Score', size: '100px', mono: true },
                    ]}
                    data={alertasAscenso}
                    pageSize={4}
                    emptyMessage="No hay alertas pendientes."
                  />
                </div>
                <div className="card">
                  <div className="card-header"><h3 className="card-title">ACCIONES</h3></div>
                  <div className="card-content">
                    <Button variant="primary" style={{ width: '100%' }} onClick={() => navigate('/d/booking/modelos')}>
                      Reasignar Bookers
                    </Button>
                    <Button variant="outline" style={{ width: '100%' }} onClick={() => navigate('/d/booking/clientes')}>
                      Reasignar Clientes
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(isScouter || isEntrevistador) && (
            <div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">ASPIRANTES PENDIENTES</span>
                    <span className="badge badge-yellow">CONTACTO</span>
                  </div>
                  <div className="stat-value">{aspirantesPendientes.length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">ENTREVISTADOS</span>
                    <span className="badge badge-blue">EVALUADOS</span>
                  </div>
                  <div className="stat-value">{aspirantesEntrevistados.length}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', marginTop: '16px' }}>
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">ASPIRANTES RECIENTES</h3>
                    <Button variant="outline" size="sm" onClick={() => navigate('/d/reclutamiento/aspirantes')}>
                      Ver Embudo
                    </Button>
                  </div>
                  <Table
                    columns={[
                      { key: 'persona_id', header: 'Prospecto', render: (val) => <div style={{ fontWeight: 600 }}>{getPersonaNombre(val)}</div> },
                      { key: 'estado', header: 'Estado', size: '120px', render: (val) => (
                        <span className={val === 'Pendiente' ? 'badge badge-yellow' : 'badge badge-mint'}>{val}</span>
                      )},
                    ]}
                    data={(db.aspirante || []).slice(0, 5)}
                    pageSize={5}
                    emptyMessage="No hay aspirantes registrados."
                  />
                </div>
                <div className="card">
                  <div className="card-header"><h3 className="card-title">ACCIONES</h3></div>
                  <div className="card-content">
                    <Button variant="primary" style={{ width: '100%' }} onClick={() => navigate('/d/reclutamiento/aspirantes')}>
                      + Nuevo Aspirante
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(isProduccion || isCreativo) && (
            <div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">PRODUCCIONES EN CURSO</span>
                    <span className="badge badge-mint">RODAJES</span>
                  </div>
                  <div className="stat-value">{misProducciones.length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">LOCACIONES</span>
                    <span className="badge badge-blue">ESPACIOS</span>
                  </div>
                  <div className="stat-value">{(db.locaciones || []).length}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', marginTop: '16px' }}>
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">RODAJES PROGRAMADOS</h3>
                    <Button variant="outline" size="sm" onClick={() => navigate('/d/produccion/produccion')}>
                      Ver Producción
                    </Button>
                  </div>
                  <Table
                    columns={[
                      { key: 'tipo_evento', header: 'Tipo', size: '120px', render: (val) => <span className="badge badge-neutral">{val}</span> },
                      { key: 'fecha', header: 'Fecha', size: '110px', mono: true },
                      { key: 'estado', header: 'Estado', size: '120px', render: (val) => <span className="badge badge-mint">{val}</span> },
                    ]}
                    data={misProducciones}
                    pageSize={5}
                    emptyMessage="No hay producciones activas."
                  />
                </div>
                <div className="card">
                  <div className="card-header"><h3 className="card-title">ACCIONES</h3></div>
                  <div className="card-content">
                    <Button variant="primary" style={{ width: '100%' }} onClick={() => navigate('/d/produccion/produccion')}>
                      + Nueva Producción
                    </Button>
                    <Button variant="outline" style={{ width: '100%' }} onClick={() => navigate('/d/produccion/recursos')}>
                      Ver Recursos
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(isTesoreriaAgencia || isTesoreriaAcademia) && (
            <div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">DIVISIÓN</span>
                    <span className="badge badge-black">{isTesoreriaAgencia ? 'AGENCIA' : 'ACADEMIA'}</span>
                  </div>
                  <div className="stat-value">{isTesoreriaAgencia ? 'TALENTO' : 'CURSOS'}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">INGRESOS</span>
                    <span className="badge badge-mint">ENTRADAS</span>
                  </div>
                  <div className="stat-value" style={{ color: 'var(--color-success)' }}>
                    {cop(
                      (isTesoreriaAgencia ? transaccionesAgencia : transaccionesAcademia)
                        .filter(t => t.tipo === 'Ingreso')
                        .reduce((s, t) => s + t.valor, 0)
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', marginTop: '16px' }}>
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">ÚLTIMOS ASIENTOS</h3>
                    <Button variant="outline" size="sm" onClick={() => navigate(isTesoreriaAgencia ? '/d/finanzas/agencia' : '/d/finanzas/academia')}>
                      Ver Libro
                    </Button>
                  </div>
                  <Table
                    columns={[
                      { key: 'fecha', header: 'Fecha', size: '100px', mono: true },
                      { key: 'concepto', header: 'Concepto' },
                      { key: 'valor', header: 'Monto', size: '130px', align: 'right', mono: true, render: (val) => cop(val) },
                    ]}
                    data={(isTesoreriaAgencia ? transaccionesAgencia : transaccionesAcademia).slice(0, 5)}
                    pageSize={5}
                    emptyMessage="No hay transacciones."
                  />
                </div>
                <div className="card">
                  <div className="card-header"><h3 className="card-title">ACCIONES</h3></div>
                  <div className="card-content">
                    <Button variant="primary" style={{ width: '100%' }} onClick={() => navigate(isTesoreriaAgencia ? '/d/finanzas/agencia' : '/d/finanzas/academia')}>
                      + Nuevo Movimiento
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(isDueño || isAdmin) && (
            <div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">ROSTER TOTAL</span>
                    <span className="badge badge-mint">AGENCY</span>
                  </div>
                  <div className="stat-value">{(db.modelo || []).length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">ALUMNOS</span>
                    <span className="badge badge-blue">ACADEMIA</span>
                  </div>
                  <div className="stat-value">{(db.matriculas || []).length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">EQUIPO</span>
                    <span className="badge badge-black">STAFF</span>
                  </div>
                  <div className="stat-value">{STAFF.length}</div>
                </div>
                <div className="stat-card inverted">
                  <div className="stat-header">
                    <span className="stat-label">BALANCE NETO</span>
                    <span className="badge badge-mint" style={{ color: '#000' }}>GLOBAL</span>
                  </div>
                  <div className="stat-value" style={{ color: '#fff' }}>
                    {cop((db.transacciones || []).filter(t => t.tipo === 'Ingreso').reduce((s, t) => s + t.valor, 0) -
                         (db.transacciones || []).filter(t => t.tipo === 'Egreso' || t.tipo === 'Inversión').reduce((s, t) => s + t.valor, 0))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', marginTop: '16px' }}>
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">PROYECTOS RECIENTES</h3>
                    <Button variant="outline" size="sm" onClick={() => navigate('/d/produccion/produccion')}>
                      Ver Dashboard
                    </Button>
                  </div>
                  <Table
                    columns={[
                      { key: 'nombre', header: 'Proyecto', render: (val) => <div style={{ fontWeight: 600 }}>{val}</div> },
                      { key: 'fecha', header: 'Fecha', size: '110px', mono: true },
                    ]}
                    data={(db.proyectos || []).slice(0, 5)}
                    pageSize={5}
                  />
                </div>
                <div className="card">
                  <div className="card-header"><h3 className="card-title">ACCIONES</h3></div>
                  <div className="card-content">
                    {isDueño && (
                      <Button variant="primary" style={{ width: '100%', backgroundColor: 'var(--color-voltage-yellow)', color: '#000' }} onClick={() => navigate('/privado')}>
                        Espacio Privado
                      </Button>
                    )}
                    <Button variant="outline" style={{ width: '100%' }} onClick={() => navigate('/d/admin/nucleo')}>
                      Núcleo Personas
                    </Button>
                    <Button variant="outline" style={{ width: '100%' }} onClick={() => navigate('/d/finanzas/agencia')}>
                      Finanzas
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'tareas' && (
        <div className="card">
          <div className="card-header"><h3 className="card-title">MIS TAREAS</h3></div>
          <div className="card-content">
            <p style={{ color: 'var(--color-smoke)' }}>No tienes tareas pendientes asignadas.</p>
          </div>
        </div>
      )}

      {activeTab === 'cartera' && (
        <div className="card">
          <div className="card-header"><h3 className="card-title">MI CARTERA</h3></div>
          <div className="card-content">
            {isBooker && <p>Modelos asignados: {misModelos.length}</p>}
            {isHeadBooker && <p>Total talentos: {(db.modelo || []).length}</p>}
            {!isBooker && !isHeadBooker && <p style={{ color: 'var(--color-smoke)' }}>No tienes cartera asignada.</p>}
          </div>
        </div>
      )}

      {activeTab === 'documentos' && (
        <div className="card">
          <div className="card-header"><h3 className="card-title">MIS DOCUMENTOS</h3></div>
          <div className="card-content">
            <Button variant="outline" onClick={() => navigate('/d/admin/formatos')}>Ver Formatos Oficiales</Button>
          </div>
        </div>
      )}

      {activeTab === 'perfil' && (
        <div className="card">
          <div className="card-header"><h3 className="card-title">MI PERFIL</h3></div>
          <div className="card-content">
            <p><strong>Nombre:</strong> {currentUser?.nombre}</p>
            <p><strong>Rol:</strong> {rol}</p>
            <p><strong>ID:</strong> #{currentPersonaId}</p>
            <p><strong>Correo:</strong> {currentUser?.correo || 'No registrado'}</p>
          </div>
        </div>
      )}
    </div>
  );
}


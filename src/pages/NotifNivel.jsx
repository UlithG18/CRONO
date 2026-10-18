import React, { useState } from 'react';
import { getDB, getPersonaNombre, updateRegistro } from '../db';
import { CORTES } from '../helpers';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';

export default function NotifNivel({ rol }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const db = getDB();
  const notificaciones = db.notificacionesNivel || [];

  const totalPendientes = notificaciones.filter(n => n.estado === 'pendiente').length;
  const totalAtendidas = notificaciones.filter(n => n.estado === 'atendida').length;

  const canManage = ['Head Booker', 'Dueño', 'Administrativo'].includes(rol);

  const handleMarcarAtendida = (id) => {
    updateRegistro('notificacionesNivel', id, { estado: 'atendida', fecha_atencion: new Date().toISOString() });
    setRefreshKey(k => k + 1);
  };

  const handleDescartar = (id) => {
    updateRegistro('notificacionesNivel', id, { estado: 'descartada', fecha_atencion: new Date().toISOString() });
    setRefreshKey(k => k + 1);
  };

  const columns = [
    { key: 'id', header: 'ID', size: '70px', mono: true, render: (val) => `#${val}` },
    { key: 'modelo', header: 'Talento Sugerido', render: (_, row) => (
      <div>
        <div style={{ fontWeight: 600 }}>{getPersonaNombre(row.modelo_persona_id)}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-smoke)' }}>
          ID Modelo #{row.modelo_persona_id}
        </div>
      </div>
    )},
    { key: 'score_alcanzado', header: 'Score Evaluado', size: '130px', mono: true, render: (val) => (
      <span style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: '15px' }}>
        {val || '8.2'} / 10.0
      </span>
    )},
    { key: 'corte', header: 'Corte Recomendado', size: '160px', render: () => (
      <span className="badge badge-yellow">Siguiente Escalafón</span>
    )},
    { key: 'estado', header: 'Estado Alerta', size: '120px', render: (val) => (
      <span className={val === 'pendiente' ? 'badge badge-yellow' : val === 'atendida' ? 'badge badge-mint' : 'badge badge-neutral'}>
        {val ? val.toUpperCase() : 'PENDIENTE'}
      </span>
    )},
    { key: 'acciones', header: 'Resolución Humana', size: '190px', render: (_, row) => (
      canManage && row.estado === 'pendiente' ? (
        <div style={{ display: 'flex', gap: '6px' }}>
          <Button
            variant="mint"
            size="sm"
            onClick={() => handleMarcarAtendida(row.id)}
            style={{ fontSize: '11px' }}
          >
            Aprobar Ascenso
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDescartar(row.id)}
            style={{ fontSize: '11px', color: 'var(--color-smoke)' }}
          >
            Descartar
          </Button>
        </div>
      ) : (
        <span style={{ color: 'var(--color-smoke)', fontSize: '12px' }}>Resuelta</span>
      )
    )},
  ];

  return (
    <div key={refreshKey}>
      <div className="page-header page-header-flex">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-tag-mint">SUPERVISIÓN DE ESCALAFÓN</span>
            <span className="header-meta-pill">{totalPendientes} ALERTAS PENDIENTES</span>
          </div>
          <h2 className="page-title">NOTIFICACIONES DE ASCENSO</h2>
          <p className="page-subtitle">
            Detección automática de modelos que cruzan el umbral de score. El ascenso de corte nunca es automático y requiere resolución de Head Booker o Dueño.
          </p>
        </div>
      </div>

      {/* Grid de Estado */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">ALERTAS PENDIENTES</span>
            <span className="badge badge-yellow">REVISIÓN</span>
          </div>
          <div className="stat-value">{totalPendientes}</div>
          <div className="stat-subtext">Requieren atención humana</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">ASCENSOS PROCESADOS</span>
            <span className="badge badge-mint">RESUELTAS</span>
          </div>
          <div className="stat-value">{totalAtendidas}</div>
          <div className="stat-subtext">Histórico de notificaciones atendidas</div>
        </div>
      </div>

      <Table
        columns={columns}
        data={notificaciones}
        emptyMessage="No hay alertas de ascenso pendientes en este momento."
      />
    </div>
  );
}

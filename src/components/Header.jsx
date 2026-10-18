import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IconBell, IconMenu, IconLogout, IconSettings } from './Icons';

export default function Header({ nombre, rol, onLogout, onMenuToggle, onReset, isWorkspace }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);

  const isDueno = rol === 'Dueño';
  const path = location.pathname;
  const parts = path.split('/').filter(Boolean);

  const getBreadcrumb = () => {
    if (isWorkspace) return ['Mi Espacio'];
    if (parts[0] === 'd' && parts[1]) return ['Departamentos', parts[1]];
    if (parts[0] === 'privado') return ['Espacio Privado'];
    return ['Dashboard'];
  };

  const crumbs = getBreadcrumb();
  const showDeptSelector = !isWorkspace && parts[0] === 'd';

  return (
    <header className="header">
      <div className="header-left">
        {!isWorkspace && (
          <button className="mobile-menu-btn" onClick={onMenuToggle} aria-label="Menú">
            <IconMenu size={18} />
          </button>
        )}
        <div className="header-title-container">
          <div className="breadcrumb-trail">
            {crumbs.map((c, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span style={{ margin: '0 6px', opacity: 0.5 }}>›</span>}
                <span className={`breadcrumb-crumb ${i === crumbs.length - 1 ? 'current' : ''}`}>{c}</span>
              </React.Fragment>
            ))}
          </div>
          <h1 className="header-title">
            {isWorkspace ? 'MI ESPACIO' : (parts[parts.length - 1] || 'CRONO').toUpperCase()}
          </h1>
        </div>
      </div>

      <div className="header-user">
        {showDeptSelector && (
          <select
            className="crono-select"
            style={{ padding: '6px 12px', fontSize: '12px' }}
            value={parts[1] || ''}
            onChange={(e) => navigate(`/d/${e.target.value}`)}
          >
            <option value="reclutamiento">Reclutamiento</option>
            <option value="booking">Booking</option>
            <option value="produccion">Producción</option>
            <option value="academia">Academia</option>
            <option value="finanzas">Finanzas</option>
            <option value="admin">Administración</option>
          </select>
        )}

        <button className="btn btn-ghost btn-sm" onClick={() => setShowNotif(!showNotif)} title="Notificaciones">
          <IconBell size={16} />
        </button>

        <div className="user-capsule">
          <div className="user-avatar-editorial">
            {nombre ? nombre.charAt(0).toUpperCase() : 'C'}
          </div>
          <span className="user-name-text">{nombre || 'Usuario'}</span>
          <span className={isDueno ? 'role-tag-yellow' : 'role-tag-mint'}>{rol || 'Sin Rol'}</span>
        </div>

        <button className="btn btn-ghost btn-sm" onClick={onReset} title="Restablecer datos">
          <IconSettings size={16} />
        </button>
        <button className="btn btn-primary btn-sm" onClick={onLogout} title="Cerrar sesión">
          <IconLogout size={16} />
        </button>
      </div>

      {showNotif && (
        <div className="modal-backdrop" onClick={() => setShowNotif(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '16px' }}>Notificaciones</h3>
            <p style={{ color: 'var(--color-smoke)' }}>No hay notificaciones pendientes.</p>
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowNotif(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

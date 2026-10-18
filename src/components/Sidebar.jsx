import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { canAccess } from '../permissions';

// Recursos que habilitan el acceso al área administrativa
const ADMIN_RECURSOS = ['documentos', 'contratos', 'rrhh'];
const puedeAdmin = (roles) => ADMIN_RECURSOS.some(r => canAccess(roles, r));
import {
  IconUser,
  IconBriefcase,
  IconFilm,
  IconBook,
  IconDollar,
  IconSettings,
  IconCamera,
  IconFolder,
  IconBuilding,
  IconScale,
  IconStamp,
  IconLayout,
  IconTarget,
  IconUsers,
  IconShield,
  IconDocument,
} from './Icons';

// Departamentos operativos (no administrativos)
const OPS_NAV = {
  reclutamiento: [
    { path: '/d/reclutamiento/aspirantes', label: 'Aspirantes', Icon: IconUser },
  ],
  booking: [
    { path: '/d/booking/modelos', label: 'Modelos', Icon: IconCamera },
    { path: '/d/booking/clientes', label: 'Clientes', Icon: IconBriefcase },
    { path: '/d/booking/portafolio', label: 'Portafolio', Icon: IconFolder },
    { path: '/d/booking/notifNivel', label: 'Alertas de ascenso', Icon: IconShield },
  ],
  produccion: [
    { path: '/d/produccion/produccion', label: 'Producción', Icon: IconFilm },
    { path: '/d/produccion/recursos', label: 'Recursos', Icon: IconSettings },
  ],
  academia: [
    { path: '/d/academia/academia', label: 'Cursos y matrículas', Icon: IconBook },
    { path: '/d/academia/evaluaciones', label: 'Evaluaciones', Icon: IconTarget },
  ],
  finanzas: [
    { path: '/d/finanzas/agencia', label: 'Agencia', Icon: IconDollar },
    { path: '/d/finanzas/academia', label: 'Academia', Icon: IconDollar },
  ],
};

const DEPT_META = {
  reclutamiento: { title: 'Reclutamiento', sub: 'Aspirantes y entrevistas', Icon: IconUser },
  booking: { title: 'Booking', sub: 'Modelos, clientes y portafolio', Icon: IconCamera },
  produccion: { title: 'Producción', sub: 'Rodajes y recursos', Icon: IconFilm },
  academia: { title: 'Academia', sub: 'Cursos, matrículas y evaluaciones', Icon: IconBook },
  finanzas: { title: 'Finanzas', sub: 'Ingresos, egresos y balance', Icon: IconDollar },
};

// Estructura administrativa (según especificación: departamentos de Google Drive)
const ADMIN_NAV = {
  'ceo-direccion': {
    title: 'CEO y Dirección',
    sub: 'Estrategia, legal e institucional',
    Icon: IconBuilding,
    recurso: 'documentos',
    sections: [
      {
        key: 'legal',
        label: 'Legal',
        Icon: IconScale,
        path: '/d/admin/ceo-direccion/legal',
      },
      {
        key: 'institucional',
        label: 'Documentación institucional',
        Icon: IconDocument,
        path: '/d/admin/ceo-direccion/institucional',
      },
    ],
  },
  contratos: {
    title: 'Contratos firmados',
    sub: 'Contratos de modelos por tipo y fecha',
    Icon: IconStamp,
    recurso: 'contratos',
    // Los tipos de contrato se filtran dentro de la propia página: en el sidebar
    // solo queda la navegación general del módulo.
    sections: [
      { key: 'todos', label: 'Todos los contratos', Icon: IconStamp, path: '/d/admin/contratos/todos' },
    ],
  },
  formatos: {
    title: 'Formatos oficiales',
    sub: 'Logotipos, papelería y plantillas',
    Icon: IconLayout,
    recurso: 'documentos',
    sections: [
      { key: 'logos', label: 'Logotipos', Icon: IconStamp, path: '/d/admin/formatos/logos' },
      { key: 'papeleria', label: 'Papelería corporativa', Icon: IconDocument, path: '/d/admin/formatos/papeleria' },
      {
        key: 'plantillas',
        label: 'Plantillas',
        Icon: IconFolder,
        path: '/d/admin/formatos/plantillas',
      },
      // Funcionalidad preexistente: catálogo de formatos filtrado por rol
      { key: 'catalogo', label: 'Catálogo por rol', Icon: IconFolder, path: '/d/admin/formatos' },
    ],
  },
  'junta-oraculo': {
    title: 'Junta del Oráculo',
    sub: 'Estrategia y minutas de reunión',
    Icon: IconTarget,
    recurso: 'documentos',
    sections: [
      {
        key: 'horizonte',
        label: 'Horizonte Crono',
        Icon: IconTarget,
        path: '/d/admin/junta-oraculo/horizonte',
      },
      { key: 'minutas', label: 'Minutas de reunión', Icon: IconDocument, path: '/d/admin/junta-oraculo/minutas' },
    ],
  },
  'recursos-humanos': {
    title: 'Recursos Humanos',
    sub: 'Trabajadores y accesos',
    Icon: IconUsers,
    recurso: 'rrhh',
    sections: [
      { key: 'trabajadores', label: 'Trabajadores', Icon: IconUsers, path: '/d/admin/recursos-humanos/trabajadores' },
      { key: 'hojas-vida', label: 'Hojas de vida', Icon: IconDocument, path: '/d/admin/recursos-humanos/hojas-vida' },
      { key: 'roles-accesos', label: 'Roles y accesos', Icon: IconShield, path: '/d/admin/recursos-humanos/roles-accesos' },
    ],
  },
};

// Sección inicial de cada departamento
const DEPT_HOME = {
  reclutamiento: '/d/reclutamiento/aspirantes',
  booking: '/d/booking/modelos',
  produccion: '/d/produccion/produccion',
  academia: '/d/academia/academia',
  finanzas: '/d/finanzas/agencia',
  admin: '/d/admin/ceo-direccion/legal',
};

export default function Sidebar({ rol, currentPath, onNavigate, isOpen, onClose }) {
  const { currentUser } = useAuth();
  // Todos los roles del usuario: la navegación se filtra por la unión de permisos.
  const roles = currentUser?.roles?.length ? currentUser.roles : (rol ? [rol] : []);

  // Primer departamento admin al que el rol tiene acceso
  const deptAdminInicial = Object.entries(ADMIN_NAV)
    .find(([, cfg]) => canAccess(roles, cfg.recurso));
  const homeAdmin = deptAdminInicial
    ? deptAdminInicial[1].sections[0].path
    : '/d/admin';

  const parts = currentPath.split('/').filter(Boolean);
  const dept = parts[1] || '';
  const isAdmin = dept === 'admin';
  const adminKey = isAdmin ? parts[2] : null;

  const nav = (path) => {
    onNavigate(path);
    onClose();
  };

  const isActive = (path) => currentPath === path;

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand-title">CRONO</div>
        <div className="sidebar-brand-desc">{isAdmin ? 'ADMINISTRACIÓN' : 'DEPARTAMENTOS'}</div>
      </div>

      <nav className="sidebar-nav">
        {/* --- Vista de lista de departamentos (cuando no hay dept activo) --- */}
        {!dept && (
          <div className="nav-section">
            <div className="nav-section-title">Departamentos</div>
            {Object.entries(DEPT_META).map(([key, meta]) => (
              <button
                key={key}
                className="nav-item"
                onClick={() => nav(DEPT_HOME[key])}
              >
                <meta.Icon size={15} />
                <span>{meta.title}</span>
              </button>
            ))}
            {puedeAdmin(roles) && (
              <button
                className={`nav-item ${isActive('/d/admin/ceo-direccion/legal') ? 'active' : ''}`}
                onClick={() => nav(homeAdmin)}
              >
                <IconBuilding size={15} />
                <span>Administración</span>
              </button>
            )}
          </div>
        )}

        {/* --- Departamentos operativos --- */}
        {!isAdmin && OPS_NAV[dept] && (
          <>
            <div className="nav-section">
              <div className="nav-section-title">{DEPT_META[dept]?.title || dept}</div>
              {OPS_NAV[dept].map(item => (
                <button
                  key={item.path}
                  className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => nav(item.path)}
                >
                  <item.Icon size={15} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <div className="nav-section">
              <div className="nav-section-title">Cambiar de departamento</div>
              {Object.entries(DEPT_META)
                .filter(([key]) => key !== dept)
                .map(([key, meta]) => (
                  <button key={key} className="nav-item" onClick={() => nav(DEPT_HOME[key])}>
                    <meta.Icon size={15} />
                    <span>{meta.title}</span>
                  </button>
                ))}
              {puedeAdmin(roles) && (
                <button className="nav-item" onClick={() => nav(homeAdmin)}>
                  <IconBuilding size={15} />
                  <span>Administración</span>
                </button>
              )}
            </div>
          </>
        )}

        {/* --- Departamento administrativo --- */}
        {isAdmin && (
          <>
            <div className="nav-section">
              <div className="nav-section-title">Departamentos</div>
              {Object.entries(ADMIN_NAV)
                .filter(([, cfg]) => canAccess(roles, cfg.recurso))
                .map(([key, cfg]) => {
                  const firstPath = cfg.sections[0].path;
                  const isCurrent = adminKey === key;
                  return (
                    <button
                      key={key}
                      className={`nav-item ${isCurrent ? 'active' : ''}`}
                      onClick={() => nav(firstPath)}
                      title={cfg.title}
                    >
                      <cfg.Icon size={15} />
                      <span>{cfg.title}</span>
                    </button>
                  );
                })}
            </div>

            {adminKey && ADMIN_NAV[adminKey] && canAccess(roles, ADMIN_NAV[adminKey].recurso) && (() => {
              const secciones = ADMIN_NAV[adminKey].sections;
              // Sección activa: la ruta más larga que coincida con la ruta actual
              const activa = secciones
                .filter(s => currentPath === s.path || currentPath.startsWith(s.path + '/'))
                .sort((a, b) => b.path.length - a.path.length)[0];

              return (
                <div className="nav-section">
                  <div className="nav-section-title">{ADMIN_NAV[adminKey].title}</div>
                  {secciones.map(section => (
                    <button
                      key={section.key}
                      className={`nav-item ${activa?.key === section.key ? 'active' : ''}`}
                      onClick={() => nav(section.path)}
                    >
                      <section.Icon size={15} />
                      <span>{section.label}</span>
                    </button>
                  ))}
                </div>
              );
            })()}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <span>© 2026</span>
        <span className={`role-tag ${currentUser?.rol === 'Dueño' ? 'role-tag-yellow' : 'role-tag-mint'}`}>
          {rol}
        </span>
      </div>
    </aside>
  );
}

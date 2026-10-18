import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { canAccess, userRoles } from '../permissions';
import { getDB } from '../db';
import { Button } from '../components/ui/Button';
import {
  IconBuilding, IconStamp, IconLayout, IconTarget, IconUsers, IconScale,
} from '../components/Icons';

const ADMIN_DEPTS = [
  {
    key: 'ceo-direccion',
    label: 'CEO y Dirección',
    sub: 'Documentación legal, institucional y estratégica de la agencia.',
    Icon: IconBuilding,
    path: '/d/admin/ceo-direccion/legal',
    recurso: 'documentos',
  },
  {
    key: 'contratos',
    label: 'Contratos firmados',
    sub: 'Contratos de colaboración, exclusividad, representación y vinculación.',
    Icon: IconStamp,
    path: '/d/admin/contratos/todos',
    recurso: 'contratos',
  },
  {
    key: 'formatos',
    label: 'Formatos oficiales',
    sub: 'Logotipos, papelería corporativa y plantillas institucionales.',
    Icon: IconLayout,
    path: '/d/admin/formatos/logos',
    recurso: 'documentos',
  },
  {
    key: 'junta-oraculo',
    label: 'Junta del Oráculo',
    sub: 'Horizonte Crono y archivo histórico de minutas de reunión.',
    Icon: IconTarget,
    path: '/d/admin/junta-oraculo/horizonte',
    recurso: 'documentos',
  },
  {
    key: 'recursos-humanos',
    label: 'Recursos Humanos',
    sub: 'Directorio de trabajadores, hojas de vida y gestión de accesos.',
    Icon: IconUsers,
    path: '/d/admin/recursos-humanos/trabajadores',
    recurso: 'rrhh',
  },
];

export default function AdminIndex() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const rol = currentUser?.rol;

  const db = getDB();
  const conteos = {
    'ceo-direccion': (db.documentos || []).filter(d => d.departamento === 'ceo-direccion').length,
    contratos: (db.contratos || []).length,
    formatos: (db.documentos || []).filter(d => d.departamento === 'formatos').length,
    'junta-oraculo': (db.documentos || []).filter(d => d.departamento === 'junta-oraculo').length,
    'recursos-humanos': (db.staff || []).length,
  };

  const visibles = ADMIN_DEPTS.filter(d => canAccess(userRoles(currentUser), d.recurso));

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span className="role-tag-mint">ADMINISTRACIÓN</span>
          <span className="header-meta-pill">MÓDULOS ADMINISTRATIVOS</span>
        </div>
        <h2 className="page-title">ADMINISTRACIÓN CRONO</h2>
        <p className="page-subtitle">
          Departamentos organizados según la estructura funcional del área administrativa.
          Cada uno contiene sus categorías y documentos.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {visibles.map(dept => (
          <div
            key={dept.key}
            className="card"
            role="button"
            tabIndex={0}
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(dept.path)}
            onKeyDown={(e) => { if (e.key === 'Enter') navigate(dept.path); }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '20px' }}>
              <div style={{
                width: '44px', height: '44px', flexShrink: 0,
                border: '1px solid var(--color-ash)', borderRadius: '6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-carbon-black)',
              }}>
                <dept.Icon size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>
                    {dept.label}
                  </h3>
                  <span className="badge badge-neutral">{conteos[dept.key] ?? 0}</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--color-smoke)', margin: '6px 0 0', lineHeight: '1.5' }}>
                  {dept.sub}
                </p>
                <div style={{ marginTop: '12px' }}>
                  <Button variant="outline" size="sm">Abrir departamento</Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {visibles.length === 0 && (
        <div className="card">
          <div className="card-content" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <IconScale size={28} />
            <p style={{ marginTop: '10px', color: 'var(--color-smoke)', fontSize: '13px' }}>
              Tu rol ({rol}) no tiene acceso a los departamentos administrativos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

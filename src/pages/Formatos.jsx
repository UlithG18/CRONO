import React from 'react';
import { getDB } from '../db';
import { useAuth } from '../auth';
import { userRoles } from '../permissions';
import { Button } from '../components/ui/Button';

export default function Formatos({ rol: rolProp }) {
  const { currentUser } = useAuth();
  const db = getDB();
  const formatos = db.formatosOficiales || [];

  // El rol puede venir como prop o desde la sesión; con varios roles se
  // muestran los formatos visibles para cualquiera de ellos (igual que el backend).
  const rol = rolProp || currentUser?.rol;
  const roles = userRoles(currentUser);
  const etiquetaRoles = roles.length > 1 ? roles.join(' · ') : rol;

  const formatosVisibles = formatos.filter((f) => {
    if (roles.includes('Dueño') || roles.includes('Administrativo')) return true;
    return Array.isArray(f.roles) && f.roles.some(r => roles.includes(r));
  });

  return (
    <div>
      <div className="page-header page-header-flex">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-tag-mint">REPOSITORIO DOCUMENTAL</span>
            <span className="header-meta-pill">FILTRADO POR ROL ({etiquetaRoles || 'sin rol'})</span>
          </div>
          <h2 className="page-title">FORMATOS OFICIALES</h2>
          <p className="page-subtitle">
            Plantillas institucionales, minutas contractuales y formularios autorizados para tu función operativa.
          </p>
        </div>
      </div>

      {formatosVisibles.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', maxWidth: '600px', margin: '32px auto' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-smoke)', marginBottom: '8px' }}>
            DOCUMENTACIÓN INSTITUCIONAL
          </div>
          <h3 style={{ fontSize: '24px', marginBottom: '12px' }}>SIN FORMATOS ASIGNADOS</h3>
          <p style={{ color: 'var(--color-slate)' }}>
            No hay plantillas oficiales asignadas para el rol <strong>{rol}</strong> en el catálogo activo de Crono.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {formatosVisibles.map((f, idx) => (
            <div key={f.id || idx} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span className="badge badge-neutral">{f.categoria || 'Plantilla'}</span>
                  <span className="badge badge-black">OFICIAL</span>
                </div>
                <h3 style={{ fontSize: '20px', lineHeight: 1.1, marginBottom: '8px' }}>{f.nombre}</h3>
                <p style={{ fontSize: '13px', color: 'var(--color-slate)', lineHeight: 1.5 }}>
                  Formato regulado para operaciones de {f.categoria}. Disponible para descarga y firma digital.
                </p>
              </div>

              <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--color-mist-gray)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-smoke)' }}>
                  ID #FMT-{f.id || idx + 1}
                </span>
                <Button variant="outline" size="sm" style={{ fontSize: '11px' }}>
                  Descargar Plantilla &darr;
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

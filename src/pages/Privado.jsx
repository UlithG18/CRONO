import React, { useState } from 'react';
import { getDB, addRegistro } from '../db';
import { today } from '../helpers';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function Privado({ rol }) {
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const esDueno = rol === 'Dueño';

  if (!esDueno) {
    return (
      <div className="card" style={{ padding: '48px', textAlign: 'center', maxWidth: '700px', margin: '40px auto' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-danger)', marginBottom: '8px' }}>
          BLOQUEO ROW-LEVEL SECURITY [RLS]
        </div>
        <h2 style={{ fontSize: '36px', marginBottom: '16px' }}>ESPACIO RESTRINGIDO AL DUEÑO</h2>
        <p style={{ color: 'var(--color-slate)', lineHeight: 1.6 }}>
          Este módulo está protegido por directivas estrictas de aislamiento de datos en SQL Server.
          Solo el usuario propietario principal (Jun Osorio) tiene autorización para consultar o crear notas privadas.
        </p>
      </div>
    );
  }

  const db = getDB();
  const notas = db.espacioPrivado || [];

  const handleAgregar = (e) => {
    e.preventDefault();
    if (!titulo.trim() || !contenido.trim()) return;

    addRegistro('espacioPrivado', {
      fecha: today(),
      titulo: titulo.trim(),
      contenido: contenido.trim(),
    });

    setTitulo('');
    setContenido('');
    setRefreshKey(k => k + 1);
  };

  return (
    <div key={refreshKey}>
      <div className="page-header page-header-flex">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-tag-yellow">PRIVACIDAD MÁXIMA</span>
            <span className="header-meta-pill">ROW-LEVEL SECURITY ACTIVADO</span>
          </div>
          <h2 className="page-title">ESPACIO DE JUN // PRIVADO</h2>
          <p className="page-subtitle">
            Bitácora estratégica confidencial y notas reservadas exclusivamente para la dirección ejecutiva.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px', backgroundColor: 'var(--color-mist-gray)' }}>
        <div className="card-header">
          <h3 className="card-title">NUEVA ENTRADA ESTRATÉGICA</h3>
          <span className="badge badge-black">CONFIDENCIAL</span>
        </div>

        <form onSubmit={handleAgregar}>
          <div style={{ marginBottom: '12px' }}>
            <Input
              label="Título del Asunto"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Estrategia de Expansión París Fashion Week"
              required
            />
          </div>

          <div>
            <label className="form-label">Contenido Reservado</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              placeholder="Reflexiones, contactos clave, presupuestos confidenciales..."
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button type="submit" variant="primary">
              Guardar en Espacio Seguro
            </Button>
          </div>
        </form>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {notas.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-smoke)' }}>
            No hay notas privadas guardadas aún.
          </div>
        ) : (
          notas.map((n, idx) => (
            <div key={n.id || idx} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="badge badge-yellow">NOTA CONFIDENCIAL</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-smoke)' }}>
                  {n.fecha}
                </span>
              </div>
              <h3 style={{ fontSize: '22px', marginBottom: '8px' }}>{n.titulo}</h3>
              <p style={{ color: 'var(--color-slate)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {n.contenido}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

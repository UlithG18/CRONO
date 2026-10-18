import React, { useState } from 'react';
import { getDB, getPersonaNombre, updateRegistro, addRegistro, STAFF } from '../db';
import { cortesHistorial, corteActual, scoreGeneral, CORTES, cop, today } from '../helpers';
import { useAuth } from '../auth';
import { canAccess, userRoles } from '../permissions';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Table } from '../components/ui/Table';

const GENEROS = ['female', 'male', 'non-binary'];
const ENFOQUES = ['moda', 'comercial', 'lifestyle', 'editorial', 'pasarela'];

export default function Modelos() {
  const { currentUser } = useAuth();
  const [selectedPersonaId, setSelectedPersonaId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCorte, setFilterCorte] = useState('Todos');
  const [reloadKey, setReloadKey] = useState(0);

  const [formModelo, setFormModelo] = useState({
    nombre_completo: '',
    nombre_artistico: '',
    genero: 'female',
    rasgo_distintivo: '',
    enfoque: 'moda',
    fecha_inicio: today(),
    corte_inicial_id: '1',
    booker_persona_id: '15',
  });

  const rol = currentUser?.rol;
  const canManage = canAccess(userRoles(currentUser), 'modelos', 'write');
  const isBooker = rol === 'Booker';

  function loadData() {
    const db = getDB();
    const modelosRol = (db.rolPersonas || []).filter(r => r.tipo_rol_id === 2 && !r.fecha_fin);
    const bookersStaff = STAFF.filter(s => s.rol === 'Booker' || s.rol === 'Head Booker');

    const list = modelosRol.map(rp => {
      const modelo = (db.modelo || []).find(m => m.persona_id === rp.persona_id) || {};
      const corte = corteActual(rp.persona_id, db.corteHistorial || [], db.cortes || []);
      const score = scoreGeneral(rp.persona_id, db.habilidadActual || []);
      const asignacion = (db.asignacionesBooker || []).find(
        a => a.modelo_persona_id === rp.persona_id && a.activo
      );
      const booker = asignacion ? bookersStaff.find(b => b.persona_id === asignacion.booker_persona_id) : null;

      return {
        persona_id: rp.persona_id,
        nombre: getPersonaNombre(rp.persona_id),
        nombre_artistico: modelo.nombre_artistico || '—',
        genero: modelo.genero || '—',
        rasgo_distintivo: modelo.rasgo_distintivo || '—',
        enfoque: modelo.enfoque || '—',
        corte_nombre: corte ? corte.nombre : 'Delta',
        corte_id: corte ? corte.id : 1,
        booker_nombre: booker ? booker.nombre : 'Sin asignar',
        booker_persona_id: asignacion ? asignacion.booker_persona_id : null,
        score: score != null ? score.toFixed(1) : '—',
        fecha_inicio: rp.fecha_inicio,
      };
    });

    if (isBooker) {
      return list.filter(m => m.booker_persona_id === currentUser?.persona_id);
    }
    return list;
  }

  const modelos = loadData();

  const handleAddModelo = (e) => {
    e.preventDefault();
    if (!formModelo.nombre_completo.trim()) return;

    const fechaHoy = formModelo.fecha_inicio || today();

    const persona = addRegistro('personas', {
      nombre_completo: formModelo.nombre_completo.trim(),
      fecha_creacion: fechaHoy,
    });

    addRegistro('modelo', {
      persona_id: persona.id,
      nombre_artistico: formModelo.nombre_artistico.trim() || formModelo.nombre_completo.trim(),
      genero: formModelo.genero,
      rasgo_distintivo: formModelo.rasgo_distintivo.trim(),
      enfoque: formModelo.enfoque,
      fecha_inicio_agencia: fechaHoy,
    });

    addRegistro('rolPersonas', {
      persona_id: persona.id,
      tipo_rol_id: 2,
      fecha_inicio: fechaHoy,
      fecha_fin: null,
    });

    addRegistro('corteHistorial', {
      modelo_persona_id: persona.id,
      corte_id: Number(formModelo.corte_inicial_id),
      fecha_asignacion: fechaHoy,
    });

    if (formModelo.booker_persona_id) {
      addRegistro('asignacionesBooker', {
        modelo_persona_id: persona.id,
        booker_persona_id: Number(formModelo.booker_persona_id),
        fecha_asignacion: fechaHoy,
        activo: true,
      });
    }

    setFormModelo({
      nombre_completo: '',
      nombre_artistico: '',
      genero: 'female',
      rasgo_distintivo: '',
      enfoque: 'moda',
      fecha_inicio: today(),
      corte_inicial_id: '1',
      booker_persona_id: '15',
    });
    setShowAddForm(false);
    setReloadKey(k => k + 1);
  };

  const handleReasignarBooker = (modeloPersonaId, nuevoBookerId) => {
    if (!canManage) return;
    const db = getDB();
    const hoy = today();
    if (db.asignacionesBooker) {
      db.asignacionesBooker.forEach(a => {
        if (a.modelo_persona_id === modeloPersonaId && a.activo) {
          a.activo = false;
        }
      });
    }
    if (nuevoBookerId) {
      db.asignacionesBooker.push({
        id: Date.now(),
        modelo_persona_id: modeloPersonaId,
        booker_persona_id: Number(nuevoBookerId),
        fecha_asignacion: hoy,
        activo: true,
      });
    }
    saveDB(db);
    setReloadKey(k => k + 1);
  };

  const filteredModelos = modelos.filter(m => {
    const matchesSearch = m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.nombre_artistico.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCorte = filterCorte === 'Todos' || m.corte_nombre === filterCorte;
    return matchesSearch && matchesCorte;
  });

  const selectedModelo = modelos.find(m => m.persona_id === selectedPersonaId);
  const db = getDB();
  const historialCortes = selectedModelo ? cortesHistorial(selectedModelo.persona_id, db.corteHistorial || [], db.cortes || []) : [];

  const columns = [
    { key: 'persona_id', header: 'ID', size: '70px', mono: true, render: (val) => `#${val}` },
    { key: 'nombre_artistico', header: 'Talento', render: (val, row) => (
      <div>
        <div style={{ fontWeight: 600 }}>{val}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-smoke)' }}>
          {row.nombre} • {row.genero}
        </div>
      </div>
    )},
    { key: 'corte_nombre', header: 'Corte', size: '140px', render: (val) => (
      <span className={val.includes('Beta') ? 'badge badge-yellow' : val.includes('Musa') ? 'badge badge-mint' : 'badge badge-neutral'}>
        {val}
      </span>
    )},
    { key: 'score', header: 'Score', size: '90px', mono: true, render: (val) => (
      <span style={{ fontWeight: 700, color: Number(val) >= 8.0 ? 'var(--color-success)' : 'inherit' }}>
        {val}
      </span>
    )},
    { key: 'booker_nombre', header: 'Booker', size: '160px', render: (val) => (
      <span style={{ fontSize: '13px', color: 'var(--color-slate)' }}>{val}</span>
    )},
    { key: 'acciones', header: 'Detalle', size: '100px', render: (_, row) => (
      <Button variant="outline" size="sm" onClick={() => setSelectedPersonaId(row.persona_id)} style={{ fontSize: '11px' }}>
        Ficha →
      </Button>
    )},
  ];

  return (
    <div key={reloadKey}>
      <div className="page-header page-header-flex">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-tag-mint">AGENCY TALENT</span>
            <span className="header-meta-pill">
              {isBooker ? 'CARTERA ASIGNADA' : 'CATÁLOGO GENERAL'} • {filteredModelos.length} MODELOS
            </span>
          </div>
          <h2 className="page-title">CATÁLOGO DE MODELOS</h2>
          <p className="page-subtitle">Gestión de talentos vinculados, trayectoria de cortes y asignación de bookers.</p>
        </div>
        {canManage && (
          <Button variant="primary" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cerrar' : '+ Vincular Modelo'}
          </Button>
        )}
      </div>

      {showAddForm && canManage && (
        <div className="card" style={{ marginBottom: '24px', backgroundColor: 'var(--color-mist-gray)' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">VINCULACIÓN DE MODELO</h3>
              <div className="card-subtitle">Creación de ficha técnica e ingreso al roster</div>
            </div>
            <span className="badge badge-black">AGENCY</span>
          </div>
          <form onSubmit={handleAddModelo}>
            <div className="form-grid-3">
              <Input label="Nombre Real" value={formModelo.nombre_completo} onChange={(e) => setFormModelo({ ...formModelo, nombre_completo: e.target.value })} placeholder="Ej. Valentina Ríos" required />
              <Input label="Nombre Artístico" value={formModelo.nombre_artistico} onChange={(e) => setFormModelo({ ...formModelo, nombre_artistico: e.target.value })} placeholder="Ej. Valentina R." />
              <Select label="Género" value={formModelo.genero} onChange={(e) => setFormModelo({ ...formModelo, genero: e.target.value })} options={GENEROS} />
            </div>
            <div className="form-grid-3" style={{ marginTop: '12px' }}>
              <Input label="Rasgo Distintivo" value={formModelo.rasgo_distintivo} onChange={(e) => setFormModelo({ ...formModelo, rasgo_distintivo: e.target.value })} placeholder="Ej. Morena, pecas" />
              <Select label="Enfoque" value={formModelo.enfoque} onChange={(e) => setFormModelo({ ...formModelo, enfoque: e.target.value })} options={ENFOQUES} />
              <Select label="Booker" value={formModelo.booker_persona_id} onChange={(e) => setFormModelo({ ...formModelo, booker_persona_id: e.target.value })} options={STAFF.filter(s => s.rol === 'Booker' || s.rol === 'Head Booker').map(s => ({ value: String(s.persona_id), label: `${s.nombre} (${s.rol})` }))} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)}>Cancelar</Button>
              <Button type="submit" variant="primary">Guardar</Button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: '16px 20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['Todos', ...CORTES.slice(0, 5)].map(c => (
              <button key={c} type="button" className={`btn btn-sm ${filterCorte === c ? 'btn-primary' : 'btn-ghost'}`} style={{ borderRadius: 'var(--radius-tag)' }} onClick={() => setFilterCorte(c)}>
                {c}
              </button>
            ))}
          </div>
          <div style={{ width: '280px' }}>
            <input type="text" className="crono-input" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '6px 12px', fontSize: '13px' }} />
          </div>
        </div>
      </div>

      <Table columns={columns} data={filteredModelos} emptyMessage="No hay modelos que coincidan." />

      {selectedModelo && (
        <div className="modal-backdrop" onClick={() => setSelectedPersonaId(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span className="badge badge-mint" style={{ marginBottom: '6px' }}>FICHA #{selectedModelo.persona_id}</span>
                <h3 style={{ fontSize: '32px' }}>{selectedModelo.nombre_artistico}</h3>
                <p style={{ color: 'var(--color-smoke)' }}>{selectedModelo.nombre}</p>
              </div>
              <button type="button" className="btn btn-ghost" onClick={() => setSelectedPersonaId(null)} style={{ fontSize: '20px', padding: '4px 8px' }}>×</button>
            </div>

            <div className="form-grid-2" style={{ marginBottom: '20px' }}>
              <div className="card" style={{ padding: '16px', backgroundColor: 'var(--color-mist-gray)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-smoke)' }}>SCORE</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 800 }}>{selectedModelo.score}</div>
              </div>
              <div className="card" style={{ padding: '16px', backgroundColor: 'var(--color-mist-gray)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-smoke)' }}>CORTE</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 800 }}>{selectedModelo.corte_nombre}</div>
              </div>
            </div>

            {canManage && (
              <div style={{ marginBottom: '20px', padding: '16px', border: '1px solid var(--color-ash)', borderRadius: '16px' }}>
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>REASIGNAR BOOKER</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select className="crono-select" defaultValue={selectedModelo.booker_persona_id || ''} onChange={(e) => handleReasignarBooker(selectedModelo.persona_id, e.target.value)}>
                    <option value="">Sin Booker</option>
                    {STAFF.filter(s => s.rol === 'Booker' || s.rol === 'Head Booker').map(b => (
                      <option key={b.persona_id} value={b.persona_id}>{b.nombre} ({b.rol})</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-smoke)', marginBottom: '8px', textTransform: 'uppercase' }}>HISTORIAL DE CORTES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {historialCortes.length === 0 ? (
                  <div style={{ color: 'var(--color-smoke)', fontSize: '13px' }}>Sin ascensos previos.</div>
                ) : (
                  historialCortes.map((h, i) => (
                    <div key={h.id || i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--color-mist-gray)', borderRadius: '8px', fontSize: '13px' }}>
                      <span style={{ fontWeight: 600 }}>{h.corte_nombre}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-smoke)' }}>{h.fecha_asignacion}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" onClick={() => setSelectedPersonaId(null)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function saveDB(db) {
  localStorage.setItem('crono_db', JSON.stringify(db));
}

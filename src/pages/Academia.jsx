import React, { useState } from 'react';
import { getDB, getPersonaNombre, updateRegistro, addRegistro } from '../db';
import { cop, today } from '../helpers';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Table } from '../components/ui/Table';

const MODALIDADES = ['Cohorte', 'Continuo'];

export default function Academia({ rol }) {
  const [reloadKey, setReloadKey] = useState(0);
  const [showFormCurso, setShowFormCurso] = useState(false);
  const [showFormMatricula, setShowFormMatricula] = useState(false);
  const [selectedCursoId, setSelectedCursoId] = useState('all');

  const [formCurso, setFormCurso] = useState({
    nombre: '',
    modalidad: 'Cohorte',
    descripcion: '',
  });

  const [formMatricula, setFormMatricula] = useState({
    nombre_estudiante: '',
    curso_id: '1',
    valor_acordado: '1200000',
    num_cuotas: '3',
  });

  const isTesoreroAcademia = rol === 'Tesorería Academia';
  const isDueno = rol === 'Dueño';
  const isAdmin = rol === 'Administrativo';
  const canManageCursos = isDueno || isAdmin;
  const canPagar = isTesoreroAcademia || isDueno || isAdmin;

  function loadData() {
    const db = getDB();
    const cursos = db.cursos || [];
    const matriculas = db.matriculas || [];
    return { cursos, matriculas };
  }

  const { cursos, matriculas } = loadData();
  const matriculasActivas = matriculas.filter(m => m.estado === 'Activo');

  const totalRecaudado = matriculasActivas.reduce((sum, m) => {
    const pagado = (m.cuotas || [])
      .filter(c => c.estado === 'Pagado')
      .reduce((s, c) => s + c.valor, 0);
    return sum + pagado;
  }, 0);

  const totalPendiente = matriculasActivas.reduce((sum, m) => {
    const pend = (m.cuotas || [])
      .filter(c => c.estado === 'Pendiente')
      .reduce((s, c) => s + c.valor, 0);
    return sum + pend;
  }, 0);

  const handlePagarCuota = (matriculaId, cuotaNum) => {
    const db = getDB();
    const mat = (db.matriculas || []).find(m => m.id === matriculaId);
    if (!mat) return;

    const cuota = (mat.cuotas || []).find(c => c.numero === cuotaNum);
    if (!cuota || cuota.estado === 'Pagado') return;

    cuota.estado = 'Pagado';
    cuota.fecha_pago = today();

    // Asentar en transacciones financieras de Academia
    addRegistro('transacciones', {
      fecha: today(),
      tipo: 'Ingreso',
      concepto: `Pago Cuota ${cuotaNum}/${mat.cuotas.length} — Matrícula #${mat.id}`,
      valor: cuota.valor,
      division: 'Academia',
      estado_pago: 'Completo',
    });

    updateRegistro('matriculas', matriculaId, { cuotas: mat.cuotas });
    setReloadKey(k => k + 1);
  };

  const handleAddCurso = (e) => {
    e.preventDefault();
    if (!formCurso.nombre.trim()) return;

    addRegistro('cursos', {
      nombre: formCurso.nombre.trim(),
      modalidad: formCurso.modalidad,
      descripcion: formCurso.descripcion.trim(),
    });

    setFormCurso({ nombre: '', modalidad: 'Cohorte', descripcion: '' });
    setShowFormCurso(false);
    setReloadKey(k => k + 1);
  };

  const handleAddMatricula = (e) => {
    e.preventDefault();
    if (!formMatricula.nombre_estudiante.trim() || !formMatricula.valor_acordado) return;

    const hoy = today();
    const persona = addRegistro('personas', {
      nombre_completo: formMatricula.nombre_estudiante.trim(),
      fecha_creacion: hoy,
    });

    addRegistro('rolPersonas', {
      persona_id: persona.id,
      tipo_rol_id: 4, // Estudiante
      fecha_inicio: hoy,
      fecha_fin: null,
    });

    const val = Number(formMatricula.valor_acordado);
    const nCuotas = Number(formMatricula.num_cuotas) || 1;
    const valorCuota = Math.round(val / nCuotas);

    const cuotas = [];
    for (let i = 1; i <= nCuotas; i++) {
      cuotas.push({
        numero: i,
        valor: valorCuota,
        estado: i === 1 ? 'Pagado' : 'Pendiente',
        fecha_pago: i === 1 ? hoy : null,
      });
    }

    // Registrar cuota 1 en finanzas
    addRegistro('transacciones', {
      fecha: hoy,
      tipo: 'Ingreso',
      concepto: `Cuota Inicial Matrícula — ${persona.nombre_completo}`,
      valor: valorCuota,
      division: 'Academia',
      estado_pago: 'Completo',
    });

    addRegistro('matriculas', {
      estudiante_persona_id: persona.id,
      curso_id: Number(formMatricula.curso_id),
      fecha_matricula: hoy,
      valor_acordado: val,
      estado: 'Activo',
      cuotas: cuotas,
    });

    setFormMatricula({
      nombre_estudiante: '',
      curso_id: '1',
      valor_acordado: '1200000',
      num_cuotas: '3',
    });
    setShowFormMatricula(false);
    setReloadKey(k => k + 1);
  };

  const filteredMatriculas = selectedCursoId === 'all'
    ? matriculasActivas
    : matriculasActivas.filter(m => m.curso_id === Number(selectedCursoId));

  const columns = [
    { key: 'id', header: 'Matrícula', size: '100px', mono: true, render: (val) => `#MAT-${val}` },
    { key: 'estudiante', header: 'Estudiante', render: (_, row) => (
      <div>
        <div style={{ fontWeight: 600 }}>{getPersonaNombre(row.estudiante_persona_id)}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-smoke)' }}>
          ID Alumno #{row.estudiante_persona_id}
        </div>
      </div>
    )},
    { key: 'curso_id', header: 'Curso', size: '180px', render: (val) => {
      const c = cursos.find(x => x.id === val);
      return <span className="badge badge-neutral">{c ? c.nombre : `Curso #${val}`}</span>;
    }},
    { key: 'valor_acordado', header: 'Plan Total', size: '130px', mono: true, render: (val) => cop(val) },
    { key: 'cuotas', header: 'Estado de Cuotas', render: (_, row) => (
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {(row.cuotas || []).map(c => (
          <div
            key={c.numero}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: c.estado === 'Pagado' ? 'var(--color-mint-chip)' : 'var(--color-mist-gray)',
              border: '1px solid var(--color-ash)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span>C{c.numero}: {c.estado}</span>
            {c.estado === 'Pendiente' && canPagar && (
              <button
                type="button"
                onClick={() => handlePagarCuota(row.id, c.numero)}
                style={{
                  background: 'var(--color-carbon-black)',
                  color: 'white',
                  borderRadius: '4px',
                  padding: '2px 5px',
                  fontSize: '9px',
                  cursor: 'pointer',
                }}
              >
                Cobrar
              </button>
            )}
          </div>
        ))}
      </div>
    )},
  ];

  return (
    <div key={reloadKey}>
      <div className="page-header page-header-flex">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-tag-mint">CRONO MODELS</span>
            <span className="header-meta-pill">{cursos.length} CURSOS ACTIVOS</span>
          </div>
          <h2 className="page-title">ACADEMIA DE FORMACIÓN</h2>
          <p className="page-subtitle">
            Cursos formativos, cohortes académicas y planes de pago estructurados.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {canManageCursos && (
            <Button variant="outline" onClick={() => setShowFormCurso(!showFormCurso)}>
              {showFormCurso ? 'Cerrar' : '+ Nuevo Curso'}
            </Button>
          )}
          {canManageCursos && (
            <Button variant="primary" onClick={() => setShowFormMatricula(!showFormMatricula)}>
              {showFormMatricula ? 'Cerrar' : '+ Nueva Matrícula'}
            </Button>
          )}
        </div>
      </div>

      {/* Métricas de Academia */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">CURSOS OFERTADOS</span>
            <span className="badge badge-mint">ACADEMIA</span>
          </div>
          <div className="stat-value">{cursos.length}</div>
          <div className="stat-subtext">Pasarela, Book, Oráculo</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">ALUMNOS MATRICULADOS</span>
            <span className="badge badge-blue">ACTIVOS</span>
          </div>
          <div className="stat-value">{matriculasActivas.length}</div>
          <div className="stat-subtext">Estudiantes en formación</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">RECAUDO ACADÉMICO</span>
            <span className="badge badge-mint">INGRESOS</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>{cop(totalRecaudado)}</div>
          <div className="stat-subtext">Cuotas cobradas con éxito</div>
        </div>

        <div className="stat-card inverted">
          <div className="stat-header">
            <span className="stat-label">CARTERA POR COBRAR</span>
            <span className="badge badge-yellow">PENDIENTE</span>
          </div>
          <div className="stat-value" style={{ color: '#ffffff' }}>{cop(totalPendiente)}</div>
          <div className="stat-subtext" style={{ color: 'var(--color-smoke)' }}>Cuotas pendientes de pago</div>
        </div>
      </div>

      {/* Formulario de Curso */}
      {showFormCurso && (
        <div className="card" style={{ marginBottom: '24px', backgroundColor: 'var(--color-mist-gray)' }}>
          <div className="card-header">
            <h3 className="card-title">CREAR NUEVO PROGRAMA FORMATIVO</h3>
            <span className="badge badge-black">CURSO</span>
          </div>
          <form onSubmit={handleAddCurso}>
            <div className="form-grid-3">
              <Input
                label="Nombre del Curso"
                value={formCurso.nombre}
                onChange={(e) => setFormCurso({ ...formCurso, nombre: e.target.value })}
                placeholder="Ej. Fotopose & Expresión Corporal"
                required
              />
              <Select
                label="Modalidad"
                value={formCurso.modalidad}
                onChange={(e) => setFormCurso({ ...formCurso, modalidad: e.target.value })}
                options={MODALIDADES}
              />
              <Input
                label="Descripción Breve"
                value={formCurso.descripcion}
                onChange={(e) => setFormCurso({ ...formCurso, descripcion: e.target.value })}
                placeholder="Enfoque de 8 semanas..."
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button type="button" variant="ghost" onClick={() => setShowFormCurso(false)}>Cancelar</Button>
              <Button type="submit" variant="primary">Guardar Programa</Button>
            </div>
          </form>
        </div>
      )}

      {/* Formulario de Matrícula */}
      {showFormMatricula && (
        <div className="card" style={{ marginBottom: '24px', backgroundColor: 'var(--color-mist-gray)' }}>
          <div className="card-header">
            <h3 className="card-title">MATRICULAR NUEVO ESTUDIANTE</h3>
            <span className="badge badge-black">MATRÍCULA &bull; CUOTAS</span>
          </div>
          <form onSubmit={handleAddMatricula}>
            <div className="form-grid-2">
              <Input
                label="Nombre del Estudiante"
                value={formMatricula.nombre_estudiante}
                onChange={(e) => setFormMatricula({ ...formMatricula, nombre_estudiante: e.target.value })}
                placeholder="Ej. Isabella Ramos"
                required
              />
              <Select
                label="Programa Seleccionado"
                value={formMatricula.curso_id}
                onChange={(e) => setFormMatricula({ ...formMatricula, curso_id: e.target.value })}
                options={cursos.map(c => ({ value: String(c.id), label: c.nombre }))}
              />
            </div>
            <div className="form-grid-2" style={{ marginTop: '12px' }}>
              <Input
                label="Valor Total Acordado (COP)"
                type="number"
                value={formMatricula.valor_acordado}
                onChange={(e) => setFormMatricula({ ...formMatricula, valor_acordado: e.target.value })}
                required
              />
              <Select
                label="Plan de Pagos (Número de Cuotas)"
                value={formMatricula.num_cuotas}
                onChange={(e) => setFormMatricula({ ...formMatricula, num_cuotas: e.target.value })}
                options={[
                  { value: '1', label: '1 Cuota (Contado Completo)' },
                  { value: '2', label: '2 Cuotas Quincenales' },
                  { value: '3', label: '3 Cuotas Mensuales' },
                  { value: '4', label: '4 Cuotas' },
                ]}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button type="button" variant="ghost" onClick={() => setShowFormMatricula(false)}>Cancelar</Button>
              <Button type="submit" variant="primary">Completar Matrícula</Button>
            </div>
          </form>
        </div>
      )}

      {/* Filtro por Curso */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-smoke)', textTransform: 'uppercase' }}>
            Filtrar por Programa:
          </span>
          <button
            type="button"
            className={`btn btn-sm ${selectedCursoId === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 'var(--radius-tag)' }}
            onClick={() => setSelectedCursoId('all')}
          >
            Todos
          </button>
          {cursos.map(c => (
            <button
              key={c.id}
              type="button"
              className={`btn btn-sm ${selectedCursoId === String(c.id) ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 'var(--radius-tag)' }}
              onClick={() => setSelectedCursoId(String(c.id))}
            >
              {c.nombre}
            </button>
          ))}
        </div>
      </div>

      <Table
        columns={columns}
        data={filteredMatriculas}
        emptyMessage="No hay matrículas activas registradas para este programa."
      />
    </div>
  );
}

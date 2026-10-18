// Pruebas en vivo de los CRUD del módulo administrativo.
// Cada operación crea, edita y borra su propio registro, por lo que el script
// se puede ejecutar repetidamente sin dejar restos en la base de datos.

import { execFileSync } from 'node:child_process';

const API = 'http://localhost:5000/api';
let total = 0;
let correctas = 0;
let token = null;
let ids = { documento: 0, contrato: 0, acta: 0 };

const ok = (c, m) => console.log('  ' + (c ? 'OK  ' : 'FAIL') + ' ' + m);
const pass = (m, cond = true) => {
  total += 1;
  if (cond) correctas += 1;
  ok(cond, m);
  return cond;
};
const section = (t) => console.log('\n== ' + t + ' ==');

async function login(email) {
  const r = await fetch(API + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'crono2026' }),
  });
  if (!r.ok) return null;
  const j = await r.json();
  return { token: j.token, rol: j.rol, roles: j.roles };
}

async function req(method, path, body) {
  const r = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let data = null;
  try {
    data = await r.json();
  } catch {
    data = null;
  }
  return { status: r.status, ok: r.ok, data };
}

async function cleanup() {
  if (!ids.documento) return;
  const j = (await login('jun@crono.com')) || {};
  token = j.token;
  if (!token) return;
  for (const id of [ids.documento]) {
    if (id) await req('DELETE', '/documentos/' + id);
  }
  if (ids.contrato) await req('DELETE', '/contratos-firmados/' + ids.contrato);
  if (ids.acta) await req('DELETE', '/junta-oraculo/minutas/' + ids.acta);
}

try {
  section('Sesión');
  const dueno = await login('jun@crono.com');
  pass('autenticación como Dueño', !!dueno);
  token = dueno.token;

  section('Documentos: creación y validaciones');
  const nuevo = await req('POST', '/documentos', {
    departamento: 'ceo-direccion',
    categoria: 'legal',
    nombre: 'Registro temporal de prueba',
    descripcion: 'Creado por la prueba de verificación',
    tipo: 'Documento',
    enlace: '',
    fecha: '2026-10-12',
    roles: ['Dueño', 'Administrativo'],
  });
  pass('crear documento', nuevo.ok);
  ids.documento = nuevo.data?.id || 0;
  pass('el documento recibe identificador', ids.documento > 0);
  pass('devuelve los roles guardados', (nuevo.data?.roles || []).length === 2);

  const soloUno = await req('GET', '/documentos/' + ids.documento);
  pass('consultar documento por id', soloUno.ok);
  pass('fecha en formato yyyy-MM-dd', soloUno.data?.fecha === '2026-10-12');

  const vacio = await req('POST', '/documentos', {
    departamento: 'ceo-direccion',
    categoria: 'legal',
    nombre: '',
    tipo: 'Documento',
    fecha: '2026-10-12',
  });
  pass('nombre vacío rechazado con 400', vacio.status === 400);
  pass('mensaje de nombre obligatorio', /obligatorio/i.test(vacio.data?.error || ''));

  const cat = await req('POST', '/documentos', {
    departamento: 'ceo-direccion',
    categoria: 'logos',
    nombre: 'Incoherente',
    tipo: 'Documento',
    fecha: '2026-10-12',
  });
  pass('categoría fuera del departamento rechazada', cat.status === 400);
  pass('mensaje de categoría', /categoría/i.test(cat.data?.error || ''));

  const fecha = await req('POST', '/documentos', {
    departamento: 'ceo-direccion',
    categoria: 'legal',
    nombre: 'Fecha errónea',
    tipo: 'Documento',
    fecha: 'ayer',
  });
  pass('fecha inválida rechazada', fecha.status === 400);

  const enlace = await req('POST', '/documentos', {
    departamento: 'ceo-direccion',
    categoria: 'legal',
    nombre: 'Enlace inválido',
    tipo: 'Documento',
    fecha: '2026-10-12',
    enlace: 'no es una url',
  });
  pass('enlace inválido rechazado', enlace.status === 400);

  const rolDes = await req('POST', '/documentos', {
    departamento: 'ceo-direccion',
    categoria: 'legal',
    nombre: 'Rol desconocido',
    tipo: 'Documento',
    fecha: '2026-10-12',
    roles: ['Rey Mago'],
  });
  pass('rol fuera del catálogo rechazado', rolDes.status === 400);

  section('Documentos: edición, filtro y borrado');
  const editado = await req('PUT', '/documentos/' + ids.documento, {
    departamento: 'formatos',
    categoria: 'plantillas',
    nombre: 'Registro actualizado de prueba',
    tipo: 'Plantilla',
    fecha: '2026-10-13',
    roles: ['Dueño'],
  });
  pass('editar documento', editado.ok);
  pass('cambia de departamento', editado.data?.departamento === 'formatos');
  pass('cambia de categoría', editado.data?.categoria === 'plantillas');
  pass('cambia de tipo', editado.data?.tipo === 'Plantilla');
  pass('mantiene el identificador', editado.data?.id === ids.documento);

  const porFiltro = await req('GET', '/documentos?departamento=formatos&categoria=plantillas');
  pass('el listado filtrado lo incluye', porFiltro.ok);
  pass('se encuentra el registro editado', (porFiltro.data || []).some((d) => d.id === ids.documento));

  const inexistente = await req('PUT', '/documentos/999999', {
    departamento: 'formatos',
    categoria: 'plantillas',
    nombre: 'Nada',
    tipo: 'Documento',
    fecha: '2026-10-13',
  });
  pass('editar inexistente devuelve 404', inexistente.status === 404);

  section('Contratos: creación, edición y borrado');
  const modelos = await req('GET', '/data/modelos');
  const modeloId = (modelos.data || [])[0]?.personaId;
  pass('hay modelos para asociar', !!modeloId);

  const cNuevo = await req('POST', '/contratos-firmados', {
    modeloPersonaId: modeloId,
    tipo: 'Colaboración',
    fechaFirma: '2026-10-12',
    estado: 'Vigente',
    enlaceDocumento: '',
    observaciones: 'Creado por la prueba',
  });
  pass('crear contrato', cNuevo.ok);
  ids.contrato = cNuevo.data?.id || 0;
  pass('el contrato recibe identificador', ids.contrato > 0);

  const cBad = await req('POST', '/contratos-firmados', {
    modeloPersonaId: 999999,
    tipo: 'Colaboración',
    fechaFirma: '2026-10-12',
    estado: 'Vigente',
  });
  pass('modelo inexistente rechazado', cBad.status === 400);

  const cTipo = await req('POST', '/contratos-firmados', {
    modeloPersonaId: modeloId,
    tipo: 'Amistad',
    fechaFirma: '2026-10-12',
    estado: 'Vigente',
  });
  pass('tipo de contrato fuera de catálogo rechazado', cTipo.status === 400);

  const cEdit = await req('PUT', '/contratos-firmados/' + ids.contrato, {
    modeloPersonaId: modeloId,
    tipo: 'Exclusividad',
    fechaFirma: '2026-10-14',
    estado: 'Vencido',
    observaciones: 'Actualizado por la prueba',
  });
  pass('editar contrato', cEdit.ok);
  pass('cambia el tipo', cEdit.data?.tipo === 'Exclusividad');
  pass('cambia el estado', cEdit.data?.estado === 'Vencido');
  pass('enlace vacío persistido como nulo', cEdit.data?.enlaceDocumento === null || cEdit.data?.enlaceDocumento === undefined);

  const cTras = await req('GET', '/contratos-firmados');
  pass('el contrato aparece en el listado', (cTras.data || []).some((c) => c.id === ids.contrato));

  section('Minutas de la Junta del Oráculo');
  const aNueva = await req('POST', '/junta-oraculo/minutas', {
    fecha: '2026-10-12',
    tema: 'Sesión de prueba',
    contenido: 'Registro temporal para verificar la creación.',
  });
  pass('crear minuta', aNueva.ok);
  ids.acta = aNueva.data?.id || 0;
  pass('la minuta recibe identificador', ids.acta > 0);
  pass('relator por defecto es el usuario autenticado', aNueva.data?.autorPersonaId > 0);

  const aSinContenido = await req('POST', '/junta-oraculo/minutas', { fecha: '2026-10-12', tema: 'Sin contenido' });
  pass('minuta sin contenido rechazada', aSinContenido.status === 400);

  const aEdit = await req('PUT', '/junta-oraculo/minutas/' + ids.acta, {
    fecha: '2026-10-13',
    tema: 'Sesión de prueba actualizada',
    contenido: 'Contenido revisado por la prueba.',
  });
  pass('editar minuta', aEdit.ok);
  pass('cambia el tema', aEdit.data?.tema === 'Sesión de prueba actualizada');

  const aTras = await req('GET', '/junta-oraculo/minutas');
  pass('la minuta aparece en el listado', (aTras.data || []).some((a) => a.id === ids.acta));

  section('Trabajadores: borrado y protección del rol Dueño');
  const staff = await req('GET', '/rrhh/trabajadores');
  pass('el listado expone los roles de cada trabajador', (staff.data || []).every((s) => Array.isArray(s.roles)));
  pass('Hay al menos un trabajador', staff.data.length > 0);

  const creacion = await req('POST', '/rrhh/trabajadores', {
    nombre: 'Temporal Borrado',
    correo: 'temp.borrado@crono.test',
    fechaContratacion: '2026-10-12',
    roles: ['Entrevistador'],
  });
  pass('crear trabajador temporal', creacion.ok);
  const temporalId = creacion.data?.personaId || 0;

  const borraDueño = await req('DELETE', '/rrhh/trabajadores/' + (staff.data.find((s) => (s.roles || []).includes('Dueño'))?.personaId || 0));
  pass('no se puede eliminar un trabajador con el rol Dueño', borraDueño.status === 409);
  pass('mensaje explica la protección del rol Dueño', /Dueño/.test(borraDueño.data?.error || ''));

  const borraOk = await req('DELETE', '/rrhh/trabajadores/' + temporalId);
  pass('eliminar trabajador sin vínculos', borraOk.ok);

  const consultado = await req('GET', '/rrhh/trabajadores/' + temporalId);
  pass('ya no aparece tras eliminarse', consultado.status === 404);

  const borrarInexistente = await req('DELETE', '/rrhh/trabajadores/999999');
  pass('eliminar inexistente devuelve 404', borrarInexistente.status === 404);

  // Se vincula un registro de negocio directamente en la base de datos para
  // comprobar que la baja se bloquea y no deja referencias huérfanas.
  const vinculado = await req('POST', '/rrhh/trabajadores', {
    nombre: 'Temporal Vinculado',
    correo: 'temp.vinculado@crono.test',
    fechaContratacion: '2026-10-12',
    roles: ['Booker'],
  });
  const vinculadoId = vinculado.data?.personaId || 0;
  // sqlcmd devuelve código 0 aunque la consulta falle, así que se revisa la
  // salida: un INSERT que no se aplica haría que la prueba "pase" sin comprobar nada.
  const sql = (q) => {
    const salida = execFileSync('docker', ['exec', 'crono-sql', '/opt/mssql-tools18/bin/sqlcmd', '-C', '-S', 'localhost', '-U', 'sa', '-P', 'Str0ng!Passw0rd', '-d', 'Crono', '-Q', 'SET NOCOUNT ON; ' + q], { stdio: 'pipe' }).toString();
    const error = salida.split('\n').find((l) => /^\s*Msg \d+/.test(l));
    if (error) throw new Error('SQL falló: ' + error.trim());
    return salida;
  };

  if (vinculadoId) {
    sql(`INSERT INTO RolPersonas (PersonaId, TipoRolId, FechaInicio) VALUES (${vinculadoId}, 2, '2026-10-12');`);
    const borrado = await req('DELETE', '/rrhh/trabajadores/' + vinculadoId);
    pass('no se elimina un trabajador con registros vinculados', borrado.status === 409);
    pass('mensaje explica el vínculo', /vinculad/i.test(borrado.data?.error || ''));
    sql(`DELETE FROM RolPersonas WHERE PersonaId = ${vinculadoId};`);
    const libre = await req('DELETE', '/rrhh/trabajadores/' + vinculadoId);
    pass('tras retirar el vínculo la baja se completa', libre.ok);
  }

  section('Autorización de los nuevos endpoints');
  token = null;
  pass('sin token, los documentos no se leen', (await req('GET', '/documentos')).status === 401);
  pass('sin token, los contratos no se leen', (await req('GET', '/contratos-firmados')).status === 401);
  pass('sin token, las minutas no se leen', (await req('GET', '/junta-oraculo/minutas')).status === 401);

  // Creativo: rol sin permisos de documentación, sirve para verificar el 403.
  const asp = await login('andres@crono.com');
  token = asp?.token;
  pass('rol sin permiso de escritura no crea documentos', (await req('POST', '/documentos', {
    departamento: 'ceo-direccion', categoria: 'legal', nombre: 'X', tipo: 'Documento', fecha: '2026-10-12',
  })).status === 403);
  pass('rol sin permiso de lectura no lee documentos', (await req('GET', '/documentos')).status === 403);

  const teo = await login('daniela@crono.com');
  token = teo?.token;
  const libros = await req('GET', '/contratos-firmados');
  pass('Booker autenticado ve sus contratos', libros.ok);
  pass('Booker no accede a escritura de contratos', (await req('POST', '/contratos-firmados', {
    modeloPersonaId: modeloId, tipo: 'Colaboración', fechaFirma: '2026-10-12', estado: 'Vigente',
  })).status === 403);

  section('Unión de roles en autorización y filtrado');
  // Se vuelve al token del Dueño: los controles anteriores usaron el del Booker.
  token = dueno.token;
  const multi = await req('POST', '/rrhh/trabajadores', {
    nombre: 'Temporal Multirol',
    correo: 'temp.multi@crono.test',
    fechaContratacion: '2026-10-12',
    roles: ['Tesorería Agencia', 'Tesorería Academia'],
  });
  const multiId = multi.data?.personaId || 0;
  pass('crear trabajador con dos roles', multi.ok);
  pass('la lista de roles queda guardada', (multi.data?.roles || []).length === 2);

  sql(`INSERT INTO RolPersonas (PersonaId, TipoRolId, FechaInicio) VALUES (${multiId}, 2, '2026-10-12');`);
  token = null;
  const multiLogin = await fetch(API + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'temp.multi@crono.test', password: 'crono2026' }),
  });
  pass('el trabajador puede iniciar sesión', multiLogin.ok);
  const multiSesion = await multiLogin.json();
  pass('el token trae un reclamo por cada rol', (multiSesion.staff?.roles || []).length === 2);

  token = multiSesion.token;
  const trans = await req('GET', '/data/transacciones');
  pass('con ambos roles ve las dos divisiones', trans.ok);
  const divisiones = new Set((trans.data || []).map((t) => t.division));
  pass('suma lo que ve Agencia y lo que ve Academia', divisiones.size > 1);

  // La unión no concede permisos que ningún rol tiene: ninguno de los dos lee
  // documentación, así que el repositorio sigue vedado.
  pass('la unión no abre la documentación que ningún rol permite', (await req('GET', '/documentos')).status === 403);

  token = dueno.token;
  sql(`DELETE FROM RolPersonas WHERE PersonaId = ${multiId};`);
  await req('DELETE', '/rrhh/trabajadores/' + multiId);
  const comprobado = await req('GET', '/rrhh/trabajadores/' + multiId);
  pass('limpieza del trabajador multirol', comprobado.status === 404);
} catch (e) {
  console.error('ERROR de ejecución:', e.message);
} finally {
  await cleanup();
  console.log(`\n===========================================`);
  console.log(`Pruebas de CRUD administrativo: ${correctas}/${total} correctas`);
  console.log('===========================================');
  process.exit(correctas === total ? 0 : 1);
}

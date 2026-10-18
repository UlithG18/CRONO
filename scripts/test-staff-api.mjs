// Verificación end-to-end del módulo de trabajadores (RRHH) contra el backend.
// Cubre: autorización, creación, edición, múltiples roles y validación de mínimo 1 rol.
const API = 'http://localhost:5000/api';

let passed = 0;
let failed = 0;
let createdId = null;

function assert(condition, message) {
  if (condition) {
    console.log(`PASS: ${message}`);
    passed++;
  } else {
    console.error(`FAIL: ${message}`);
    failed++;
  }
}

async function req(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try { data = await res.json(); } catch { /* sin cuerpo */ }
  return { status: res.status, data };
}

async function login(email) {
  const r = await req('POST', '/auth/login', { body: { email, password: 'crono2026' } });
  return r.status === 200 ? r.data.token : null;
}

const TEST_EMAIL = `test.staff.${Date.now()}@crono.test`;

try {
  // --- Sesiones ---
  const tokenDueno = await login('jun@crono.com');
  const tokenCreativo = await login('andres@crono.com');
  const tokenHeadBooker = await login('carlos@crono.com');
  assert(Boolean(tokenDueno), 'Login del Dueño obtiene token');
  assert(Boolean(tokenCreativo), 'Login de Creativo obtiene token');
  assert(Boolean(tokenHeadBooker), 'Login de Head Booker obtiene token');

  // --- 1. Autorización de lectura del directorio ---
  const sinToken = await req('GET', '/rrhh/trabajadores');
  assert(sinToken.status === 401, 'GET /rrhh/trabajadores sin token → 401');

  const staffCreativo = await req('GET', '/rrhh/trabajadores', { token: tokenCreativo });
  assert(staffCreativo.status === 403, 'GET /rrhh/trabajadores con Creativo (sin rrhh) → 403');

  const staffDueño = await req('GET', '/rrhh/trabajadores', { token: tokenDueno });
  assert(staffDueño.status === 200, 'GET /rrhh/trabajadores con Dueño → 200');
  assert(Array.isArray(staffDueño.data) && staffDueño.data.length > 0,
    `GET /rrhh/trabajadores devuelve ${staffDueño.data?.length ?? 0} trabajadores`);

  const todosConRoles = (staffDueño.data || []).every(s => Array.isArray(s.roles) && s.roles.length > 0);
  assert(todosConRoles, 'Todos los trabajadores existentes tienen al menos un rol');

  // --- 2. Catálogo de roles ---
  const catalogo = await req('GET', '/rrhh/roles', { token: tokenDueno });
  assert(catalogo.status === 200 && Array.isArray(catalogo.data) && catalogo.data.length >= 10,
    `GET /rrhh/roles devuelve ${catalogo.data?.length ?? 0} roles del catálogo`);

  // --- 3. Autorización de escritura ---
  const creacionHeadBooker = await req('POST', '/rrhh/trabajadores', {
    token: tokenHeadBooker,
    body: { nombre: 'No Debe Crearse', correo: 'x@crono.test', roles: ['Booker'] },
  });
  assert(creacionHeadBooker.status === 403, 'POST /rrhh/trabajadores con Head Booker (sin rrhh write) → 403');

  // --- 4. Validación de mínimo un rol en backend ---
  const sinRoles = await req('POST', '/rrhh/trabajadores', {
    token: tokenDueno,
    body: { nombre: 'Sin Roles', correo: TEST_EMAIL, roles: [] },
  });
  assert(sinRoles.status === 400, 'POST /rrhh/trabajadores sin roles → 400');
  assert(/al menos un rol/i.test(sinRoles.data?.error || ''),
    `Mensaje de sin-roles: "${sinRoles.data?.error}"`);

  const sinRolesCampo = await req('POST', '/rrhh/trabajadores', {
    token: tokenDueno,
    body: { nombre: 'Sin Campo Roles', correo: TEST_EMAIL },
  });
  assert(sinRolesCampo.status === 400, 'POST /rrhh/trabajadores sin campo roles → 400');

  const rolInvalido = await req('POST', '/rrhh/trabajadores', {
    token: tokenDueno,
    body: { nombre: 'Rol Inválido', correo: TEST_EMAIL, roles: ['SuperAdmin'] },
  });
  assert(rolInvalido.status === 400, 'POST /rrhh/trabajadores con rol fuera de catálogo → 400');

  // --- 5. Creación con varios roles ---
  const creacion = await req('POST', '/rrhh/trabajadores', {
    token: tokenDueno,
    body: {
      nombre: 'Prueba Múltiples Roles',
      correo: TEST_EMAIL,
      telefono: '3000000000',
      roles: ['Booker', 'Administrativo'],
    },
  });
  assert(creacion.status === 201, `POST /rrhh/trabajadores con 2 roles → ${creacion.status}`);
  createdId = creacion.data?.personaId ?? null;
  assert(Boolean(createdId), `Trabajador creado con personaId=${createdId}`);
  assert(Array.isArray(creacion.data?.roles) && creacion.data.roles.length === 2,
    `Respuesta de creación con roles: ${JSON.stringify(creacion.data?.roles)}`);

  const detalle = await req('GET', `/rrhh/trabajadores/${createdId}`, { token: tokenDueno });
  assert(detalle.status === 200 && detalle.data.roles.length === 2,
    `GET /rrhh/trabajadores/{id} confirma 2 roles persistidos: ${JSON.stringify(detalle.data?.roles)}`);

  // --- 6. Autorización con unión de roles ---
  const tokenNuevo = await login(TEST_EMAIL);
  assert(Boolean(tokenNuevo), 'El trabajador creado puede iniciar sesión');

  const docsNuevo = await req('GET', '/data/documentos', { token: tokenNuevo });
  assert(docsNuevo.status === 200,
    'Unión de roles: Booker+Administrativo SÍ lee /data/documentos (Booker no puede por sí solo)');

  const contratosNuevo = await req('GET', '/data/contratos', { token: tokenNuevo });
  assert(contratosNuevo.status === 200, 'Unión de roles: lee /data/contratos');

  const rrhhNuevo = await req('GET', '/data/personas', { token: tokenNuevo });
  assert(rrhhNuevo.status === 200, 'Unión de roles: lee /data/personas (recurso rrhh)');

  // --- 7. Edición conserva roles si no se modifican ---
  const edicionConserva = await req('PUT', `/rrhh/trabajadores/${createdId}`, {
    token: tokenDueno,
    body: {
      nombre: 'Prueba Múltiples Roles',
      correo: TEST_EMAIL,
      telefono: '3009999999',
      roles: ['Booker', 'Administrativo'],
    },
  });
  assert(edicionConserva.status === 200, `PUT /rrhh/trabajadores conservando roles → ${edicionConserva.status}`);
  assert(edicionConserva.data?.roles?.length === 2, 'La edición no pierde los roles existentes');
  assert(edicionConserva.data?.telefono === '3009999999', 'La edición persiste el teléfono');

  // --- 8. Edición no permite dejar el trabajador sin roles ---
  const edicionSinRoles = await req('PUT', `/rrhh/trabajadores/${createdId}`, {
    token: tokenDueno,
    body: { nombre: 'Prueba Múltiples Roles', correo: TEST_EMAIL, roles: [] },
  });
  assert(edicionSinRoles.status === 400, 'PUT /rrhh/trabajadores con roles [] → 400 (imposible quedar sin roles)');

  const trasFallo = await req('GET', `/rrhh/trabajadores/${createdId}`, { token: tokenDueno });
  assert(trasFallo.data?.roles?.length === 2,
    'Tras el rechazo, el trabajador conserva sus 2 roles (no se borraron)');

  // --- 9. Edición con un solo rol y efecto real en autorización ---
  const edicionUnRol = await req('PUT', `/rrhh/trabajadores/${createdId}`, {
    token: tokenDueno,
    body: { nombre: 'Prueba Múltiples Roles', correo: TEST_EMAIL, roles: ['Booker'] },
  });
  assert(edicionUnRol.status === 200 && edicionUnRol.data?.roles?.length === 1,
    'PUT /rrhh/trabajadores reduciendo a 1 rol → 200');

  const tokenTrasQuitar = await login(TEST_EMAIL);
  const docsTrasQuitar = await req('GET', '/data/documentos', { token: tokenTrasQuitar });
  assert(docsTrasQuitar.status === 403,
    'Al quitar Administrativo, /data/documentos pasa a 403 (los roles afectan de verdad)');

  // --- 10. Correo duplicado ---
  const duplicado = await req('POST', '/rrhh/trabajadores', {
    token: tokenDueno,
    body: { nombre: 'Duplicado', correo: TEST_EMAIL, roles: ['Booker'] },
  });
  assert(duplicado.status === 400, 'POST /rrhh/trabajadores con correo duplicado → 400');

  // --- 11. Trabajador inexistente ---
  const inexistente = await req('PUT', '/rrhh/trabajadores/999999', {
    token: tokenDueno,
    body: { nombre: 'Nadie', correo: 'nadie@crono.test', roles: ['Booker'] },
  });
  assert(inexistente.status === 404, 'PUT /rrhh/trabajadores de un id inexistente → 404');
} catch (err) {
  console.error('ERROR INESPERADO:', err.message);
  failed++;
} finally {
  console.log(`\nRESUMEN STAFF API: ${passed} pruebas exitosas, ${failed} fallidas.`);

  // El registro de prueba se crea sobre la base real: se elimina al terminar
  // para que la suite sea repetible sin dejar datos ficticios en el sistema.
  if (createdId) {
    try {
      const { execSync } = await import('node:child_process');
      const sql = [
        `DELETE FROM Auditorias WHERE PersonaId = ${createdId};`,
        `DELETE FROM StaffRoles WHERE PersonaId = ${createdId};`,
        `DELETE FROM Staff WHERE PersonaId = ${createdId};`,
        `DELETE FROM Personas WHERE Id = ${createdId};`,
      ].join(' ');
      execSync(
        `docker exec crono-sql /opt/mssql-tools18/bin/sqlcmd -S localhost -U SA ` +
        `-P "Str0ng!Passw0rd" -d Crono -C -Q "${sql}"`,
        { stdio: 'ignore' },
      );
      console.log(`Limpieza: registro de prueba id=${createdId} eliminado.`);
    } catch (err) {
      console.error(`AVISO: no se pudo eliminar el registro id=${createdId}: ${err.message}`);
      console.error(`Elimínalo manualmente: correo ${TEST_EMAIL}`);
    }
  }

  if (failed > 0) process.exit(1);
}

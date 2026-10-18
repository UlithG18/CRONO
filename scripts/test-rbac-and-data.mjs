import { STAFF, TABS_POR_ROL } from '../src/constants.js';
import { canAccess, userRoles, PERMISSIONS } from '../src/permissions.js';

console.log('--- INICIANDO SUITE DE VALIDACIÓN CRONO PRODUCTION ---');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`PASS: ${message}`);
    passed++;
  } else {
    console.error(`FAIL: ${message}`);
    failed++;
  }
}

// 1. Validar Roles de Sistema y Staff
assert(STAFF.length >= 10, 'Existe registro de los 10 roles institucionales de staff');
assert(Object.keys(TABS_POR_ROL).length >= 10, 'TABS_POR_ROL define navegación para todos los roles');

// 2. Validar que todos los roles tienen dashboard
Object.entries(TABS_POR_ROL).forEach(([rol, tabs]) => {
  assert(tabs.includes('dashboard'), `Rol "${rol}" cuenta con acceso al Dashboard`);
});

// 3. Validar Regla RBAC: Producción y Creativo no tienen acceso a modelos
assert(!canAccess('Producción', 'modelos', 'read'), 'Producción no puede leer modelos');
assert(!canAccess('Creativo', 'modelos', 'read'), 'Creativo no puede leer modelos');

// 4. Validar Regla RBAC: Scouter solo alta de aspirantes
assert(canAccess('Scouter', 'aspirantes', 'write'), 'Scouter puede dar de alta aspirantes');
assert(!canAccess('Scouter', 'aspirantes', 'update'), 'Scouter NO puede editar aspirantes');

// 5. Validar Regla RBAC: Tesorería segregada por división
assert(canAccess('Tesorería Agencia', 'finanzas', 'read'), 'Tesorería Agencia puede ver finanzas');
assert(canAccess('Tesorería Academia', 'finanzas', 'read'), 'Tesorería Academia puede ver finanzas');

// 6. Validar Regla RLS: Espacio Privado exclusivo para Dueño
assert(canAccess('Dueño', 'privado', 'read'), 'Dueño tiene acceso a espacio privado');
assert(!canAccess('Administrativo', 'privado', 'read'), 'Administrativo NO tiene acceso a espacio privado');
assert(!canAccess('Head Booker', 'privado', 'read'), 'Head Booker NO tiene acceso a espacio privado');

// 7. Validar constantes
const db = null;
assert(STAFF.length >= 10, 'Staff tiene 10+ miembros');

// 8. Permisos centralizados: Administrativo = solo lectura en operativos
assert(canAccess('Administrativo', 'modelos', 'read'), 'Administrativo puede leer modelos');
assert(!canAccess('Administrativo', 'modelos', 'write'), 'Administrativo NO puede escribir modelos');
assert(canAccess('Administrativo', 'academia', 'write'), 'Administrativo puede escribir academia');
assert(canAccess('Administrativo', 'rrhh', 'write'), 'Administrativo puede escribir rrhh');

// 9. Permisos centralizados: Booker = ASSIGNED_ONLY
assert(canAccess('Booker', 'modelos', 'read'), 'Booker puede leer modelos');
assert(!canAccess('Booker', 'modelos', 'write'), 'Booker NO puede escribir modelos');
assert(canAccess('Booker', 'clientes', 'write'), 'Booker puede escribir clientes');

// 10. Permisos centralizados: Head Booker = ALL_AND_ASSIGN
assert(canAccess('Head Booker', 'modelos', 'read'), 'Head Booker puede leer modelos');
assert(canAccess('Head Booker', 'modelos', 'write'), 'Head Booker puede escribir modelos');

// 11. Staff con IDs únicos
const staffIds = STAFF.map(s => s.persona_id);
const idsUnicos = new Set(staffIds).size === staffIds.length;
assert(idsUnicos, 'Staff tiene IDs únicos sin colisiones');

// 12. Estructura de datos válida
assert(Array.isArray(STAFF), 'STAFF es array');

// 13. Permisos centralizados: Dueño = acceso total
assert(canAccess('Dueño', 'modelos', 'read'), 'Dueño puede leer modelos');
assert(canAccess('Dueño', 'modelos', 'write'), 'Dueño puede escribir modelos');
assert(canAccess('Dueño', 'clientes', 'write'), 'Dueño puede escribir clientes');
assert(canAccess('Dueño', 'finanzas', 'write'), 'Dueño puede escribir finanzas');

// 14. Permisos centralizados: Producción = solo lectura en clientes
assert(canAccess('Producción', 'clientes', 'read'), 'Producción puede leer clientes');
assert(!canAccess('Producción', 'clientes', 'write'), 'Producción NO puede escribir clientes');
assert(canAccess('Producción', 'produccion', 'write'), 'Producción puede escribir produccion');

// 15. Permisos centralizados: Creativo = limitado
assert(!canAccess('Creativo', 'modelos', 'read'), 'Creativo NO puede leer modelos');
assert(!canAccess('Creativo', 'clientes', 'read'), 'Creativo NO puede leer clientes');
assert(canAccess('Creativo', 'produccion', 'read'), 'Creativo puede leer produccion');

// 16. Módulo administrativo: documentación
assert(canAccess('Dueño', 'documentos', 'read'), 'Dueño puede leer documentos');
assert(canAccess('Administrativo', 'documentos', 'read'), 'Administrativo puede leer documentos');
assert(!canAccess('Administrativo', 'documentos', 'write'), 'Administrativo NO puede modificar documentos');
assert(!canAccess('Head Booker', 'documentos', 'read'), 'Head Booker NO tiene acceso a documentos');
assert(!canAccess('Creativo', 'documentos', 'read'), 'Creativo NO tiene acceso a documentos');
assert(!canAccess('Scouter', 'documentos', 'read'), 'Scouter NO tiene acceso a documentos');

// 17. Módulo administrativo: contratos
assert(canAccess('Dueño', 'contratos', 'read'), 'Dueño puede leer contratos');
assert(canAccess('Administrativo', 'contratos', 'read'), 'Administrativo puede leer contratos');
assert(canAccess('Head Booker', 'contratos', 'read'), 'Head Booker puede leer contratos');
assert(canAccess('Booker', 'contratos', 'read'), 'Booker puede leer contratos');
assert(!canAccess('Booker', 'contratos', 'write'), 'Booker NO puede modificar contratos');
assert(!canAccess('Entrevistador', 'contratos', 'read'), 'Entrevistador NO tiene acceso a contratos');
assert(!canAccess('Tesorería Agencia', 'contratos', 'read'), 'Tesorería Agencia NO tiene acceso a contratos');

// 18. Los recursos nuevos existen en todos los roles de la matriz
const roles = Object.keys(PERMISSIONS);
roles.forEach(rol => {
  assert(PERMISSIONS[rol].documentos !== undefined, `Rol "${rol}" define permisos de documentos`);
  assert(PERMISSIONS[rol].contratos !== undefined, `Rol "${rol}" define permisos de contratos`);
});

// 19. Coherencia: el área administrativa es accesible para al menos un rol no Dueño
const rolesAdmin = roles.filter(r =>
  canAccess(r, 'documentos', 'read') || canAccess(r, 'contratos', 'read') || canAccess(r, 'rrhh', 'read')
);
assert(rolesAdmin.length >= 2, `Área administrativa accesible para ${rolesAdmin.length} roles`);
assert(!rolesAdmin.includes('Creativo'), 'Creativo no accede al área administrativa');
assert(!rolesAdmin.includes('Scouter'), 'Scouter no accede al área administrativa');

// 20. Múltiples roles por trabajador (autorización en interfaz)
assert(canAccess(['Booker', 'Administrativo'], 'documentos', 'read'),
  'Unión de roles: Booker+Administrativo accede a documentos');
assert(!canAccess(['Booker', 'Creativo'], 'documentos', 'read'),
  'Unión de roles sin permiso NO concede documentos');
assert(canAccess(['Creativo', 'Dueño'], 'privado', 'read'),
  'Unión de roles: con Dueño se concede el espacio privado');
assert(canAccess(['Entrevistador', 'Head Booker'], 'aspirantes', 'read'),
  'Unión de roles suma permisos de cada rol');
assert(!canAccess([], 'rrhh', 'read'), 'Sin roles no hay acceso a rrhh');
assert(!canAccess(['RolInexistente'], 'rrhh', 'read'), 'Rol desconocido no concede acceso');
assert(canAccess('Booker', 'contratos', 'read'), 'El rol individual sigue funcionando igual');
assert(userRoles({ rol: 'Booker' }).length === 1, 'userRoles convierte un rol suelto en lista');
assert(userRoles({ rol: 'Booker', roles: ['Dueño', 'Booker'] }).length === 2,
  'userRoles conserva la lista completa de roles');
assert(userRoles(null).length === 0, 'userRoles con sesión vacía devuelve lista vacía');

console.log(`\nRESUMEN: ${passed} pruebas exitosas, ${failed} fallidas.`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('--- VALIDACIÓN DE LÓGICA Y SEGURIDAD EXITOSA ---');
}

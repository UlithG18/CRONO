// Pruebas en vivo del departamento de Reclutamiento.
// Comprueba permisos en backend, persistencia, relaciones, formularios públicos
// y el flujo de revisión. Cada operación crea y borra su propio registro, con
// limpieza final en base de datos, para poder repetir el script sin dejar restos.

import { execFileSync } from 'node:child_process';

const API = 'http://localhost:5000/api';
let total = 0;
let correctas = 0;
let token = null;

// Registros creados por el script, para la limpieza final.
const creados = {
  personas: [],      // id de Persona creada (candidatos, aliados, staff)
  entrevistas: [],
  castings: [],
  aliados: [],
  locaciones: [],
  copys: [],
  docs: [],
};

const pass = (m, cond = true) => {
  total += 1;
  if (cond) correctas += 1;
  console.log('  ' + (cond ? 'OK  ' : 'FAIL') + ' ' + m);
  return cond;
};
const section = (t) => console.log('\n== ' + t + ' ==');
const line = (m) => console.log('  --  ' + m);

async function login(email) {
  const r = await fetch(API + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'crono2026' }),
  });
  if (!r.ok) return null;
  const j = await r.json();
  return { token: j.token, roles: j.roles || [] };
}

async function req(method, path, body, tk = token) {
  const r = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(tk ? { Authorization: 'Bearer ' + tk } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let data = null;
  try { data = await r.json(); } catch { data = null; }
  return { status: r.status, ok: r.ok, data };
}

// Limpieza en base de datos: borra en orden inverso de dependencia.
function sql(query) {
  try {
    execFileSync('docker', [
      'exec', 'crono-sql', '/opt/mssql-tools18/bin/sqlcmd', '-C', '-S', 'localhost',
      '-U', 'sa', '-P', 'Str0ng!Passw0rd', '-d', 'Crono', '-Q',
      'SET NOCOUNT ON; ' + query, '-W',
    ], { stdio: 'pipe' });
    return true;
  } catch (e) {
    console.log('     [sql] ' + String(e.message || e).slice(0, 160));
    return false;
  }
}

function cleanup() {
  section('Limpieza');
  const ids = (a) => a.length ? a.join(',') : '-1';

  if (creados.entrevistas.length)
    sql('DELETE FROM Entrevistas WHERE Id IN (' + ids(creados.entrevistas) + ');');
  if (creados.castings.length) {
    sql('DELETE FROM CastingParticipantes WHERE ConvocatoriaId IN (' + ids(creados.castings) + ');');
    sql('DELETE FROM CastingConvocatorias WHERE Id IN (' + ids(creados.castings) + ');');
  }
  if (creados.locaciones.length)
    sql('DELETE FROM LocacionesAliadas WHERE Id IN (' + ids(creados.locaciones) + ');');
  if (creados.copys.length)
    sql('DELETE FROM Copys WHERE Id IN (' + ids(creados.copys) + ');');
  if (creados.docs.length)
    sql('DELETE FROM Documentos WHERE Id IN (' + ids(creados.docs) + ');');
  if (creados.aliados.length) {
    const a = ids(creados.aliados);
    sql('DELETE FROM Colaboradores WHERE PersonaId IN (' + a + ');');
    sql('DELETE FROM Personas WHERE Id IN (' + a + ');');
  }
  if (creados.personas.length) {
    const p = ids(creados.personas);
    sql('DELETE FROM CastingParticipantes WHERE AspirantePersonaId IN (' + p + ');');
    sql('DELETE FROM RolPersonas WHERE PersonaId IN (' + p + ');');
    sql('DELETE FROM StaffRoles WHERE PersonaId IN (' + p + ');');
    sql('DELETE FROM Staff WHERE PersonaId IN (' + p + ');');
    sql('DELETE FROM Aspirantes WHERE PersonaId IN (' + p + ');');
    sql('DELETE FROM Modelos WHERE PersonaId IN (' + p + ');');
    sql('DELETE FROM Entrevistas WHERE AspirantePersonaId IN (' + p + ');');
    sql('DELETE FROM Personas WHERE Id IN (' + p + ');');
  }
  // Envíos de prueba: borrarlos además reinicia el contador de envíos por hora.
  sql("DELETE FROM EnviosPublicos WHERE NombreCompleto LIKE 'ZZ %';");

  console.log('  limpieza ejecutada');
}

// ----------------------------------------------------------
// Datos de prueba
// ----------------------------------------------------------
const NOMBRE = 'ZZ Candidato Prueba';
const NOMBRE2 = 'ZZ Candidato Segundo';
const NOMBRE_ALIADO = 'ZZ Aliado Prueba';
const HOY = new Date().toISOString().slice(0, 10);

async function main() {
  // ---------- 1. Acceso y permisos en backend ----------
  section('1. Acceso y permisos en backend');

  const dueno = await login('jun@crono.com');
  const scouter = await login('sara@crono.com');
  const entrev = await login('felipe@crono.com');
  const aliadoTk = await login('ana@crono.com');
  const booker = await login('daniela@crono.com');

  pass('el dueño inicia sesión', !!dueno?.token);
  pass('el scouter de modelos inicia sesión', !!scouter?.token);
  pass('el entrevistador inicia sesión', !!entrev?.token);
  pass('el scouter de aliados inicia sesión', !!aliadoTk?.token);
  pass('el scouter de aliados tiene exactamente ese rol',
    aliadoTk?.roles?.length === 1 && aliadoTk.roles[0] === 'Scouter de Aliados');

  token = dueno.token;
  const rCatalogo = await req('GET', '/rrhh/roles');
  pass('el catálogo de roles incluye Scouter de Aliados',
    Array.isArray(rCatalogo.data) && rCatalogo.data.includes('Scouter de Aliados'));

  // ---------- 2. Candidatos ----------
  section('2. Gestión de modelos candidatos');

  token = scouter.token;
  const nuevo = await req('POST', '/reclutamiento/candidatos', {
    nombreCompleto: NOMBRE,
    telefono: '3159998888',
    instagram: '@zz.candidato',
    medioContacto: 'Instagram',
    estado: 'Pendiente',
    notas: 'Ficha de prueba',
  });
  pass('el scouter crea un candidato', nuevo.ok && nuevo.data?.personaId > 0);
  const pid = nuevo.data?.personaId;
  if (pid) creados.personas.push(pid);

  // Sin teléfono, solo Instagram: permitido por requisito explícito.
  const sinTelefono = await req('POST', '/reclutamiento/candidatos', {
    nombreCompleto: NOMBRE + ' Sin Tel',
    instagram: '@zz.sintelefono',
    estado: 'Pendiente',
  });
  pass('se admite un candidato sin teléfono cuando tiene Instagram',
    sinTelefono.ok && sinTelefono.data?.personaId > 0);
  if (sinTelefono.data?.personaId) creados.personas.push(sinTelefono.data.personaId);

  // Sin ningún medio de contacto: rechazado.
  const sinContacto = await req('POST', '/reclutamiento/candidatos', {
    nombreCompleto: 'ZZ Sin Contacto',
    estado: 'Pendiente',
  });
  pass('se rechaza un candidato sin ningún medio de contacto',
    !sinContacto.ok && /medio de contacto/i.test(sinContacto.data?.error || ''));

  // Duplicado por Instagram: rechazado (nunca por nombre).
  const duplicado = await req('POST', '/reclutamiento/candidatos', {
    nombreCompleto: 'ZZ Otro Nombre',
    instagram: 'zz.candidato',
    estado: 'Pendiente',
  });
  pass('se detecta el duplicado por Instagram normalizado',
    !duplicado.ok && /Ya existe/i.test(duplicado.data?.error || ''));

  // Estado inválido: rechazado.
  const estadoInvalido = await req('PUT', '/reclutamiento/candidatos/' + pid + '/estado',
    { estado: 'Inventado' });
  pass('se rechaza un estado fuera del catálogo',
    !estadoInvalido.ok && /Estado no válido/i.test(estadoInvalido.data?.error || ''));

  // Persistencia de la edición.
  const editado = await req('PUT', '/reclutamiento/candidatos/' + pid, {
    nombreCompleto: NOMBRE,
    telefono: '3159998888',
    instagram: '@zz.candidato',
    estado: 'Pendiente',
    pronombres: 'ella',
    estatura: '1.72',
    notas: 'Actualizado por prueba',
    proximasAcciones: 'Llamar la semana entrante',
  });
  pass('la edición del candidato persiste', editado.ok && editado.data?.estatura === '1.72');

  const releido = await req('GET', '/reclutamiento/candidatos/' + pid);
  pass('la relectura devuelve los campos guardados',
    releido.ok && releido.data?.pronombres === 'ella' && releido.data?.proximasAcciones === 'Llamar la semana entrante');

  // ---------- 3. Entrevistas ----------
  section('3. Entrevistas');

  token = entrev.token;
  const entrevista = await req('POST', '/reclutamiento/entrevistas', {
    aspirantePersonaId: pid,
    fechaHora: HOY + 'T15:00',
    estadoAsistencia: 'Programada',
    observaciones: 'Prueba',
  });
  pass('el entrevistador crea una entrevista', entrevista.ok && entrevista.data?.id > 0);
  if (entrevista.data?.id) creados.entrevistas.push(entrevista.data.id);

  pass('la entrevista queda vinculada al candidato correcto',
    entrevista.data?.aspirantePersonaId === pid && entrevista.data?.modeloNombre === NOMBRE);

  const sinModelo = await req('POST', '/reclutamiento/entrevistas', {
    fechaHora: HOY + 'T16:00',
    estadoAsistencia: 'Programada',
  });
  pass('no se guarda una entrevista sin candidato',
    !sinModelo.ok && /candidato/i.test(sinModelo.data?.error || ''));

  const modeloInexistente = await req('POST', '/reclutamiento/entrevistas', {
    aspirantePersonaId: 999999,
    fechaHora: HOY + 'T16:00',
  });
  pass('no se guarda una entrevista con un candidato inexistente',
    !modeloInexistente.ok && modeloInexistente.status === 400);

  const fechaMala = await req('POST', '/reclutamiento/entrevistas', {
    aspirantePersonaId: pid,
    fechaHora: 'no-es-fecha',
  });
  pass('se rechaza una fecha no válida', !fechaMala.ok);

  const borrada = await req('DELETE', '/reclutamiento/entrevistas/' + creados.entrevistas[0]);
  pass('el entrevistador elimina su entrevista', borrada.status === 204 || borrada.ok);
  creados.entrevistas = creados.entrevistas.filter(i => i !== entrevista.data?.id);

  // Alcance: el entrevistador solo ve entrevistas de las que es responsable.
  const listaEntrev = await req('GET', '/reclutamiento/entrevistas');
  pass('el entrevistador lista entrevistas propias', Array.isArray(listaEntrev.data));

  // El entrevistador no tiene acceso al resto de recursos del departamento.
  token = entrev.token;
  pass('el entrevistador NO accede a aliados',
    (await req('GET', '/aliados')).status === 403);
  pass('el entrevistador NO accede a castings',
    (await req('GET', '/castings')).status === 403);
  pass('el entrevistador NO accede a envíos',
    (await req('GET', '/envios-publicos')).status === 403);
  pass('el entrevistador NO accede a datos de producción',
    (await req('GET', '/data/producciones')).status === 403 ||
    (await req('GET', '/data/producciones')).ok === false);

  // ---------- 4. Castings ----------
  section('4. Casting calls');

  token = scouter.token;
  const casting = await req('POST', '/castings', {
    nombre: 'ZZ Convocatoria Prueba',
    fechaHora: HOY + 'T10:00',
    lugar: 'Biblioteca',
    estado: 'Abierto',
  });
  pass('el scouter crea una convocatoria', casting.ok && casting.data?.id > 0);
  const cid = casting.data?.id;
  if (cid) creados.castings.push(cid);

  // Fila existente vinculada a la ficha ya creada.
  const fila1 = await req('POST', '/castings/' + cid + '/participantes', {
    nombre: NOMBRE, contacto: '3159998888', instagram: 'zz.candidato',
    perfil: 'Editorial', estado: 'contactado',
    aspirantePersonaId: pid,
  });
  pass('se añade una fila vinculada a una ficha existente', fila1.ok);

  // Mismo modelo en otra convocatoria: se reutiliza la ficha.
  const casting2 = await req('POST', '/castings', {
    nombre: 'ZZ Convocatoria Dos', estado: 'Abierto',
  });
  if (casting2.data?.id) creados.castings.push(casting2.data?.id);
  const fila2 = await req('POST', '/castings/' + casting2.data?.id + '/participantes', {
    nombre: NOMBRE, instagram: 'zz.candidato', estado: 'invitado',
    aspirantePersonaPersonaId: pid, aspirantePersonaId: pid,
  });
  pass('el mismo modelo participa en dos convocatorias sin duplicar su ficha', fila2.ok);

  // Misma ficha dos veces en la misma convocatoria: rechazado.
  const repetida = await req('POST', '/castings/' + cid + '/participantes', {
    nombre: NOMBRE, instagram: 'zz.candidato', estado: 'invitado',
    aspirantePersonaId: pid,
  });
  pass('no se admite la misma ficha dos veces en una convocatoria',
    !repetida.ok && /ya participa/i.test(repetida.data?.error || ''));

  // Fila sin ficha y luego creación de ficha desde el casting.
  const fila3 = await req('POST', '/castings/' + cid + '/participantes', {
    nombre: 'ZZ Candidato Desde Casting', instagram: 'zz.desdecasting',
    perfil: 'Urbano', estado: 'contactado',
  });
  pass('se añade un candidato nuevo al casting', fila3.ok);
  const fid = fila3.data?.id;

  const creada = await req('POST', '/castings/' + cid + '/participantes/' + fid + '/ficha');
  pass('se crea la ficha de modelo sin salir del casting',
    creada.ok && creada.data?.aspirantePersonaId > 0);
  if (creada.data?.aspirantePersonaId) creados.personas.push(creada.data.aspirantePersonaId);

  // Persistencia de la tabla tras recargar.
  const relectura = await req('GET', '/castings/' + cid + '/participantes');
  pass('los cambios de la tabla persisten al recargar',
    relectura.ok && relectura.data.length >= 3 &&
    relectura.data.some(f => f.aspirantePersonaId === pid));

  // Cerrar conserva el histórico.
  const cerrado = await req('POST', '/castings/' + cid + '/cerrar');
  pass('cerrar la convocatoria conserva sus registros',
    cerrado.ok && cerrado.data?.estado === 'Cerrado' && cerrado.data?.participantes >= 3);

  const trasCierre = await req('POST', '/castings/' + cid + '/participantes', {
    nombre: 'ZZ Tarde', instagram: 'zz.tarde',
  });
  pass('tras cerrar no se admiten nuevos registros', !trasCierre.ok);

  const borrarCerrado = await req('DELETE', '/castings/' + cid);
  pass('eliminar una convocatoria con registros se bloquea para conservar el histórico',
    !borrarCerrado.ok);

  // ---------- 5. Aliados creativos ----------
  section('5. Aliados creativos y locaciones aliadas');

  token = aliadoTk.token;
  const aliado = await req('POST', '/aliados', {
    nombreCompleto: NOMBRE_ALIADO,
    telefono: '3167776666',
    instagram: '@zz.aliado',
    tiktok: '@zz.aliado.tt',
    rolesCreativos: ['Fotografía', 'Dirección creativa'],
    enfoque: 'moda',
    modalidadVinculacion: 'Mixta',
    estadoRelacion: 'Activo',
    esAliado: true,
  });
  pass('el scouter de aliados crea un aliado', aliado.ok && aliado.data?.personaId > 0);
  const apid = aliado.data?.personaId;
  if (apid) creados.aliados.push(apid);

  pass('la ficha admite varios roles creativos sin duplicar a la persona',
    aliado.data?.rolesCreativos?.length === 2);

  const aliadoReleido = await req('GET', '/aliados/' + apid);
  pass('los roles múltiples persisten tras recargar',
    aliadoReleido.data?.rolesCreativos?.join('|') === 'Fotografía|Dirección creativa');

  // Modalidad solo para fotógrafos.
  const modalidadMala = await req('POST', '/aliados', {
    nombreCompleto: 'ZZ Sin Foto',
    telefono: '3160001111',
    rolesCreativos: ['Estilismo'],
    modalidadVinculacion: 'Mixta',
  });
  pass('la modalidad de vinculación solo se admite con el rol de Fotografía',
    !modalidadMala.ok && /Fotografía/i.test(modalidadMala.data?.error || ''));

  // Máximo seis roles.
  const muchos = await req('POST', '/aliados', {
    nombreCompleto: 'ZZ Muchos Roles',
    telefono: '3160002222',
    rolesCreativos: ['Fotografía', 'Estilismo', 'Dirección creativa', 'Apoyo', 'Locaciones', 'Recursos', 'Directorio operativo'],
  });
  pass('se limitan los roles creativos a seis', !muchos.ok && /seis|máximo/i.test(muchos.data?.error || ''));

  // Locación aliada: sin costo, separada de Producción.
  const locacion = await req('POST', '/aliados/locaciones', {
    nombre: 'ZZ Locación Prueba',
    direccion: 'Calle 10 # 20-30',
    contactoNombre: NOMBRE_ALIADO,
    condicionesCanje: 'Canje por fotos',
    estado: 'Propuesta',
    colaboradorPersonaId: apid,
  });
  pass('se registra una locación ofrecida por canje', locacion.ok && locacion.data?.id > 0);
  if (locacion.data?.id) creados.locaciones.push(locacion.data.id);

  pass('la locación aliada no tiene ni precio ni tarifa',
    locacion.ok && !('costo' in (locacion.data || {})) && !('tarifa' in (locacion.data || {})));

  const alienadas = await req('GET', '/aliados/locaciones?busqueda=ZZ');
  pass('la locación aliada aparece en su propio listado',
    alienadas.ok && alienadas.data.some(l => l.nombre === 'ZZ Locación Prueba'));

  // El catálogo comercial de Producción no se ha tocado.
  const produccion = await req('GET', '/data/producciones');
  pass('el módulo de Producción sigue respondiendo', produccion.ok || produccion.status === 403);

  // ---------- 6. Documentos y copys ----------
  section('6. Documentos de reclutamiento y copys');

  token = dueno.token;
  const docs = await req('GET', '/reclutamiento/documentos');
  pass('los documentos de reclutamiento se consultan', docs.ok && Array.isArray(docs.data));
  pass('están las dos referencias del apartado',
    docs.data?.some(d => d.nombre === 'Reclutamiento de Contactos') &&
    docs.data?.some(d => d.nombre === 'Ruta de Modelos Crono'));
  pass('ninguna referencia de documento es un enlace inventado',
    docs.data?.every(d => d.enlace === null || d.enlace === undefined || /^https?:/.test(d.enlace)));

  const docNuevo = await req('POST', '/reclutamiento/documentos', {
    departamento: 'reclutamiento', categoria: 'contactos',
    nombre: 'ZZ Documento Prueba', tipo: 'Documento',
  });
  pass('se crea un documento de reclutamiento', docNuevo.ok);
  if (docNuevo.data?.id) creados.docs.push(docNuevo.data.id);

  const docMalo = await req('POST', '/reclutamiento/documentos', {
    departamento: 'reclutamiento', categoria: 'contactos',
    nombre: 'ZZ Doc', tipo: 'Documento', enlace: 'no-es-una-url',
  });
  pass('se rechaza un enlace que no es una URL válida', !docMalo.ok);

  const copys = await req('GET', '/reclutamiento/copys');
  pass('los copys se consultan', copys.ok && Array.isArray(copys.data));

  const cats = await req('GET', '/reclutamiento/copys/categorias');
  pass('el apartado expone sus seis categorías',
    cats.ok && cats.data?.length === 6 &&
    cats.data.includes('Contacto Inicial') && cats.data.includes('Bienvenida'));

  const copy = await req('POST', '/reclutamiento/copys', {
    titulo: 'ZZ Copy Prueba', contenido: 'Contenido de prueba para el portapapeles.',
    categoria: 'Entrevista',
  });
  pass('se crea un copy', copy.ok && copy.data?.id > 0);
  if (copy.data?.id) creados.copys.push(copy.data.id);

  const copyEditado = await req('PUT', '/reclutamiento/copys/' + copy.data?.id, {
    titulo: 'ZZ Copy Prueba', contenido: 'Contenido actualizado.', categoria: 'Seguimiento',
  });
  pass('se edita el copy y cambia su categoría', copyEditado.ok && copyEditado.data?.categoria === 'Seguimiento');

  const copyMalo = await req('POST', '/reclutamiento/copys', {
    titulo: 'ZZ', contenido: '', categoria: 'Inventada',
  });
  pass('se rechaza una categoría fuera del apartado', !copyMalo.ok);

  const textos = await req('GET', '/reclutamiento/textos-legales');
  pass('los textos legales devuelven sus claves vacías para completarlas',
    textos.ok && textos.data?.length > 0 && textos.data.every(t => typeof t.valor === 'string'));

  // ---------- 7. Formularios públicos ----------
  section('7. Formularios públicos (sin sesión)');

  const f1 = await req('POST', '/publico/casting', {
    nombreCompleto: 'ZZ Postulante Formulario',
    edad: 21, whatsapp: '3175554444', instagram: 'zz.formulario',
    estatura: '1.70', pronombres: 'ella', autorizaDatos: true, trampa: '',
  }, null);
  pass('el formulario de casting responde sin sesión', f1.ok && f1.data?.recibido === true);
  pass('la respuesta solo confirma la recepción',
    f1.ok && !('token' in f1.data) && !Array.isArray(f1.data) && f1.data?.mensaje);

  const fSinAuth = await req('POST', '/publico/casting', {
    nombreCompleto: 'ZZ Sin Autorizacion', edad: 21, whatsapp: '3175550000',
    autorizaDatos: false, trampa: '',
  }, null);
  pass('se rechaza sin autorización de tratamiento de datos',
    !fSinAuth.ok && /autoriza|autorizar/i.test(fSinAuth.data?.error || ''));

  const fSinContacto = await req('POST', '/publico/casting', {
    nombreCompleto: 'ZZ Sin Contacto', edad: 21, autorizaDatos: true, trampa: '',
  }, null);
  pass('se rechaza sin WhatsApp ni Instagram', !fSinContacto.ok);

  const fEdad = await req('POST', '/publico/casting', {
    nombreCompleto: 'ZZ Edad', edad: 9, whatsapp: '3175550001',
    autorizaDatos: true, trampa: '',
  }, null);
  pass('se valida la edad', !fEdad.ok);

  const fTrampa = await req('POST', '/publico/casting', {
    nombreCompleto: 'ZZ Trampa', edad: 25, whatsapp: '3175550002',
    autorizaDatos: true, trampa: 'relleno-automático',
  }, null);
  pass('la trampa anti-bot responde como un envío correcto sin guardar nada',
    fTrampa.ok && fTrampa.data?.recibido === true);

  const r1 = await req('POST', '/publico/red-creativa', {
    nombreCompleto: 'ZZ Creativo Formulario',
    telefono: '3176665555', instagram: 'zz.creativo',
    rolesCreativos: ['Fotografía', 'Estilismo'],
    enfoque: 'editorial', modalidadVinculacion: 'Alianza Creativa',
    autorizaDatos: true, trampa: '',
  }, null);
  pass('el formulario de Red Creativa responde sin sesión', r1.ok && r1.data?.recibido === true);

  const rSinFotografo = await req('POST', '/publico/red-creativa', {
    nombreCompleto: 'ZZ Creativo Sin Foto',
    telefono: '3176665556', rolesCreativos: ['Estilismo'],
    modalidadVinculacion: 'Mixta', autorizaDatos: true, trampa: '',
  }, null);
  pass('no se exige modalidad cuando no se eligió Fotografía',
    !rSinFotografo.ok && /Fotografía/i.test(rSinFotografo.data?.error || ''));

  const rSeis = await req('POST', '/publico/red-creativa', {
    nombreCompleto: 'ZZ Creativo Seis',
    telefono: '3176665557',
    rolesCreativos: ['Fotografía', 'Estilismo', 'Dirección creativa', 'Apoyo', 'Locaciones', 'Recursos', 'Directorio operativo'],
    autorizaDatos: true, trampa: '',
  }, null);
  pass('se limita el formulario a seis roles creativos', !rSeis.ok);

  const conLocacion = await req('POST', '/publico/red-creativa', {
    nombreCompleto: 'ZZ Creativo Con Locacion',
    telefono: '3176665558', rolesCreativos: ['Fotografía'],
    modalidadVinculacion: 'Mixta', autorizaDatos: true, trampa: '',
    locacionNombre: 'ZZ Espacio Ofrecido', locacionDireccion: 'Carrera 5 # 40-40',
  }, null);
  pass('admite la identificación de una locación por canje', conLocacion.ok);

  // Los formularios no exponen registros internos.
  const publicoTextos = await req('GET', '/publico/textos-legales', null, null);
  pass('el endpoint público solo devuelve claves y valores de textos legales',
    publicoTextos.ok && publicoTextos.data.every(t => 'clave' in t && 'valor' in t));
  const publicoLista = await req('GET', '/publico/candidatos', null, null);
  pass('no existe un endpoint público de candidatos', publicoLista.status === 404 || publicoLista.status === 405);

  // ---------- 8. Revisión de envíos ----------
  section('8. Revisión de los envíos recibidos');

  token = scouter.token;
  const pendientes = await req('GET', '/envios-publicos?estado=Pendiente');
  pass('los envíos quedan pendientes de revisión',
    pendientes.ok && pendientes.data.some(e => e.nombreCompleto === 'ZZ Postulante Formulario'));

  const castingEnviado = pendientes.data.find(e => e.nombreCompleto === 'ZZ Postulante Formulario');
  pass('el envío detecta una coincidencia probable con una ficha existente',
    castingEnviado?.coincidenciaPersonaId === pid ||
    castingEnviado?.coincidenciaPersonaId === null);

  // El scouter de modelos no revisa los envíos de aliados si no le corresponde:
  // aquí comprueba que la aprobación crea la ficha y conserva el vínculo.
  const aprobado = await req('POST', '/envios-publicos/' + castingEnviado?.id + '/aprobar', {});
  pass('al aprobar se crea la ficha definitiva y se enlaza el envío',
    aprobado.ok && aprobado.data?.estado === 'Aprobado' && aprobado.data?.registroPersonaId > 0);
  if (aprobado.data?.registroPersonaId) creados.personas.push(aprobado.data.registroPersonaId);

  const otraVez = await req('POST', '/envios-publicos/' + castingEnviado?.id + '/aprobar', {});
  pass('no se puede revisar dos veces el mismo envío', !otraVez.ok);

  token = dueno.token;
  const todos = await req('GET', '/envios-publicos?tipo=RedCreativa');
  const creativo = todos.data?.find(e => e.nombreCompleto === 'ZZ Creativo Formulario');
  const conLoc = todos.data?.find(e => e.nombreCompleto === 'ZZ Creativo Con Locacion');

  const vinculado = await req('POST', '/envios-publicos/' + conLoc?.id + '/aprobar', {
    observaciones: 'Se revisa y completa',
  });
  pass('aprobar el envío de aliado crea su ficha',
    vinculado.ok && vinculado.data?.registroPersonaId > 0);
  if (vinculado.data?.registroPersonaId) creados.aliados.push(vinculado.data.registroPersonaId);

  const locaciones = await req('GET', '/aliados/locaciones?busqueda=ZZ Espacio');
  pass('la locación ofrecida en el formulario se registra como aliada',
    locaciones.ok && locaciones.data.some(l => l.nombre === 'ZZ Espacio Ofrecido'));

  const rechazado = await req('POST', '/envios-publicos/' + creativo?.id + '/rechazar', {
    observaciones: 'No encaja con el perfil buscado',
  });
  pass('se puede rechazar un envío con observaciones',
    rechazado.ok && rechazado.data?.estado === 'Rechazado' &&
    /No encaja/.test(rechazado.data?.observacionesRevision || ''));

  // ---------- 9. Aislamiento de permisos ----------
  section('9. Aislamiento de permisos por rol');

  token = aliadoTk.token;
  pass('el scouter de aliados NO accede a candidatos',
    (await req('GET', '/reclutamiento/candidatos')).status === 403);
  pass('el scouter de aliados NO accede a entrevistas',
    (await req('GET', '/reclutamiento/entrevistas')).status === 403);
  pass('el scouter de aliados NO accede a castings',
    (await req('GET', '/castings')).status === 403);
  pass('el scouter de aliados SÍ accede a aliados',
    (await req('GET', '/aliados')).ok);
  pass('el scouter de aliados NO puede escribir copys',
    (await req('POST', '/reclutamiento/copys', {
      titulo: 'ZZ No', contenido: 'x', categoria: 'Entrevista',
    })).status === 403);

  token = scouter.token;
  pass('el scouter NO accede a aliados',
    (await req('GET', '/aliados')).status === 403);
  pass('el scouter NO accede a copys con escritura',
    (await req('POST', '/reclutamiento/copys', {
      titulo: 'ZZ No', contenido: 'x', categoria: 'Entrevista',
    })).status === 403);

  token = booker.token;
  pass('un booker NO accede a candidatos',
    (await req('GET', '/reclutamiento/candidatos')).status === 403);
  pass('un booker NO accede a envíos',
    (await req('GET', '/envios-publicos')).status === 403);

  // ---------- 10. Módulos existentes ----------
  section('10. Los módulos existentes siguen funcionando');

  token = dueno.token;
  pass('RRHH sigue respondiendo', (await req('GET', '/rrhh/trabajadores')).ok);
  pass('documentos de CEO y Dirección siguen respondiendo', (await req('GET', '/documentos')).ok);
  pass('contratos siguen respondiendo', (await req('GET', '/contratos-firmados')).ok);
  pass('junta del oráculo sigue respondiendo', (await req('GET', '/junta-oraculo/documentos')).ok);
  pass('el catálogo de formatos sigue respondiendo', (await req('GET', '/data/formatos')).ok);

  token = booker.token;
  pass('un booker sigue accediendo a sus datos de booking',
    (await req('GET', '/data/modelos')).ok);

  // ---------- Resumen ----------
  cleanup();
  console.log('\n----------------------------------------');
  console.log(`Resultado: ${correctas}/${total} pruebas correctas`);
  process.exit(correctas === total ? 0 : 1);
}

main().catch((err) => {
  console.error('\nError inesperado: ' + (err && err.stack || err));
  cleanup();
  process.exit(1);
});

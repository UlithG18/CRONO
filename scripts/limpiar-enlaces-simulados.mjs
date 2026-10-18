// Retira del sembrador los enlaces de Drive simulados: mientras no exista la
// integración, un registro no debe mostrar como si su archivo ya estuviera cargado.
import { readFileSync, writeFileSync } from 'node:fs';

const ruta = new URL('../backend/Data/Seeder.cs', import.meta.url);
let contenido = readFileSync(ruta, 'utf8');

const antes = contenido;
contenido = contenido.replace(/, Enlace = "https:\/\/drive\.google\.com\/file\/d\/[^"]*"/g, '');
contenido = contenido.replace(/ EnlaceDocumento = "https:\/\/drive\.google\.com\/file\/d\/[^"]*",?/g, '');

const quitados = (antes.match(/drive\.google\.com/g) || []).length - (contenido.match(/drive\.google\.com/g) || []).length;
writeFileSync(ruta, contenido, 'utf8');
console.log(`Enlaces simulados retirados del sembrador: ${quitados}`);

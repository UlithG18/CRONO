// Constantes compartidas sin dependencias de browser (usables en tests y backend)

export const STAFF = [
  { persona_id: 14, nombre: "Jun Osorio", rol: "Dueño", correo: "jun@crono.com", fecha_contratacion: "2021-01-10" },
  { persona_id: 15, nombre: "Carlos Ruiz", rol: "Head Booker", correo: "carlos@crono.com", fecha_contratacion: "2022-03-04" },
  { persona_id: 16, nombre: "Daniela Fonseca", rol: "Booker", correo: "daniela@crono.com", fecha_contratacion: "2023-06-15" },
  { persona_id: 17, nombre: "Laura Méndez", rol: "Booker", correo: "laura@crono.com", fecha_contratacion: "2024-02-20" },
  { persona_id: 18, nombre: "Felipe Rojas", rol: "Entrevistador", correo: "felipe@crono.com", fecha_contratacion: "2023-09-01" },
  { persona_id: 19, nombre: "Sara Bonilla", rol: "Scouter", correo: "sara@crono.com", fecha_contratacion: "2024-05-11" },
  { persona_id: 20, nombre: "Mateo Duarte", rol: "Producción", correo: "mateo@crono.com", fecha_contratacion: "2022-11-07" },
  { persona_id: 21, nombre: "Andrés Muñoz", rol: "Creativo", correo: "andres@crono.com", fecha_contratacion: "2023-01-19" },
  { persona_id: 22, nombre: "Camila Duque", rol: "Tesorería Agencia", correo: "camila.d@crono.com", fecha_contratacion: "2022-07-25" },
  { persona_id: 23, nombre: "Julián Ortiz", rol: "Tesorería Academia", correo: "julian@crono.com", fecha_contratacion: "2024-08-03" },
  { persona_id: 24, nombre: "Paola Rincón", rol: "Administrativo", correo: "paola@crono.com", fecha_contratacion: "2021-10-12" },
];

export const TABS_POR_ROL = {
  "Entrevistador": ["workspace", "dashboard", "aspirantes", "formatos", "documentacion"],
  "Scouter": ["workspace", "dashboard", "aspirantes", "formatos", "documentacion"],
  "Booker": ["workspace", "dashboard", "modelos", "clientes", "formatos", "documentacion"],
  "Head Booker": ["workspace", "dashboard", "modelos", "clientes", "notifNivel", "recursos", "formatos", "portafolio", "documentacion"],
  "Producción": ["workspace", "dashboard", "clientes", "produccion", "recursos", "formatos", "documentacion"],
  "Creativo": ["workspace", "dashboard", "produccion", "formatos", "documentacion"],
  "Tesorería Agencia": ["workspace", "dashboard", "finanzasAgencia", "formatos"],
  "Tesorería Academia": ["workspace", "dashboard", "finanzasAcademia", "academia", "formatos"],
  "Administrativo": ["workspace", "dashboard", "modelos", "clientes", "produccion", "finanzas", "academia", "evaluaciones", "notifNivel", "rrhh", "recursos", "formatos", "nucleo", "documentacion"],
  "Dueño": ["workspace", "dashboard", "aspirantes", "modelos", "clientes", "produccion", "finanzas", "academia", "evaluaciones", "notifNivel", "recursos", "formatos", "privado", "nucleo", "portafolio", "documentacion"]
};

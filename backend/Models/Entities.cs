using System.ComponentModel.DataAnnotations.Schema;

namespace Crono.Api.Models;

public class Persona
{
    public int Id { get; set; }
    public string NombreCompleto { get; set; } = "";
    public string? FechaNacimiento { get; set; }
    public string? Telefono { get; set; }
    public string? Correo { get; set; }
    public string? InstagramUsuario { get; set; }
    public string? InstagramLink { get; set; }
    public string FechaCreacion { get; set; } = "";
    public int? CreadoPorPersonaId { get; set; }
}

public class TipoRol
{
    public int Id { get; set; }
    public string Nombre { get; set; } = "";
}

public class RolPersona
{
    public int Id { get; set; }
    public int PersonaId { get; set; }
    public int TipoRolId { get; set; }
    public string FechaInicio { get; set; } = "";
    public string? FechaFin { get; set; }
}

public class Modelo
{
    public int PersonaId { get; set; }
    public string NombreArtistico { get; set; } = "";
    public string Genero { get; set; } = "";
    public string? RasgoDistintivo { get; set; }
    public string Enfoque { get; set; } = "";
    public string? PortafolioDriveLink { get; set; }
    public string FechaInicioAgencia { get; set; } = "";
}

public class Aspirante
{
    public int PersonaId { get; set; }
    public string MedioContacto { get; set; } = "";
    public string FechaContacto { get; set; } = "";
    public int? ResponsablePersonaId { get; set; }
    public string Estado { get; set; } = "Pendiente";

    // Ficha de reclutamiento. La identidad (nombre completo, teléfono, Instagram,
    // fecha de nacimiento) vive en Persona: aquí solo se guarda lo que Persona no
    // representa, para no duplicar datos de contacto (spec §3.1).
    public string? NombreSocial { get; set; }
    public string? Pronombres { get; set; }
    public string? Estatura { get; set; }
    public string? Notas { get; set; }
    public string? ProximasAcciones { get; set; }
    public string FechaRegistro { get; set; } = "";
    // Fecha en la que se cambió a Estado actual.
    public string? FechaEstado { get; set; }
    // Último contacto de seguimiento registrado.
    public string? FechaSeguimiento { get; set; }
}

public class Corte
{
    public int Id { get; set; }
    public string Nombre { get; set; } = "";
    public int OrdenJerarquico { get; set; }
    public double CriterioAscenso { get; set; }
}

public class CorteHistorial
{
    public int Id { get; set; }
    public int ModeloPersonaId { get; set; }
    public int CorteId { get; set; }
    public string FechaAsignacion { get; set; } = "";
    public string? Fase { get; set; }
}

public class Cliente
{
    public int Id { get; set; }
    public int PersonaId { get; set; }
    public string RazonSocial { get; set; } = "";
    public string TipoRelacion { get; set; } = "";
    public string Categoria { get; set; } = "";
    public string EstadoRelacion { get; set; } = "Activo";
    public int? BookerPersonaId { get; set; }
}

public class Colaborador
{
    public int PersonaId { get; set; }
    // Categoría principal. La conserva el módulo de Producción, por lo que no se
    // elimina; mantiene sincronía con el primer elemento de RolesCreativos.
    public string Categoria { get; set; } = "";
    public bool EsRecluta { get; set; }
    public bool EsAliado { get; set; }
    public string EstadoContrato { get; set; } = "Activo";

    // Scouter de aliados. Permite varios roles creativos en una misma ficha sin
    // duplicar a la persona (mismo patrón que Documento.Roles).
    public List<string> RolesCreativos { get; set; } = new();
    public string? NombreProfesional { get; set; }
    public string? TikTok { get; set; }
    public string? OtrosContactos { get; set; }
    // moda | urbano | editorial | beauty | otro
    public string? Enfoque { get; set; }
    // Red de Producción | Alianza Creativa | Mixta
    public string? ModalidadVinculacion { get; set; }
    public string? Descripcion { get; set; }
    public string? Observaciones { get; set; }
    public int? ResponsablePersonaId { get; set; }
    // Aceptación de los Lineamientos de la Red de Aliados Creativos (spec §3.2.6).
    public string? FechaAceptacionLineamientos { get; set; }
    public string FechaRegistro { get; set; } = "";
    public string? FechaActualizacion { get; set; }
}

public class Produccion
{
    public int Id { get; set; }
    public string Fecha { get; set; } = "";
    public int ClienteId { get; set; }
    public int LocacionId { get; set; }
    public string TipoEvento { get; set; } = "";
    public string Estado { get; set; } = "En curso";
}

public class Transaccion
{
    public int Id { get; set; }
    public string Tipo { get; set; } = "";
    public string Division { get; set; } = "";
    public string Fecha { get; set; } = "";
    public int? ContrapartePersonaId { get; set; }
    public string Concepto { get; set; } = "";
    public double Valor { get; set; }
    public string EstadoPago { get; set; } = "Completo";
}

public class Curso
{
    public int Id { get; set; }
    public string Nombre { get; set; } = "";
    public string Modalidad { get; set; } = "";
    public string Descripcion { get; set; } = "";
}

public class Matricula
{
    public int Id { get; set; }
    public int EstudiantePersonaId { get; set; }
    public int CursoId { get; set; }
    public double ValorAcordado { get; set; }
    public string Estado { get; set; } = "Activo";
}

public class AspectoEvaluable
{
    public int Id { get; set; }
    public string Nombre { get; set; } = "";
}

public class HabilidadActual
{
    public int Id { get; set; }
    public int PersonaId { get; set; }
    public string Aspecto { get; set; } = "";
    public double Nota { get; set; }
    public string Fecha { get; set; } = "";
}

public class NotificacionNivel
{
    public int Id { get; set; }
    public int PersonaId { get; set; }
    public int CorteObjetivoId { get; set; }
    public double ScoreAlcanzado { get; set; }
    public string Estado { get; set; } = "Pendiente";
    public string FechaGenerada { get; set; } = "";
    public string? FechaAtencion { get; set; }
}

public class AsignacionBooker
{
    public int Id { get; set; }
    public int ModeloPersonaId { get; set; }
    public int BookerPersonaId { get; set; }
    public string FechaAsignacion { get; set; } = "";
    public bool Activo { get; set; }
}

public class Entrevista
{
    public int Id { get; set; }
    public int AspirantePersonaId { get; set; }
    public string FechaHora { get; set; } = "";
    public int ResponsablePersonaId { get; set; }
    // Pendiente | Programada | Realizada | Cancelada | Reprogramada |
    // No asistió | Nunca respondió
    public string EstadoAsistencia { get; set; } = "Pendiente";

    public string? Resultado { get; set; }
    public string? Observaciones { get; set; }
    public string? ProximosPasos { get; set; }
    public string? FechaSeguimiento { get; set; }
    public string FechaCreacion { get; set; } = "";
    public string FechaActualizacion { get; set; } = "";
}

public class FormatoOficial
{
    public int Id { get; set; }
    public string Nombre { get; set; } = "";
    public string Categoria { get; set; } = "";
    public List<string> Roles { get; set; } = new();
}

public class ActaReunion
{
    public int Id { get; set; }
    public string Fecha { get; set; } = "";
    public string Tema { get; set; } = "";
    public string Contenido { get; set; } = "";
    public int AutorPersonaId { get; set; }
}

public class EspacioPrivado
{
    public int Id { get; set; }
    public string Fecha { get; set; } = "";
    public string Titulo { get; set; } = "";
    public string Contenido { get; set; } = "";
}

public class Staff
{
    public int PersonaId { get; set; }
    public string Nombre { get; set; } = "";
    // Rol principal: se conserva para compatibilidad con el token JWT y la interfaz.
    // Los roles completos del trabajador viven en StaffRol.
    public string Rol { get; set; } = "";
    public string FechaContratacion { get; set; } = "";
    public Persona? Persona { get; set; }

    // Roles completos del trabajador. No es una columna: se resuelve desde StaffRol.
    [NotMapped]
    public List<string> Roles { get; set; } = new();

    public List<string> GetRolesList()
        => Roles != null && Roles.Count > 0
            ? Roles.Where(r => !string.IsNullOrWhiteSpace(r)).Distinct().ToList()
            : (string.IsNullOrWhiteSpace(Rol) ? new List<string>() : new List<string> { Rol });
}

// Rol de trabajo asignado a un trabajador.
// Un trabajador puede tener varios; el mínimo es uno.
public class StaffRol
{
    public int Id { get; set; }
    public int PersonaId { get; set; }
    public string Rol { get; set; } = "";
}

// Documento administrativo: metadatos del archivo (el archivo vive en Drive)
public class Documento
{
    public int Id { get; set; }
    // ceo-direccion | contratos | formatos | junta-oraculo
    public string Departamento { get; set; } = "";
    // legal | institucional | logos | papeleria | plantillas | horizonte | minutas
    public string Categoria { get; set; } = "";
    public string Nombre { get; set; } = "";
    public string? Descripcion { get; set; }
    // Documento | Logo | Plantilla | Enlace
    public string Tipo { get; set; } = "Documento";
    public string? Enlace { get; set; }
    public string Fecha { get; set; } = "";
    // Roles con acceso; vacío = acceso administrativo general
    public List<string> Roles { get; set; } = new();
}

// Contrato firmado de un modelo
public class Contrato
{
    public int Id { get; set; }
    public int ModeloPersonaId { get; set; }
    // Colaboración | Exclusividad | Representación | Vinculación
    public string Tipo { get; set; } = "";
    public string FechaFirma { get; set; } = "";
    public string Estado { get; set; } = "Vigente";
    public string? EnlaceDocumento { get; set; }
    public string? Observaciones { get; set; }
}

public class Auditoria
{
    public int Id { get; set; }
    public string Tabla { get; set; } = "";
    public int RegistroId { get; set; }
    public string Accion { get; set; } = "";
    public int PersonaId { get; set; }
    public string Fecha { get; set; } = "";
    public string? Detalles { get; set; }
}

// ============================================================
// DEPARTAMENTO DE RECLUTAMIENTO
// ============================================================

// Convocatoria de casting (la cita en sí). Sus participantes se guardan en
// CastingParticipante: cerrar la convocatoria no borra sus registros.
public class CastingConvocatoria
{
    public int Id { get; set; }
    public string Nombre { get; set; } = "";
    public string? Descripcion { get; set; }
    public string? FechaHora { get; set; }
    public string? Lugar { get; set; }
    // Abierto | Cerrado
    public string Estado { get; set; } = "Abierto";
    public string? Observaciones { get; set; }
    public int? ResponsablePersonaId { get; set; }
    public string FechaCreacion { get; set; } = "";
    public string FechaActualizacion { get; set; } = "";
}

// Fila de la tabla editable de un casting. Los nombres de columna se corresponden
// con los exigidos: Número, Nombre, Contacto, Instagram, Perfil, Estado, Opción,
// Seguimiento y Anotaciones.
public class CastingParticipante
{
    public int Id { get; set; }
    public int ConvocatoriaId { get; set; }
    public int Numero { get; set; }
    public string Nombre { get; set; } = "";
    public string? Contacto { get; set; }
    public string? Instagram { get; set; }
    public string? Perfil { get; set; }
    // contactado | invitado | confirmado | entrevistado | asistente | descartado
    public string Estado { get; set; } = "contactado";
    public string? Opcion { get; set; }
    public string? Seguimiento { get; set; }
    public string? Anotaciones { get; set; }
    // Ficha de aspirante existente. Permite reutilizar la ficha en varios castings
    // sin duplicar a la persona.
    public int? AspirantePersonaId { get; set; }
    public string FechaCreacion { get; set; } = "";
    public string FechaActualizacion { get; set; } = "";
}

// Espacio ofrecido por su propietario como aliado, principalmente por canje.
// NO es la locación comercial de Producción (tabla `locacion` del DBML): no tiene
// costo, ni tarifa, ni entra en el catálogo de Producción.
public class LocacionAliada
{
    public int Id { get; set; }
    public string Nombre { get; set; } = "";
    public string? Direccion { get; set; }
    public string? ContactoNombre { get; set; }
    public string? ContactoTelefono { get; set; }
    public string? ContactoRedes { get; set; }
    public string? Descripcion { get; set; }
    public string? CondicionesCanje { get; set; }
    public string? Disponibilidad { get; set; }
    public string? Observaciones { get; set; }
    // Propuesta | En revisión | Activa | Inactiva
    public string Estado { get; set; } = "Propuesta";
    // Aliado responsable del espacio, cuando ya está fichado.
    public int? ColaboradorPersonaId { get; set; }
    public int? ResponsablePersonaId { get; set; }
    public string FechaRegistro { get; set; } = "";
    public string? FechaActualizacion { get; set; }
}

// Mensaje base de comunicación reutilizable (Copys). El texto vive en base de
// datos, nunca codificado en la interfaz.
public class Copy
{
    public int Id { get; set; }
    public string Titulo { get; set; } = "";
    public string Contenido { get; set; } = "";
    // Reclutamiento de Contactos | Contacto Inicial | Previnculación |
    // Entrevista | Seguimiento | Bienvenida
    public string Categoria { get; set; } = "";
    public string FechaCreacion { get; set; } = "";
    public string FechaActualizacion { get; set; } = "";
}

// Envío de un formulario público. NO es una persona: hasta que un usuario
// autorizado lo revise, no genera ficha de aspirante ni de aliado.
public class EnvioPublico
{
    public int Id { get; set; }
    // Casting | RedCreativa
    public string Tipo { get; set; } = "";
    // Pendiente | Aprobado | Rechazado | Vinculado
    public string Estado { get; set; } = "Pendiente";
    public string FechaEnvio { get; set; } = "";
    // Hash del origen para control de frecuencia sin conservar la IP en claro.
    public string OrigenHash { get; set; } = "";
    // Trampa anti-bot: si el campo oculto se rellena, el envío se descarta.
    public bool Trampa { get; set; }

    // --- Registro de Casting ---
    public string? NombreCompleto { get; set; }
    public string? NombreSocial { get; set; }
    public string? Pronombres { get; set; }
    public int? Edad { get; set; }
    public string? WhatsApp { get; set; }
    // Número de contacto del formulario de Red Creativa (no es WhatsApp).
    public string? Telefono { get; set; }
    public string? Instagram { get; set; }
    public string? Estatura { get; set; }

    // --- Red Creativa ---
    public string? TikTok { get; set; }
    public List<string> RolesCreativos { get; set; } = new();
    public string? Enfoque { get; set; }
    // Red de Producción | Alianza Creativa | Mixta
    public string? ModalidadVinculacion { get; set; }
    public string? OtrosContactos { get; set; }
    // Locación ofrecida mediante canje, si la hay.
    public string? LocacionNombre { get; set; }
    public string? LocacionDireccion { get; set; }
    public string? LocacionNotas { get; set; }

    public bool AutorizaDatos { get; set; }

    // --- Revisión ---
    public int? RevisionPersonaId { get; set; }
    public string? FechaRevision { get; set; }
    public string? ObservacionesRevision { get; set; }
    // Persona creada o existente a la que quedó vinculado el envío.
    public int? RegistroPersonaId { get; set; }
}

// Texto legal configurable (aviso de confidencialidad, autorización de datos...).
// El equipo de Crono debe aportar los textos definitivos: aquí solo se alojan.
public class TextoLegal
{
    public int Id { get; set; }
    // p.ej. casting.aviso_confidencialidad | casting.autorizacion_datos |
    //      red.aviso | red.condiciones
    public string Clave { get; set; } = "";
    public string Valor { get; set; } = "";
    public string FechaActualizacion { get; set; } = "";
    public int? ActualizadoPorPersonaId { get; set; }
}

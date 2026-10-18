using Crono.Api.Data;
using Crono.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Crono.Api.Services;

// ============================================================
// Envíos de los formularios públicos: recepción y revisión
// ============================================================

public class EnvioCastingInput
{
    public string? NombreCompleto { get; set; }
    public string? NombreSocial { get; set; }
    public string? Pronombres { get; set; }
    public int? Edad { get; set; }
    public string? WhatsApp { get; set; }
    public string? Instagram { get; set; }
    public string? Estatura { get; set; }
    public bool AutorizaDatos { get; set; }
    // Trampa anti-bot: debe permanecer vacía. Si se rellena el envío se descarta.
    public string? Trampa { get; set; }
}

public class EnvioRedCreativaInput
{
    public string? NombreCompleto { get; set; }
    public string? Telefono { get; set; }
    public string? Instagram { get; set; }
    public string? TikTok { get; set; }
    public List<string>? RolesCreativos { get; set; }
    public string? Enfoque { get; set; }
    public string? ModalidadVinculacion { get; set; }
    public string? OtrosContactos { get; set; }
    public string? LocacionNombre { get; set; }
    public string? LocacionDireccion { get; set; }
    public string? LocacionNotas { get; set; }
    public bool AutorizaDatos { get; set; }
    public string? Trampa { get; set; }
}

public class EnvioDto
{
    public int Id { get; set; }
    public string Tipo { get; set; } = "";
    public string Estado { get; set; } = "";
    public string FechaEnvio { get; set; } = "";
    public string? FechaRevision { get; set; }
    public int? RevisionPersonaId { get; set; }
    public string? RevisionNombre { get; set; }
    public int? RegistroPersonaId { get; set; }
    public string? RegistroNombre { get; set; }
    public string? ObservacionesRevision { get; set; }

    public string? NombreCompleto { get; set; }
    public string? NombreSocial { get; set; }
    public string? Pronombres { get; set; }
    public int? Edad { get; set; }
    public string? WhatsApp { get; set; }
    public string? Telefono { get; set; }
    public string? Instagram { get; set; }
    public string? TikTok { get; set; }
    public string? Estatura { get; set; }
    public List<string> RolesCreativos { get; set; } = new();
    public string? Enfoque { get; set; }
    public string? ModalidadVinculacion { get; set; }
    public string? OtrosContactos { get; set; }
    public string? LocacionNombre { get; set; }
    public string? LocacionDireccion { get; set; }
    public string? LocacionNotas { get; set; }
    public bool AutorizaDatos { get; set; }
    // Coincidencia probable con una ficha existente, calculada en la revisión.
    public int? CoincidenciaPersonaId { get; set; }
    public string? CoincidenciaNombre { get; set; }
}

public class RevisionInput
{
    public string? Observaciones { get; set; }
    // Ficha existente a la que se vincula el envío en lugar de crear una nueva.
    public int? PersonaIdExistente { get; set; }
}

public interface IEnviosService
{
    IReadOnlyCollection<string> EstadosAdmisibles { get; }
    int MaxPorHora { get; }

    // Recepción pública: sin autenticación, con validación y control de frecuencia.
    Task<(bool Ok, string? Error, int Id)> RecibirCastingAsync(EnvioCastingInput input, string origenHash);
    Task<(bool Ok, string? Error, int Id)> RecibirRedCreativaAsync(EnvioRedCreativaInput input, string origenHash);

    // Revisión interna.
    Task<List<EnvioDto>> ListAsync(string? tipo, string? estado);
    Task<EnvioDto?> GetAsync(int id);
    Task<(bool Ok, string? Error, EnvioDto? Data)> AprobarAsync(int id, RevisionInput input, IReadOnlyCollection<string> roles, int usuarioId);
    Task<(bool Ok, string? Error, EnvioDto? Data)> RechazarAsync(int id, RevisionInput input, IReadOnlyCollection<string> roles, int usuarioId);
}

public class EnviosService : IEnviosService
{
    public IReadOnlyCollection<string> EstadosAdmisibles { get; } =
        new[] { "Pendiente", "Aprobado", "Rechazado", "Vinculado" };

    // Límite de envíos por origen y hora: protección básica contra abuso.
    public int MaxPorHora => 5;

    private readonly CronoDbContext _db;
    private readonly IAspirantesService _aspirantes;
    private readonly IAliadosService _aliados;

    public EnviosService(CronoDbContext db, IAspirantesService aspirantes, IAliadosService aliados)
    {
        _db = db;
        _aspirantes = aspirantes;
        _aliados = aliados;
    }

    private static bool PuedeRevisar(IReadOnlyCollection<string> roles)
        => roles.Contains("Dueño") || roles.Contains("Scouter") ||
           roles.Contains("Scouter de Aliados") || roles.Contains("Administrativo");

    // ----------------------------------------------------------
    // Recepción pública
    // ----------------------------------------------------------

    public async Task<(bool Ok, string? Error, int Id)> RecibirCastingAsync(
        EnvioCastingInput input, string origenHash)
    {
        var (bloqueado, motivo) = await ComprobarFrecuenciaAsync(origenHash);
        if (bloqueado) return (false, motivo, 0);

        // Trampa anti-bot: respuesta idéntica a la de un envío correcto.
        if (!string.IsNullOrWhiteSpace(input.Trampa))
            return (true, null, 0);

        var nombre = Validaciones.Texto(input.NombreCompleto);
        if (nombre.Length == 0) return (false, "El nombre completo es obligatorio.", 0);
        if (nombre.Length > 150) return (false, "El nombre completo no puede superar los 150 caracteres.", 0);

        if (input.Edad is int edad)
        {
            if (edad < 14 || edad > 100)
                return (false, "La edad debe estar entre 14 y 100 años.", 0);
        }
        else
        {
            return (false, "La edad es obligatoria.", 0);
        }

        var whatsapp = Validaciones.TextoOpcional(input.WhatsApp);
        var instagram = AspirantesService.NormalizarInstagram(input.Instagram);
        if (string.IsNullOrWhiteSpace(whatsapp) && string.IsNullOrWhiteSpace(instagram))
            return (false, "Indica tu número de WhatsApp o tu usuario de Instagram.", 0);

        if (!string.IsNullOrWhiteSpace(input.Estatura) && input.Estatura.Trim().Length > 20)
            return (false, "La estatura no puede superar los 20 caracteres.", 0);

        // La autorización es imprescindible para tratar datos personales.
        if (!input.AutorizaDatos)
            return (false, "Debes autorizar el tratamiento de datos personales para enviar el formulario.", 0);

        var hoy = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss");
        var envio = new EnvioPublico
        {
            Tipo = "Casting",
            Estado = "Pendiente",
            FechaEnvio = hoy,
            OrigenHash = origenHash,
            Trampa = false,
            NombreCompleto = nombre,
            NombreSocial = Validaciones.TextoOpcional(input.NombreSocial),
            Pronombres = Validaciones.TextoOpcional(input.Pronombres),
            Edad = input.Edad,
            WhatsApp = whatsapp,
            Instagram = instagram,
            Estatura = Validaciones.TextoOpcional(input.Estatura),
            AutorizaDatos = true,
        };
        _db.EnviosPublicos.Add(envio);
        await _db.SaveChangesAsync();
        return (true, null, envio.Id);
    }

    public async Task<(bool Ok, string? Error, int Id)> RecibirRedCreativaAsync(
        EnvioRedCreativaInput input, string origenHash)
    {
        var (bloqueado, motivo) = await ComprobarFrecuenciaAsync(origenHash);
        if (bloqueado) return (false, motivo, 0);

        if (!string.IsNullOrWhiteSpace(input.Trampa))
            return (true, null, 0);

        var nombre = Validaciones.Texto(input.NombreCompleto);
        if (nombre.Length == 0) return (false, "Los nombres y apellidos son obligatorios.", 0);
        if (nombre.Length > 150) return (false, "El nombre completo no puede superar los 150 caracteres.", 0);

        var telefono = Validaciones.TextoOpcional(input.Telefono);
        var instagram = AspirantesService.NormalizarInstagram(input.Instagram);
        if (string.IsNullOrWhiteSpace(telefono) && string.IsNullOrWhiteSpace(instagram))
            return (false, "Indica tu número de contacto o tu usuario de Instagram.", 0);

        var roles = (input.RolesCreativos ?? new List<string>())
            .Select(Validaciones.Texto).Where(r => r.Length > 0).Distinct().ToList();
        if (roles.Count == 0) return (false, "Selecciona al menos un rol creativo.", 0);
        if (roles.Count > 6) return (false, "Puedes seleccionar como máximo seis roles creativos.", 0);

        var enfoque = Validaciones.TextoOpcional(input.Enfoque);
        if (enfoque != null && !_aliados.EnfoquesAdmisibles.Contains(enfoque))
            return (false, $"El enfoque debe ser uno de: {string.Join(", ", _aliados.EnfoquesAdmisibles)}.", 0);

        // La modalidad solo se pregunta a quien marca Fotografía.
        var modalidad = Validaciones.TextoOpcional(input.ModalidadVinculacion);
        if (modalidad != null)
        {
            if (!_aliados.ModalidadesAdmisibles.Contains(modalidad))
                return (false, $"La modalidad debe ser una de: {string.Join(", ", _aliados.ModalidadesAdmisibles)}.", 0);
            if (!roles.Contains("Fotografía"))
                return (false, "La modalidad de vinculación solo aplica si seleccionas Fotografía.", 0);
        }

        if (!input.AutorizaDatos)
            return (false, "Debes aceptar las condiciones de vinculación para enviar el formulario.", 0);

        var hoy = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss");
        var envio = new EnvioPublico
        {
            Tipo = "RedCreativa",
            Estado = "Pendiente",
            FechaEnvio = hoy,
            OrigenHash = origenHash,
            Trampa = false,
            NombreCompleto = nombre,
            Telefono = telefono,
            Instagram = instagram,
            TikTok = Validaciones.TextoOpcional(input.TikTok),
            RolesCreativos = roles,
            Enfoque = enfoque,
            ModalidadVinculacion = modalidad,
            OtrosContactos = Validaciones.TextoOpcional(input.OtrosContactos),
            LocacionNombre = Validaciones.TextoOpcional(input.LocacionNombre),
            LocacionDireccion = Validaciones.TextoOpcional(input.LocacionDireccion),
            LocacionNotas = Validaciones.TextoOpcional(input.LocacionNotas),
            AutorizaDatos = true,
        };
        _db.EnviosPublicos.Add(envio);
        await _db.SaveChangesAsync();
        return (true, null, envio.Id);
    }

    private async Task<(bool Bloqueado, string? Motivo)> ComprobarFrecuenciaAsync(string origenHash)
    {
        if (string.IsNullOrWhiteSpace(origenHash))
            return (true, "No se pudo identificar el origen de la solicitud.");

        var desde = DateTime.UtcNow.AddHours(-1).ToString("yyyy-MM-ddTHH:mm:ss");
        var total = await _db.EnviosPublicos.CountAsync(e =>
            e.OrigenHash == origenHash && e.FechaEnvio.CompareTo(desde) >= 0);

        if (total >= MaxPorHora)
            return (true, "Has enviado varios formularios recientemente. Inténtalo más tarde.");
        return (false, null);
    }

    // ----------------------------------------------------------
    // Revisión interna
    // ----------------------------------------------------------

    public async Task<List<EnvioDto>> ListAsync(string? tipo, string? estado)
    {
        var query = _db.EnviosPublicos.AsQueryable();
        if (!string.IsNullOrWhiteSpace(tipo))
            query = query.Where(e => e.Tipo == tipo);
        if (!string.IsNullOrWhiteSpace(estado))
            query = query.Where(e => e.Estado == estado);

        var lista = await query.OrderByDescending(e => e.FechaEnvio).ToListAsync();
        var dtos = new List<EnvioDto>(lista.Count);
        foreach (var envio in lista) dtos.Add(await DevolverAsync(envio));
        return dtos;
    }

    public async Task<EnvioDto?> GetAsync(int id)
    {
        var envio = await _db.EnviosPublicos.AsNoTracking().FirstOrDefaultAsync(e => e.Id == id);
        if (envio == null) return null;
        return await DevolverAsync(envio);
    }

    public async Task<(bool Ok, string? Error, EnvioDto? Data)> AprobarAsync(
        int id, RevisionInput input, IReadOnlyCollection<string> roles, int usuarioId)
    {
        if (!PuedeRevisar(roles)) return (false, "No tienes permiso para revisar envíos.", null);

        var envio = await _db.EnviosPublicos.FirstOrDefaultAsync(e => e.Id == id);
        if (envio == null) return (false, "Envío no encontrado.", null);
        if (envio.Estado != "Pendiente")
            return (false, $"El envío ya fue revisado (estado: {envio.Estado}).", null);

        string resultado;
        if (input.PersonaIdExistente is int pid && pid != 0)
        {
            // Vinculación con una ficha ya existente: se conserva la trazabilidad.
            if (envio.Tipo == "Casting")
            {
                if (!await _db.Aspirantes.AsNoTracking().AnyAsync(a => a.PersonaId == pid))
                    return (false, "La ficha de aspirante indicada no existe.", null);
            }
            else if (!await _db.Colaboradores.AsNoTracking().AnyAsync(c => c.PersonaId == pid))
            {
                return (false, "La ficha de aliado indicada no existe.", null);
            }
            envio.RegistroPersonaId = pid;
            resultado = "Vinculado";
        }
        else
        {
            var (ok, error, personaId) = await CrearRegistroAsync(envio, usuarioId);
            if (!ok) return (false, error, null);
            envio.RegistroPersonaId = personaId;
            resultado = "Aprobado";
        }

        envio.Estado = resultado;
        envio.RevisionPersonaId = usuarioId;
        envio.FechaRevision = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss");
        envio.ObservacionesRevision = Validaciones.TextoOpcional(input.Observaciones);
        await _db.SaveChangesAsync();

        return (true, null, await DevolverAsync(envio));
    }

    public async Task<(bool Ok, string? Error, EnvioDto? Data)> RechazarAsync(
        int id, RevisionInput input, IReadOnlyCollection<string> roles, int usuarioId)
    {
        if (!PuedeRevisar(roles)) return (false, "No tienes permiso para revisar envíos.", null);

        var envio = await _db.EnviosPublicos.FirstOrDefaultAsync(e => e.Id == id);
        if (envio == null) return (false, "Envío no encontrado.", null);
        if (envio.Estado != "Pendiente")
            return (false, $"El envío ya fue revisado (estado: {envio.Estado}).", null);

        envio.Estado = "Rechazado";
        envio.RevisionPersonaId = usuarioId;
        envio.FechaRevision = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss");
        envio.ObservacionesRevision = Validaciones.TextoOpcional(input.Observaciones);
        await _db.SaveChangesAsync();

        return (true, null, await DevolverAsync(envio));
    }

    // Crea la ficha definitiva a partir del envío y, si la persona ofreció una
    // locación, registra la locación aliada vinculada a su ficha.
    private async Task<(bool Ok, string? Error, int PersonaId)> CrearRegistroAsync(EnvioPublico envio, int usuarioId)
    {
        if (envio.Tipo == "Casting")
        {
            var resultado = await _aspirantes.CreateCandidatoAsync(new CandidatoInput
            {
                NombreCompleto = envio.NombreCompleto,
                NombreSocial = envio.NombreSocial,
                Telefono = envio.WhatsApp,
                Instagram = envio.Instagram,
                Pronombres = envio.Pronombres,
                Estatura = envio.Estatura,
                MedioContacto = "Formulario público",
                Estado = "Pendiente",
                ResponsablePersonaId = usuarioId,
            }, new[] { "Scouter" }, usuarioId);

            if (!resultado.Ok) return (false, resultado.Error, 0);
            return (true, null, resultado.Data!.PersonaId);
        }

        var aliado = await _aliados.CreateAsync(new AliadoInput
        {
            NombreCompleto = envio.NombreCompleto,
            Telefono = envio.Telefono,
            Instagram = envio.Instagram,
            TikTok = envio.TikTok,
            OtrosContactos = envio.OtrosContactos,
            RolesCreativos = envio.RolesCreativos,
            Enfoque = envio.Enfoque,
            ModalidadVinculacion = envio.ModalidadVinculacion,
            ResponsablePersonaId = usuarioId,
            EstadoRelacion = "Activo",
            EsRecluta = true,
            EsAliado = true,
            // La persona aceptó las condiciones al enviar el formulario.
            FechaAceptacionLineamientos = DateTime.UtcNow.ToString("yyyy-MM-dd"),
        }, new[] { "Scouter de Aliados" }, usuarioId);

        if (!aliado.Ok) return (false, aliado.Error, 0);

        if (!string.IsNullOrWhiteSpace(envio.LocacionNombre))
        {
            var locacion = await _aliados.CreateLocacionAsync(new LocacionAliadaInput
            {
                Nombre = envio.LocacionNombre,
                Direccion = envio.LocacionDireccion,
                ContactoNombre = envio.NombreCompleto,
                ContactoTelefono = envio.Telefono,
                Descripcion = envio.LocacionNotas,
                CondicionesCanje = envio.LocacionNotas,
                Estado = "Propuesta",
                ColaboradorPersonaId = aliado.Data!.PersonaId,
                ResponsablePersonaId = usuarioId,
            }, new[] { "Scouter de Aliados" }, usuarioId);
            if (!locacion.Ok) return (false, locacion.Error, 0);
        }

        return (true, null, aliado.Data!.PersonaId);
    }

    // ----------------------------------------------------------
    // Mapeo
    // ----------------------------------------------------------

    private async Task<EnvioDto> DevolverAsync(EnvioPublico envio)
    {
        var ids = new List<int>();
        if (envio.RevisionPersonaId.HasValue) ids.Add(envio.RevisionPersonaId.Value);
        if (envio.RegistroPersonaId.HasValue) ids.Add(envio.RegistroPersonaId.Value);

        var nombres = new Dictionary<int, string>();
        if (ids.Count > 0)
        {
            nombres = await _db.Personas.AsNoTracking().Where(p => ids.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id, p => p.NombreCompleto);
        }

        // Coincidencia probable con una ficha existente por Instagram o teléfono.
        int? coincidenciaId = null;
        string? coincidenciaNombre = null;
        if (envio.Estado == "Pendiente")
        {
            var candidata = await BuscarCoincidenciaAsync(envio);
            if (candidata != null)
            {
                coincidenciaId = candidata.Id;
                coincidenciaNombre = candidata.NombreCompleto;
            }
        }

        return new EnvioDto
        {
            Id = envio.Id,
            Tipo = envio.Tipo,
            Estado = envio.Estado,
            FechaEnvio = envio.FechaEnvio,
            FechaRevision = envio.FechaRevision,
            RevisionPersonaId = envio.RevisionPersonaId,
            RevisionNombre = envio.RevisionPersonaId is int rid ? nombres.GetValueOrDefault(rid) : null,
            RegistroPersonaId = envio.RegistroPersonaId,
            RegistroNombre = envio.RegistroPersonaId is int pid ? nombres.GetValueOrDefault(pid) : null,
            ObservacionesRevision = envio.ObservacionesRevision,
            NombreCompleto = envio.NombreCompleto,
            NombreSocial = envio.NombreSocial,
            Pronombres = envio.Pronombres,
            Edad = envio.Edad,
            WhatsApp = envio.WhatsApp,
            Telefono = envio.Telefono,
            Instagram = envio.Instagram,
            TikTok = envio.TikTok,
            Estatura = envio.Estatura,
            RolesCreativos = envio.RolesCreativos ?? new List<string>(),
            Enfoque = envio.Enfoque,
            ModalidadVinculacion = envio.ModalidadVinculacion,
            OtrosContactos = envio.OtrosContactos,
            LocacionNombre = envio.LocacionNombre,
            LocacionDireccion = envio.LocacionDireccion,
            LocacionNotas = envio.LocacionNotas,
            AutorizaDatos = envio.AutorizaDatos,
            CoincidenciaPersonaId = coincidenciaId,
            CoincidenciaNombre = coincidenciaNombre,
        };
    }

    // Coincidencia razonable: Instagram o teléfono normalizados. Nunca por nombre:
    // dos personas distintas pueden llamarse igual.
    private async Task<Persona?> BuscarCoincidenciaAsync(EnvioPublico envio)
    {
        var instagram = envio.Instagram;
        var telefono = envio.WhatsApp ?? envio.Telefono;
        if (string.IsNullOrWhiteSpace(instagram) && string.IsNullOrWhiteSpace(telefono)) return null;

        var personas = await _db.Personas.AsNoTracking().ToListAsync();
        return personas.FirstOrDefault(p =>
            (!string.IsNullOrWhiteSpace(instagram) &&
             AspirantesService.NormalizarInstagram(p.InstagramUsuario) == instagram) ||
            (!string.IsNullOrWhiteSpace(telefono) &&
             AspirantesService.NormalizarTelefono(p.Telefono) == AspirantesService.NormalizarTelefono(telefono)));
    }
}

using Crono.Api.Data;
using Crono.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Crono.Api.Services;

// ============================================================
// Casting calls: convocatoria (la cita) + tabla editable de participantes
// ============================================================

public class ConvocatoriaInput
{
    public string? Nombre { get; set; }
    public string? Descripcion { get; set; }
    public string? FechaHora { get; set; }
    public string? Lugar { get; set; }
    public string? Estado { get; set; }
    public string? Observaciones { get; set; }
    public int? ResponsablePersonaId { get; set; }
}

public class ConvocatoriaDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = "";
    public string? Descripcion { get; set; }
    public string? FechaHora { get; set; }
    public string? Lugar { get; set; }
    public string Estado { get; set; } = "";
    public string? Observaciones { get; set; }
    public int? ResponsablePersonaId { get; set; }
    public string? ResponsableNombre { get; set; }
    public string FechaCreacion { get; set; } = "";
    public string FechaActualizacion { get; set; } = "";
    public int Participantes { get; set; }
}

// Coincide con las columnas exigidas por la tabla del casting:
// Número, Nombre, Contacto, Instagram, Perfil, Estado, Opción, Seguimiento, Anotaciones.
public class ParticipanteInput
{
    public int? Numero { get; set; }
    public string? Nombre { get; set; }
    public string? Contacto { get; set; }
    public string? Instagram { get; set; }
    public string? Perfil { get; set; }
    public string? Estado { get; set; }
    public string? Opcion { get; set; }
    public string? Seguimiento { get; set; }
    public string? Anotaciones { get; set; }
    // Ficha de aspirante existente a la que apunta esta fila.
    public int? AspirantePersonaId { get; set; }
}

public class ParticipanteDto
{
    public int Id { get; set; }
    public int ConvocatoriaId { get; set; }
    public int Numero { get; set; }
    public string Nombre { get; set; } = "";
    public string? Contacto { get; set; }
    public string? Instagram { get; set; }
    public string? Perfil { get; set; }
    public string Estado { get; set; } = "";
    public string? Opcion { get; set; }
    public string? Seguimiento { get; set; }
    public string? Anotaciones { get; set; }
    public int? AspirantePersonaId { get; set; }
    public bool ConvocatoriaCerrada { get; set; }
    public string FechaCreacion { get; set; } = "";
    public string FechaActualizacion { get; set; } = "";
}

public interface ICastingsService
{
    IReadOnlyCollection<string> EstadosConvocatoria { get; }
    IReadOnlyCollection<string> EstadosParticipante { get; }

    Task<List<ConvocatoriaDto>> ListAsync(string? estado, string? busqueda);
    Task<ConvocatoriaDto?> GetAsync(int id);
    Task<CrudResult<ConvocatoriaDto>> CreateAsync(ConvocatoriaInput input, IReadOnlyCollection<string> roles, int usuarioId);
    Task<CrudResult<ConvocatoriaDto>> UpdateAsync(int id, ConvocatoriaInput input, IReadOnlyCollection<string> roles, int usuarioId);
    Task<CrudResult<ConvocatoriaDto>> CerrarAsync(int id, IReadOnlyCollection<string> roles, int usuarioId);
    Task<CrudResult<ConvocatoriaDto>> DeleteAsync(int id, IReadOnlyCollection<string> roles, int usuarioId);

    Task<List<ParticipanteDto>> ListParticipantesAsync(int convocatoriaId, string? estado, string? busqueda);
    Task<CrudResult<ParticipanteDto>> AddParticipanteAsync(int convocatoriaId, ParticipanteInput input, int usuarioId);
    Task<CrudResult<ParticipanteDto>> UpdateParticipanteAsync(int convocatoriaId, int participanteId, ParticipanteInput input, int usuarioId);
    Task<string?> DeleteParticipanteAsync(int convocatoriaId, int participanteId);
    // Crea la ficha de aspirante desde la fila del casting y la vincula.
    Task<CrudResult<ParticipanteDto>> CrearFichaAsync(int convocatoriaId, int participanteId, int usuarioId);
    // Reasigna la fila a una ficha de aspirante existente.
    Task<CrudResult<ParticipanteDto>> VincularFichaAsync(int convocatoriaId, int participanteId, int aspirantePersonaId);
}

public class CastingsService : ICastingsService
{
    public IReadOnlyCollection<string> EstadosConvocatoria { get; } = new[] { "Abierto", "Cerrado" };

    // Distingue la invitación de la asistencia efectiva (§5 del encargo).
    public IReadOnlyCollection<string> EstadosParticipante { get; } = new[]
    {
        "contactado", "invitado", "confirmado", "entrevistado", "asistente", "descartado",
    };

    private readonly CronoDbContext _db;
    private readonly IAspirantesService _aspirantes;

    public CastingsService(CronoDbContext db, IAspirantesService aspirantes)
    {
        _db = db;
        _aspirantes = aspirantes;
    }

    private static bool PuedeEscribir(IReadOnlyCollection<string> roles)
        => roles.Contains("Dueño") || roles.Contains("Scouter") || roles.Contains("Administrativo");

    // ----------------------------------------------------------
    // Convocatorias
    // ----------------------------------------------------------

    public async Task<List<ConvocatoriaDto>> ListAsync(string? estado, string? busqueda)
    {
        var query = _db.CastingConvocatorias.AsQueryable();
        if (!string.IsNullOrWhiteSpace(estado))
            query = query.Where(c => c.Estado == estado);
        if (!string.IsNullOrWhiteSpace(busqueda))
            query = query.Where(c => c.Nombre.Contains(busqueda));

        var lista = await query.OrderByDescending(c => c.FechaCreacion).ToListAsync();
        return await MapearAsync(lista);
    }

    public async Task<ConvocatoriaDto?> GetAsync(int id)
    {
        var convocatoria = await _db.CastingConvocatorias.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id);
        if (convocatoria == null) return null;
        return (await MapearAsync(new List<CastingConvocatoria> { convocatoria }))[0];
    }

    public async Task<CrudResult<ConvocatoriaDto>> CreateAsync(
        ConvocatoriaInput input, IReadOnlyCollection<string> roles, int usuarioId)
    {
        if (!PuedeEscribir(roles)) return CrudResult<ConvocatoriaDto>.Fail("No tienes permiso para crear convocatorias.");

        var datos = new ConvocatoriaLimpia();
        var error = await ValidarAsync(input, datos);
        if (error != null) return CrudResult<ConvocatoriaDto>.Fail(error);

        var hoy = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var convocatoria = new CastingConvocatoria
        {
            Nombre = datos.Nombre!,
            Descripcion = datos.Descripcion,
            FechaHora = datos.FechaHora,
            Lugar = datos.Lugar,
            Estado = datos.Estado ?? "Abierto",
            Observaciones = datos.Observaciones,
            ResponsablePersonaId = datos.ResponsablePersonaId ?? usuarioId,
            FechaCreacion = hoy,
            FechaActualizacion = hoy,
        };
        _db.CastingConvocatorias.Add(convocatoria);
        await _db.SaveChangesAsync();

        return CrudResult<ConvocatoriaDto>.Success(
            (await MapearAsync(new List<CastingConvocatoria> { convocatoria }))[0]);
    }

    public async Task<CrudResult<ConvocatoriaDto>> UpdateAsync(
        int id, ConvocatoriaInput input, IReadOnlyCollection<string> roles, int usuarioId)
    {
        if (!PuedeEscribir(roles)) return CrudResult<ConvocatoriaDto>.Fail("No tienes permiso para editar convocatorias.");

        var convocatoria = await _db.CastingConvocatorias.FirstOrDefaultAsync(c => c.Id == id);
        if (convocatoria == null) return CrudResult<ConvocatoriaDto>.Fail("Convocatoria no encontrada.");

        var datos = new ConvocatoriaLimpia();
        var error = await ValidarAsync(input, datos);
        if (error != null) return CrudResult<ConvocatoriaDto>.Fail(error);

        convocatoria.Nombre = datos.Nombre!;
        convocatoria.Descripcion = datos.Descripcion;
        convocatoria.FechaHora = datos.FechaHora;
        convocatoria.Lugar = datos.Lugar;
        convocatoria.Estado = datos.Estado ?? convocatoria.Estado;
        convocatoria.Observaciones = datos.Observaciones;
        convocatoria.ResponsablePersonaId = datos.ResponsablePersonaId ?? convocatoria.ResponsablePersonaId;
        convocatoria.FechaActualizacion = DateTime.UtcNow.ToString("yyyy-MM-dd");

        await _db.SaveChangesAsync();
        return CrudResult<ConvocatoriaDto>.Success(
            (await MapearAsync(new List<CastingConvocatoria> { convocatoria }))[0]);
    }

    // Cerrar conserva las filas y el histórico: solo cambia el estado.
    public async Task<CrudResult<ConvocatoriaDto>> CerrarAsync(
        int id, IReadOnlyCollection<string> roles, int usuarioId)
    {
        if (!PuedeEscribir(roles)) return CrudResult<ConvocatoriaDto>.Fail("No tienes permiso para cerrar convocatorias.");

        var convocatoria = await _db.CastingConvocatorias.FirstOrDefaultAsync(c => c.Id == id);
        if (convocatoria == null) return CrudResult<ConvocatoriaDto>.Fail("Convocatoria no encontrada.");

        convocatoria.Estado = "Cerrado";
        convocatoria.FechaActualizacion = DateTime.UtcNow.ToString("yyyy-MM-dd");
        await _db.SaveChangesAsync();
        return CrudResult<ConvocatoriaDto>.Success(
            (await MapearAsync(new List<CastingConvocatoria> { convocatoria }))[0]);
    }

    public async Task<CrudResult<ConvocatoriaDto>> DeleteAsync(
        int id, IReadOnlyCollection<string> roles, int usuarioId)
    {
        if (!roles.Contains("Dueño"))
            return CrudResult<ConvocatoriaDto>.Fail("Solo el Dueño puede eliminar convocatorias.");

        var convocatoria = await _db.CastingConvocatorias.FirstOrDefaultAsync(c => c.Id == id);
        if (convocatoria == null) return CrudResult<ConvocatoriaDto>.Fail("Convocatoria no encontrada.");

        var filas = await _db.CastingParticipantes.CountAsync(p => p.ConvocatoriaId == id);
        if (filas > 0)
            return CrudResult<ConvocatoriaDto>.Fail(
                $"La convocatoria tiene {filas} registros con su histórico. " +
                "Ciérrala en lugar de eliminarla para conservar la trazabilidad.");

        _db.CastingConvocatorias.Remove(convocatoria);
        await _db.SaveChangesAsync();
        return CrudResult<ConvocatoriaDto>.Success(null!);
    }

    // ----------------------------------------------------------
    // Participantes (tabla editable)
    // ----------------------------------------------------------

    public async Task<List<ParticipanteDto>> ListParticipantesAsync(int convocatoriaId, string? estado, string? busqueda)
    {
        var query = _db.CastingParticipantes.AsQueryable()
            .Where(p => p.ConvocatoriaId == convocatoriaId);

        if (!string.IsNullOrWhiteSpace(estado))
            query = query.Where(p => p.Estado == estado);
        if (!string.IsNullOrWhiteSpace(busqueda))
            query = query.Where(p => p.Nombre.Contains(busqueda) || p.Instagram!.Contains(busqueda));

        var filas = await query.OrderBy(p => p.Numero).ToListAsync();
        var cerrada = await _db.CastingConvocatorias.AsNoTracking()
            .AnyAsync(c => c.Id == convocatoriaId && c.Estado == "Cerrado");

        return filas.Select(p => new ParticipanteDto
        {
            Id = p.Id,
            ConvocatoriaId = p.ConvocatoriaId,
            Numero = p.Numero,
            Nombre = p.Nombre,
            Contacto = p.Contacto,
            Instagram = p.Instagram,
            Perfil = p.Perfil,
            Estado = p.Estado,
            Opcion = p.Opcion,
            Seguimiento = p.Seguimiento,
            Anotaciones = p.Anotaciones,
            AspirantePersonaId = p.AspirantePersonaId,
            ConvocatoriaCerrada = cerrada,
            FechaCreacion = p.FechaCreacion,
            FechaActualizacion = p.FechaActualizacion,
        }).ToList();
    }

    public async Task<CrudResult<ParticipanteDto>> AddParticipanteAsync(int convocatoriaId, ParticipanteInput input, int usuarioId)
    {
        var convocatoria = await _db.CastingConvocatorias.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == convocatoriaId);
        if (convocatoria == null) return CrudResult<ParticipanteDto>.Fail("Convocatoria no encontrada.");
        if (convocatoria.Estado == "Cerrado")
            return CrudResult<ParticipanteDto>.Fail("La convocatoria está cerrada: no admite nuevos registros.");

        var datos = new ParticipanteLimpio();
        var error = await ValidarParticipanteAsync(convocatoriaId, input, datos);
        if (error != null) return CrudResult<ParticipanteDto>.Fail(error);

        var hoy = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var ultimoNumero = await _db.CastingParticipantes
            .Where(p => p.ConvocatoriaId == convocatoriaId)
            .MaxAsync(p => (int?)p.Numero) ?? 0;

        var fila = new CastingParticipante
        {
            ConvocatoriaId = convocatoriaId,
            Numero = datos.Numero ?? ultimoNumero + 1,
            Nombre = datos.Nombre!,
            Contacto = datos.Contacto,
            Instagram = datos.Instagram,
            Perfil = datos.Perfil,
            Estado = datos.Estado!,
            Opcion = datos.Opcion,
            Seguimiento = datos.Seguimiento,
            Anotaciones = datos.Anotaciones,
            AspirantePersonaId = datos.AspirantePersonaId,
            FechaCreacion = hoy,
            FechaActualizacion = hoy,
        };
        _db.CastingParticipantes.Add(fila);
        await _db.SaveChangesAsync();

        return CrudResult<ParticipanteDto>.Success(Devolver(fila, false));
    }

    public async Task<CrudResult<ParticipanteDto>> UpdateParticipanteAsync(
        int convocatoriaId, int participanteId, ParticipanteInput input, int usuarioId)
    {
        var fila = await _db.CastingParticipantes
            .FirstOrDefaultAsync(p => p.Id == participanteId && p.ConvocatoriaId == convocatoriaId);
        if (fila == null) return CrudResult<ParticipanteDto>.Fail("Registro no encontrado.");

        var cerrada = await _db.CastingConvocatorias.AsNoTracking()
            .AnyAsync(c => c.Id == convocatoriaId && c.Estado == "Cerrado");
        if (cerrada)
            return CrudResult<ParticipanteDto>.Fail("La convocatoria está cerrada: sus registros son de solo lectura.");

        var datos = new ParticipanteLimpio();
        var error = await ValidarParticipanteAsync(convocatoriaId, input, datos, fila.Id);
        if (error != null) return CrudResult<ParticipanteDto>.Fail(error);

        fila.Numero = datos.Numero ?? fila.Numero;
        fila.Nombre = datos.Nombre!;
        fila.Contacto = datos.Contacto;
        fila.Instagram = datos.Instagram;
        fila.Perfil = datos.Perfil;
        fila.Estado = datos.Estado!;
        fila.Opcion = datos.Opcion;
        fila.Seguimiento = datos.Seguimiento;
        fila.Anotaciones = datos.Anotaciones;
        fila.AspirantePersonaId = datos.AspirantePersonaId;
        fila.FechaActualizacion = DateTime.UtcNow.ToString("yyyy-MM-dd");

        await _db.SaveChangesAsync();
        return CrudResult<ParticipanteDto>.Success(Devolver(fila, false));
    }

    public async Task<string?> DeleteParticipanteAsync(int convocatoriaId, int participanteId)
    {
        var fila = await _db.CastingParticipantes
            .FirstOrDefaultAsync(p => p.Id == participanteId && p.ConvocatoriaId == convocatoriaId);
        if (fila == null) return "Registro no encontrado.";

        var cerrada = await _db.CastingConvocatorias.AsNoTracking()
            .AnyAsync(c => c.Id == convocatoriaId && c.Estado == "Cerrado");
        if (cerrada) return "La convocatoria está cerrada: sus registros no se pueden eliminar.";

        _db.CastingParticipantes.Remove(fila);
        await _db.SaveChangesAsync();
        return null;
    }

    // Crea la ficha de aspirante desde la fila y la vincula, sin salir del casting.
    public async Task<CrudResult<ParticipanteDto>> CrearFichaAsync(int convocatoriaId, int participanteId, int usuarioId)
    {
        var fila = await _db.CastingParticipantes
            .FirstOrDefaultAsync(p => p.Id == participanteId && p.ConvocatoriaId == convocatoriaId);
        if (fila == null) return CrudResult<ParticipanteDto>.Fail("Registro no encontrado.");
        if (fila.AspirantePersonaId != null)
            return CrudResult<ParticipanteDto>.Fail("Este registro ya está vinculado a una ficha existente.");

        var resultado = await _aspirantes.CreateCandidatoAsync(new CandidatoInput
        {
            NombreCompleto = fila.Nombre,
            Telefono = fila.Contacto,
            Instagram = fila.Instagram,
            MedioContacto = "Casting",
            Estado = "Pendiente",
            ResponsablePersonaId = usuarioId,
        }, new[] { "Scouter" }, usuarioId);

        if (!resultado.Ok) return CrudResult<ParticipanteDto>.Fail(resultado.Error!);

        fila.AspirantePersonaId = resultado.Data!.PersonaId;
        fila.FechaActualizacion = DateTime.UtcNow.ToString("yyyy-MM-dd");
        await _db.SaveChangesAsync();

        return CrudResult<ParticipanteDto>.Success(Devolver(fila, false));
    }

    // Vincula la fila a una ficha de aspirante ya existente (evita duplicados).
    public async Task<CrudResult<ParticipanteDto>> VincularFichaAsync(
        int convocatoriaId, int participanteId, int aspirantePersonaId)
    {
        var fila = await _db.CastingParticipantes
            .FirstOrDefaultAsync(p => p.Id == participanteId && p.ConvocatoriaId == convocatoriaId);
        if (fila == null) return CrudResult<ParticipanteDto>.Fail("Registro no encontrado.");

        var existe = await _db.Aspirantes.AsNoTracking().AnyAsync(a => a.PersonaId == aspirantePersonaId);
        if (!existe) return CrudResult<ParticipanteDto>.Fail("La ficha de aspirante indicada no existe.");

        var yaVinculado = await _db.CastingParticipantes.AsNoTracking().AnyAsync(p =>
            p.ConvocatoriaId == convocatoriaId && p.Id != participanteId &&
            p.AspirantePersonaId == aspirantePersonaId);
        if (yaVinculado)
            return CrudResult<ParticipanteDto>.Fail(
                "Esa ficha ya participa en esta convocatoria: reutiliza su fila en lugar de duplicarla.");

        fila.AspirantePersonaId = aspirantePersonaId;
        fila.FechaActualizacion = DateTime.UtcNow.ToString("yyyy-MM-dd");
        await _db.SaveChangesAsync();

        return CrudResult<ParticipanteDto>.Success(Devolver(fila, false));
    }

    // ----------------------------------------------------------
    // Validaciones
    // ----------------------------------------------------------

    private async Task<string?> ValidarAsync(ConvocatoriaInput input, ConvocatoriaLimpia datos)
    {
        var nombre = Validaciones.Texto(input.Nombre);
        if (nombre.Length == 0) return "El nombre de la convocatoria es obligatorio.";
        if (nombre.Length > 150) return "El nombre no puede superar los 150 caracteres.";

        if (!string.IsNullOrWhiteSpace(input.FechaHora) && !DateTime.TryParse(input.FechaHora, out _))
            return "La fecha y hora deben tener un formato válido (por ejemplo 2026-10-13T15:00).";

        var estado = Validaciones.Texto(input.Estado);
        if (estado.Length == 0) estado = "Abierto";
        if (!EstadosConvocatoria.Contains(estado))
            return $"Estado no válido: {estado}. Admitidos: {string.Join(", ", EstadosConvocatoria)}.";

        int? responsable = null;
        if (input.ResponsablePersonaId is int rid && rid != 0)
        {
            if (!await _db.Staff.AnyAsync(s => s.PersonaId == rid))
                return "El responsable indicado no es un trabajador del sistema.";
            responsable = rid;
        }

        datos.Nombre = nombre;
        datos.Descripcion = Validaciones.TextoOpcional(input.Descripcion);
        datos.FechaHora = Validaciones.TextoOpcional(input.FechaHora);
        datos.Lugar = Validaciones.TextoOpcional(input.Lugar);
        datos.Estado = estado;
        datos.Observaciones = Validaciones.TextoOpcional(input.Observaciones);
        datos.ResponsablePersonaId = responsable;
        return null;
    }

    private async Task<string?> ValidarParticipanteAsync(
        int convocatoriaId, ParticipanteInput input, ParticipanteLimpio datos, int? filaActualId = null)
    {
        var nombre = Validaciones.Texto(input.Nombre);
        if (nombre.Length == 0) return "El nombre es obligatorio.";

        var contacto = Validaciones.TextoOpcional(input.Contacto);
        var instagram = AspirantesService.NormalizarInstagram(input.Instagram);
        if (string.IsNullOrWhiteSpace(contacto) && string.IsNullOrWhiteSpace(instagram))
            return "Indica al menos un medio de contacto: teléfono o Instagram.";

        var estado = Validaciones.Texto(input.Estado);
        if (estado.Length == 0) estado = "contactado";
        if (!EstadosParticipante.Contains(estado))
            return $"Estado no válido: {estado}. Admitidos: {string.Join(", ", EstadosParticipante)}.";

        if (input.AspirantePersonaId is int fid && fid != 0)
        {
            if (!await _db.Aspirantes.AsNoTracking().AnyAsync(a => a.PersonaId == fid))
                return "La ficha de aspirante indicada no existe.";

            var repetido = await _db.CastingParticipantes.AsNoTracking().AnyAsync(p =>
                p.ConvocatoriaId == convocatoriaId && p.AspirantePersonaId == fid &&
                (filaActualId == null || p.Id != filaActualId));
            if (repetido)
                return "Esa ficha ya participa en esta convocatoria: reutiliza su fila en lugar de duplicarla.";
        }

        if (input.Numero is int num && num < 1)
            return "El número debe ser mayor que cero.";

        datos.Numero = input.Numero is int n && n > 0 ? n : null;
        datos.Nombre = nombre;
        datos.Contacto = contacto;
        datos.Instagram = instagram;
        datos.Perfil = Validaciones.TextoOpcional(input.Perfil);
        datos.Estado = estado;
        datos.Opcion = Validaciones.TextoOpcional(input.Opcion);
        datos.Seguimiento = Validaciones.TextoOpcional(input.Seguimiento);
        datos.Anotaciones = Validaciones.TextoOpcional(input.Anotaciones);
        datos.AspirantePersonaId = input.AspirantePersonaId is int f && f != 0 ? f : null;
        return null;
    }

    // ----------------------------------------------------------
    // Mapeo
    // ----------------------------------------------------------

    private async Task<List<ConvocatoriaDto>> MapearAsync(List<CastingConvocatoria> lista)
    {
        if (lista.Count == 0) return new List<ConvocatoriaDto>();

        var ids = lista.Where(c => c.ResponsablePersonaId.HasValue)
            .Select(c => c.ResponsablePersonaId!.Value).Distinct().ToList();
        var nombres = new Dictionary<int, string>();
        if (ids.Count > 0)
        {
            nombres = await _db.Personas.AsNoTracking().Where(p => ids.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id, p => p.NombreCompleto);
        }

        var conteos = await _db.CastingParticipantes.AsNoTracking()
            .Where(p => lista.Select(c => c.Id).Contains(p.ConvocatoriaId))
            .GroupBy(p => p.ConvocatoriaId)
            .Select(g => new { g.Key, Total = g.Count() })
            .ToDictionaryAsync(x => x.Key, x => x.Total);

        return lista.Select(c => new ConvocatoriaDto
        {
            Id = c.Id,
            Nombre = c.Nombre,
            Descripcion = c.Descripcion,
            FechaHora = c.FechaHora,
            Lugar = c.Lugar,
            Estado = c.Estado,
            Observaciones = c.Observaciones,
            ResponsablePersonaId = c.ResponsablePersonaId,
            ResponsableNombre = c.ResponsablePersonaId is int rid ? nombres.GetValueOrDefault(rid) : null,
            FechaCreacion = c.FechaCreacion,
            FechaActualizacion = c.FechaActualizacion,
            Participantes = conteos.GetValueOrDefault(c.Id),
        }).ToList();
    }

    private static ParticipanteDto Devolver(CastingParticipante fila, bool cerrada) => new()
    {
        Id = fila.Id,
        ConvocatoriaId = fila.ConvocatoriaId,
        Numero = fila.Numero,
        Nombre = fila.Nombre,
        Contacto = fila.Contacto,
        Instagram = fila.Instagram,
        Perfil = fila.Perfil,
        Estado = fila.Estado,
        Opcion = fila.Opcion,
        Seguimiento = fila.Seguimiento,
        Anotaciones = fila.Anotaciones,
        AspirantePersonaId = fila.AspirantePersonaId,
        ConvocatoriaCerrada = cerrada,
        FechaCreacion = fila.FechaCreacion,
        FechaActualizacion = fila.FechaActualizacion,
    };

    private sealed class ConvocatoriaLimpia
    {
        public string? Nombre { get; set; }
        public string? Descripcion { get; set; }
        public string? FechaHora { get; set; }
        public string? Lugar { get; set; }
        public string? Estado { get; set; }
        public string? Observaciones { get; set; }
        public int? ResponsablePersonaId { get; set; }
    }

    private sealed class ParticipanteLimpio
    {
        public int? Numero { get; set; }
        public string? Nombre { get; set; }
        public string? Contacto { get; set; }
        public string? Instagram { get; set; }
        public string? Perfil { get; set; }
        public string? Estado { get; set; }
        public string? Opcion { get; set; }
        public string? Seguimiento { get; set; }
        public string? Anotaciones { get; set; }
        public int? AspirantePersonaId { get; set; }
    }
}

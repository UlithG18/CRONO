using Crono.Api.Data;
using Crono.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Crono.Api.Services;

// ============================================================
// Candidatos (modelos en proceso de reclutamiento)
// ============================================================

public class CandidatoInput
{
    public string? NombreCompleto { get; set; }
    public string? NombreSocial { get; set; }
    public string? FechaNacimiento { get; set; }
    // Se admite sin teléfono cuando existe otra vía de contacto (Instagram).
    public string? Telefono { get; set; }
    public string? Correo { get; set; }
    public string? Instagram { get; set; }
    public string? Pronombres { get; set; }
    public string? Estatura { get; set; }
    public string? MedioContacto { get; set; }
    public string? Estado { get; set; }
    public int? ResponsablePersonaId { get; set; }
    public string? Notas { get; set; }
    public string? ProximasAcciones { get; set; }
    public string? FechaContacto { get; set; }
    public string? FechaRegistro { get; set; }
    public string? FechaSeguimiento { get; set; }
}

// Ficha de candidato: une Persona (identidad y contacto) con Aspirante (proceso).
public class CandidatoDto
{
    public int PersonaId { get; set; }
    public string Nombre { get; set; } = "";
    public string? NombreSocial { get; set; }
    public string? FechaNacimiento { get; set; }
    public int? Edad { get; set; }
    public string? Telefono { get; set; }
    public string? Correo { get; set; }
    public string? Instagram { get; set; }
    public string? Pronombres { get; set; }
    public string? Estatura { get; set; }
    public string Estado { get; set; } = "";
    public int? ResponsablePersonaId { get; set; }
    public string? ResponsableNombre { get; set; }
    public string? MedioContacto { get; set; }
    public string? Notas { get; set; }
    public string? ProximasAcciones { get; set; }
    public string? FechaContacto { get; set; }
    public string FechaRegistro { get; set; } = "";
    public string? FechaEstado { get; set; }
    public string? FechaSeguimiento { get; set; }
    public string? FechaCreacion { get; set; }
}

public class EntrevistaInput
{
    public int? AspirantePersonaId { get; set; }
    public string? FechaHora { get; set; }
    public int? ResponsablePersonaId { get; set; }
    public string? EstadoAsistencia { get; set; }
    public string? Resultado { get; set; }
    public string? Observaciones { get; set; }
    public string? ProximosPasos { get; set; }
    public string? FechaSeguimiento { get; set; }
}

public class EntrevistaDto
{
    public int Id { get; set; }
    public int AspirantePersonaId { get; set; }
    public string ModeloNombre { get; set; } = "";
    public string? ModeloInstagram { get; set; }
    public string? ModeloTelefono { get; set; }
    public string FechaHora { get; set; } = "";
    public int ResponsablePersonaId { get; set; }
    public string ResponsableNombre { get; set; } = "";
    public string EstadoAsistencia { get; set; } = "";
    public string? Resultado { get; set; }
    public string? Observaciones { get; set; }
    public string? ProximosPasos { get; set; }
    public string? FechaSeguimiento { get; set; }
    public string FechaCreacion { get; set; } = "";
    public string FechaActualizacion { get; set; } = "";
}

public interface IAspirantesService
{
    IReadOnlyCollection<string> EstadosAdmisibles { get; }

    Task<List<CandidatoDto>> ListCandidatosAsync(IReadOnlyCollection<string> roles, int usuarioId, string? estado, string? busqueda);
    Task<CandidatoDto?> GetCandidatoAsync(int personaId, IReadOnlyCollection<string> roles, int usuarioId);
    Task<CrudResult<CandidatoDto>> CreateCandidatoAsync(CandidatoInput input, IReadOnlyCollection<string> roles, int usuarioId);
    Task<CrudResult<CandidatoDto>> UpdateCandidatoAsync(int personaId, CandidatoInput input, IReadOnlyCollection<string> roles, int usuarioId);
    Task<CrudResult<CandidatoDto>> DeleteCandidatoAsync(int personaId, IReadOnlyCollection<string> roles, int usuarioId);
    Task<CrudResult<CandidatoDto>> CambiarEstadoAsync(int personaId, string estado, IReadOnlyCollection<string> roles, int usuarioId);

    Task<List<EntrevistaDto>> ListEntrevistasAsync(IReadOnlyCollection<string> roles, int usuarioId, string? estado, string? desde, string? hasta);
    Task<EntrevistaDto?> GetEntrevistaAsync(int id, IReadOnlyCollection<string> roles, int usuarioId);
    Task<CrudResult<EntrevistaDto>> CreateEntrevistaAsync(EntrevistaInput input, IReadOnlyCollection<string> roles, int usuarioId);
    Task<CrudResult<EntrevistaDto>> UpdateEntrevistaAsync(int id, EntrevistaInput input, IReadOnlyCollection<string> roles, int usuarioId);
    Task<CrudResult<EntrevistaDto>> DeleteEntrevistaAsync(int id, IReadOnlyCollection<string> roles, int usuarioId);
}

public class AspirantesService : IAspirantesService
{
    // Pendiente | Entrevistado | Vinculado | Descartado (estado_aspirante de la spec).
    public IReadOnlyCollection<string> EstadosAdmisibles { get; } =
        new[] { "Pendiente", "Entrevistado", "Vinculado", "Descartado" };

    // Catálogo de asistencia de la spec, ampliado con "Programada" y "Reprogramada"
    // para distinguir la cita aún no realizada (los catálogos son tablas editables).
    public static readonly string[] EstadosEntrevista =
    {
        "Pendiente", "Programada", "Reprogramada", "Realizada",
        "Cancelada", "No asistió", "Nunca respondió",
    };

    private readonly CronoDbContext _db;

    public AspirantesService(CronoDbContext db) => _db = db;

    // ----------------------------------------------------------
    // Alcance por rol
    // ----------------------------------------------------------

    // Un Entrevistador solo ve los candidatos con el rol de aspirante activo
    // (spec §3.2.3). Dueño y Scouter ven todos.
    private static bool VeTodos(IReadOnlyCollection<string> roles)
        => roles.Contains("Dueño") || roles.Contains("Scouter");

    private async Task<List<int>> AspirantesActivosAsync()
    {
        var activos = await (
            from rp in _db.RolPersonas
            join tr in _db.TipoRoles on rp.TipoRolId equals tr.Id
            where tr.Nombre == "Aspirante" && rp.FechaFin == null
            select rp.PersonaId).ToListAsync();
        return activos;
    }

    // ----------------------------------------------------------
    // Candidatos
    // ----------------------------------------------------------

    public async Task<List<CandidatoDto>> ListCandidatosAsync(
        IReadOnlyCollection<string> roles, int usuarioId, string? estado, string? busqueda)
    {
        var query = _db.Aspirantes.AsQueryable();

        if (!VeTodos(roles))
        {
            var activos = await AspirantesActivosAsync();
            query = query.Where(a => activos.Contains(a.PersonaId));
        }

        if (!string.IsNullOrWhiteSpace(estado))
            query = query.Where(a => a.Estado == estado);

        var lista = await query.ToListAsync();
        var personas = await CargarPersonas(lista.Select(a => a.PersonaId));
        var responsables = await CargarNombres(lista.Select(a => a.ResponsablePersonaId));

        return lista
            .Select(a => Mapear(a, personas.GetValueOrDefault(a.PersonaId), responsables))
            .Where(c =>
                string.IsNullOrWhiteSpace(busqueda) ||
                Contiene(c.Nombre, busqueda) || Contiene(c.NombreSocial, busqueda) ||
                Contiene(c.Instagram, busqueda) || Contiene(c.Telefono, busqueda))
            .OrderBy(c => c.Estado).ThenByDescending(c => c.FechaRegistro)
            .ToList();
    }

    public async Task<CandidatoDto?> GetCandidatoAsync(int personaId, IReadOnlyCollection<string> roles, int usuarioId)
    {
        var aspirante = await _db.Aspirantes.AsNoTracking()
            .FirstOrDefaultAsync(a => a.PersonaId == personaId);
        if (aspirante == null) return null;

        if (!VeTodos(roles))
        {
            var activos = await AspirantesActivosAsync();
            if (!activos.Contains(personaId)) return null;
        }

        var personas = await CargarPersonas(new[] { personaId });
        var responsables = await CargarNombres(new[] { aspirante.ResponsablePersonaId });
        return Mapear(aspirante, personas.GetValueOrDefault(personaId), responsables);
    }

    public async Task<CrudResult<CandidatoDto>> CreateCandidatoAsync(
        CandidatoInput input, IReadOnlyCollection<string> roles, int usuarioId)
    {
        var datos = new CandidatoLimpio();
        var error = await ValidarCandidatoAsync(input, null, datos);
        if (error != null) return CrudResult<CandidatoDto>.Fail(error);

        // Duplicados: se comparan Instagram y teléfono normalizados, nunca el nombre.
        var duplicado = await BuscarDuplicadoAsync(datos.Instagram, datos.Telefono);
        if (duplicado != null)
            return CrudResult<CandidatoDto>.Fail(
                $"Ya existe una ficha con el mismo contacto ({duplicado.NombreCompleto}, " +
                $"persona {duplicado.Id}). Edítala en lugar de crear otra.");

        var hoy = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var persona = new Persona
        {
            NombreCompleto = datos.NombreCompleto!,
            FechaNacimiento = datos.FechaNacimiento,
            Telefono = datos.Telefono,
            Correo = datos.Correo,
            InstagramUsuario = datos.Instagram,
            FechaCreacion = hoy,
            CreadoPorPersonaId = usuarioId,
        };
        _db.Personas.Add(persona);
        await _db.SaveChangesAsync();

        var aspirante = new Aspirante
        {
            PersonaId = persona.Id,
            MedioContacto = datos.MedioContacto ?? "",
            FechaContacto = datos.FechaContacto ?? hoy,
            ResponsablePersonaId = datos.ResponsablePersonaId ?? usuarioId,
            Estado = datos.Estado ?? "Pendiente",
            NombreSocial = datos.NombreSocial,
            Pronombres = datos.Pronombres,
            Estatura = datos.Estatura,
            Notas = datos.Notas,
            ProximasAcciones = datos.ProximasAcciones,
            FechaRegistro = datos.FechaRegistro ?? hoy,
            FechaEstado = hoy,
            FechaSeguimiento = datos.FechaSeguimiento,
        };
        _db.Aspirantes.Add(aspirante);

        // El rol de aspirante activo es lo que hace efectivo el alcance del
        // Entrevistador (spec §3.2.3).
        await AbrirRolAsync(persona.Id, "Aspirante", hoy);
        await _db.SaveChangesAsync();

        return CrudResult<CandidatoDto>.Success(
            Mapear(aspirante, persona, await CargarNombres(new[] { aspirante.ResponsablePersonaId })));
    }

    public async Task<CrudResult<CandidatoDto>> UpdateCandidatoAsync(
        int personaId, CandidatoInput input, IReadOnlyCollection<string> roles, int usuarioId)
    {
        var aspirante = await _db.Aspirantes.FirstOrDefaultAsync(a => a.PersonaId == personaId);
        if (aspirante == null) return CrudResult<CandidatoDto>.Fail("Candidato no encontrado.");
        if (!VeTodos(roles))
        {
            var activos = await AspirantesActivosAsync();
            if (!activos.Contains(personaId))
                return CrudResult<CandidatoDto>.Fail("Candidato no encontrado.");
        }

        var persona = await _db.Personas.FirstOrDefaultAsync(p => p.Id == personaId);
        if (persona == null) return CrudResult<CandidatoDto>.Fail("Candidato no encontrado.");

        var datos = new CandidatoLimpio();
        var error = await ValidarCandidatoAsync(input, personaId, datos);
        if (error != null) return CrudResult<CandidatoDto>.Fail(error);

        var duplicado = await BuscarDuplicadoAsync(datos.Instagram, datos.Telefono);
        if (duplicado != null && duplicado.Id != personaId)
            return CrudResult<CandidatoDto>.Fail(
                $"Ya existe otra ficha con el mismo contacto ({duplicado.NombreCompleto}, " +
                $"persona {duplicado.Id}).");

        persona.NombreCompleto = datos.NombreCompleto!;
        persona.FechaNacimiento = datos.FechaNacimiento;
        persona.Telefono = datos.Telefono;
        persona.Correo = datos.Correo;
        persona.InstagramUsuario = datos.Instagram;

        aspirante.MedioContacto = datos.MedioContacto ?? aspirante.MedioContacto;
        aspirante.FechaContacto = datos.FechaContacto ?? aspirante.FechaContacto;
        aspirante.ResponsablePersonaId = datos.ResponsablePersonaId ?? aspirante.ResponsablePersonaId;
        aspirante.NombreSocial = datos.NombreSocial;
        aspirante.Pronombres = datos.Pronombres;
        aspirante.Estatura = datos.Estatura;
        aspirante.Notas = datos.Notas;
        aspirante.ProximasAcciones = datos.ProximasAcciones;
        aspirante.FechaRegistro = datos.FechaRegistro ?? aspirante.FechaRegistro;
        aspirante.FechaSeguimiento = datos.FechaSeguimiento;

        var estadoNuevo = datos.Estado ?? aspirante.Estado;
        if (estadoNuevo != aspirante.Estado)
        {
            aspirante.Estado = estadoNuevo;
            aspirante.FechaEstado = DateTime.UtcNow.ToString("yyyy-MM-dd");
            await SincronizarRolPorEstadoAsync(personaId, estadoNuevo);
        }

        await _db.SaveChangesAsync();
        return CrudResult<CandidatoDto>.Success(
            Mapear(aspirante, persona, await CargarNombres(new[] { aspirante.ResponsablePersonaId })));
    }

    public async Task<CrudResult<CandidatoDto>> DeleteCandidatoAsync(
        int personaId, IReadOnlyCollection<string> roles, int usuarioId)
    {
        var aspirante = await _db.Aspirantes.FirstOrDefaultAsync(a => a.PersonaId == personaId);
        if (aspirante == null) return CrudResult<CandidatoDto>.Fail("Candidato no encontrado.");
        if (!VeTodos(roles))
        {
            var activos = await AspirantesActivosAsync();
            if (!activos.Contains(personaId))
                return CrudResult<CandidatoDto>.Fail("Candidato no encontrado.");
        }

        // Baja con trazabilidad: se desactiva el rol de aspirante y se marca el
        // estado. No se borra la Persona ni las entrevistas, para no perder el
        // historial del proceso.
        await CerrarRolAsync(personaId, "Aspirante");
        aspirante.Estado = "Descartado";
        aspirante.FechaEstado = DateTime.UtcNow.ToString("yyyy-MM-dd");
        await _db.SaveChangesAsync();

        return CrudResult<CandidatoDto>.Success(Mapear(aspirante, null, null));
    }

    public async Task<CrudResult<CandidatoDto>> CambiarEstadoAsync(
        int personaId, string estado, IReadOnlyCollection<string> roles, int usuarioId)
    {
        var aspirante = await _db.Aspirantes.FirstOrDefaultAsync(a => a.PersonaId == personaId);
        if (aspirante == null) return CrudResult<CandidatoDto>.Fail("Candidato no encontrado.");
        if (!VeTodos(roles))
        {
            var activos = await AspirantesActivosAsync();
            if (!activos.Contains(personaId))
                return CrudResult<CandidatoDto>.Fail("Candidato no encontrado.");
        }
        if (!EstadosAdmisibles.Contains(estado))
            return CrudResult<CandidatoDto>.Fail(
                $"Estado no válido: {estado}. Admitidos: {string.Join(", ", EstadosAdmisibles)}.");

        aspirante.Estado = estado;
        aspirante.FechaEstado = DateTime.UtcNow.ToString("yyyy-MM-dd");
        await SincronizarRolPorEstadoAsync(personaId, estado);
        await _db.SaveChangesAsync();

        var persona = await _db.Personas.AsNoTracking().FirstOrDefaultAsync(p => p.Id == personaId);
        return CrudResult<CandidatoDto>.Success(
            Mapear(aspirante, persona, await CargarNombres(new[] { aspirante.ResponsablePersonaId })));
    }

    // ----------------------------------------------------------
    // Entrevistas
    // ----------------------------------------------------------

    public async Task<List<EntrevistaDto>> ListEntrevistasAsync(
        IReadOnlyCollection<string> roles, int usuarioId, string? estado, string? desde, string? hasta)
    {
        var query = _db.Entrevistas.AsQueryable();

        // Solo Dueño y Scouter (y la vista administrativa) ven todas; el resto, las suyas.
        if (!VeTodos(roles) && !roles.Contains("Administrativo"))
            query = query.Where(e => e.ResponsablePersonaId == usuarioId);

        if (!string.IsNullOrWhiteSpace(estado))
            query = query.Where(e => e.EstadoAsistencia == estado);
        if (Validaciones.EsFecha(desde))
            query = query.Where(e => string.Compare(e.FechaHora, desde) >= 0);
        if (Validaciones.EsFecha(hasta))
            query = query.Where(e => string.Compare(e.FechaHora, hasta + "z") <= 0);

        var lista = await query.OrderBy(e => e.FechaHora).ToListAsync();
        return await MapearEntrevistasAsync(lista);
    }

    public async Task<EntrevistaDto?> GetEntrevistaAsync(int id, IReadOnlyCollection<string> roles, int usuarioId)
    {
        var entrevista = await _db.Entrevistas.AsNoTracking().FirstOrDefaultAsync(e => e.Id == id);
        if (entrevista == null) return null;
        if (!VeTodos(roles) && !roles.Contains("Administrativo") && entrevista.ResponsablePersonaId != usuarioId)
            return null;
        return (await MapearEntrevistasAsync(new List<Entrevista> { entrevista }))[0];
    }

    public async Task<CrudResult<EntrevistaDto>> CreateEntrevistaAsync(
        EntrevistaInput input, IReadOnlyCollection<string> roles, int usuarioId)
    {
        var datos = new EntrevistaLimpia();
        var error = await ValidarEntrevistaAsync(input, datos);
        if (error != null) return CrudResult<EntrevistaDto>.Fail(error);

        // Una entrevista sin candidato válido dejaría registros incoherentes.
        var candidato = await _db.Aspirantes.AsNoTracking()
            .FirstOrDefaultAsync(a => a.PersonaId == datos.AspirantePersonaId);
        if (candidato == null)
            return CrudResult<EntrevistaDto>.Fail("El candidato indicado no existe.");

        var hoy = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var entrevista = new Entrevista
        {
            AspirantePersonaId = datos.AspirantePersonaId,
            FechaHora = datos.FechaHora!,
            ResponsablePersonaId = datos.ResponsablePersonaId ?? usuarioId,
            EstadoAsistencia = datos.EstadoAsistencia ?? "Programada",
            Resultado = datos.Resultado,
            Observaciones = datos.Observaciones,
            ProximosPasos = datos.ProximosPasos,
            FechaSeguimiento = datos.FechaSeguimiento,
            FechaCreacion = hoy,
            FechaActualizacion = hoy,
        };
        _db.Entrevistas.Add(entrevista);
        await _db.SaveChangesAsync();

        return CrudResult<EntrevistaDto>.Success(
            (await MapearEntrevistasAsync(new List<Entrevista> { entrevista }))[0]);
    }

    public async Task<CrudResult<EntrevistaDto>> UpdateEntrevistaAsync(
        int id, EntrevistaInput input, IReadOnlyCollection<string> roles, int usuarioId)
    {
        var entrevista = await _db.Entrevistas.FirstOrDefaultAsync(e => e.Id == id);
        if (entrevista == null) return CrudResult<EntrevistaDto>.Fail("Entrevista no encontrada.");
        if (!VeTodos(roles) && !roles.Contains("Administrativo") && entrevista.ResponsablePersonaId != usuarioId)
            return CrudResult<EntrevistaDto>.Fail("Entrevista no encontrada.");

        var datos = new EntrevistaLimpia();
        var error = await ValidarEntrevistaAsync(input, datos);
        if (error != null) return CrudResult<EntrevistaDto>.Fail(error);

        var candidato = await _db.Aspirantes.AsNoTracking()
            .FirstOrDefaultAsync(a => a.PersonaId == datos.AspirantePersonaId);
        if (candidato == null)
            return CrudResult<EntrevistaDto>.Fail("El candidato indicado no existe.");

        entrevista.AspirantePersonaId = datos.AspirantePersonaId;
        entrevista.FechaHora = datos.FechaHora!;
        entrevista.ResponsablePersonaId = datos.ResponsablePersonaId ?? entrevista.ResponsablePersonaId;
        entrevista.EstadoAsistencia = datos.EstadoAsistencia ?? entrevista.EstadoAsistencia;
        entrevista.Resultado = datos.Resultado;
        entrevista.Observaciones = datos.Observaciones;
        entrevista.ProximosPasos = datos.ProximosPasos;
        entrevista.FechaSeguimiento = datos.FechaSeguimiento;
        entrevista.FechaActualizacion = DateTime.UtcNow.ToString("yyyy-MM-dd");

        await _db.SaveChangesAsync();
        return CrudResult<EntrevistaDto>.Success(
            (await MapearEntrevistasAsync(new List<Entrevista> { entrevista }))[0]);
    }

    public async Task<CrudResult<EntrevistaDto>> DeleteEntrevistaAsync(
        int id, IReadOnlyCollection<string> roles, int usuarioId)
    {
        var entrevista = await _db.Entrevistas.FirstOrDefaultAsync(e => e.Id == id);
        if (entrevista == null) return CrudResult<EntrevistaDto>.Fail("Entrevista no encontrada.");
        if (!VeTodos(roles) && !roles.Contains("Administrativo") && entrevista.ResponsablePersonaId != usuarioId)
            return CrudResult<EntrevistaDto>.Fail("Entrevista no encontrada.");

        _db.Entrevistas.Remove(entrevista);
        await _db.SaveChangesAsync();
        return CrudResult<EntrevistaDto>.Success(null!);
    }

    // ----------------------------------------------------------
    // Validaciones
    // ----------------------------------------------------------

    private async Task<string?> ValidarCandidatoAsync(CandidatoInput input, int? personaIdExistente, CandidatoLimpio datos)
    {
        var nombre = Validaciones.Texto(input.NombreCompleto);
        if (nombre.Length == 0) return "El nombre completo es obligatorio.";
        if (nombre.Length > 150) return "El nombre completo no puede superar los 150 caracteres.";

        var telefono = Validaciones.TextoOpcional(input.Telefono);
        var instagram = NormalizarInstagram(input.Instagram);

        // Se admite sin teléfono, pero debe existir alguna vía de contacto.
        if (string.IsNullOrWhiteSpace(telefono) && string.IsNullOrWhiteSpace(instagram))
            return "Indica al menos un medio de contacto: teléfono o Instagram.";

        if (!string.IsNullOrWhiteSpace(input.FechaNacimiento) && !Validaciones.EsFecha(input.FechaNacimiento))
            return "La fecha de nacimiento debe tener el formato yyyy-MM-dd.";
        if (!string.IsNullOrWhiteSpace(input.FechaContacto) && !Validaciones.EsFecha(input.FechaContacto))
            return "La fecha de contacto debe tener el formato yyyy-MM-dd.";
        if (!string.IsNullOrWhiteSpace(input.FechaRegistro) && !Validaciones.EsFecha(input.FechaRegistro))
            return "La fecha de registro debe tener el formato yyyy-MM-dd.";
        if (!string.IsNullOrWhiteSpace(input.FechaSeguimiento) && !Validaciones.EsFecha(input.FechaSeguimiento))
            return "La fecha de seguimiento debe tener el formato yyyy-MM-dd.";

        var estado = Validaciones.Texto(input.Estado);
        if (estado.Length == 0) estado = "Pendiente";
        if (!EstadosAdmisibles.Contains(estado))
            return $"Estado no válido: {estado}. Admitidos: {string.Join(", ", EstadosAdmisibles)}.";

        int? responsable = null;
        if (input.ResponsablePersonaId is int rid && rid != 0)
        {
            var esStaff = await _db.Staff.AnyAsync(s => s.PersonaId == rid);
            if (!esStaff) return "El responsable indicado no es un trabajador del sistema.";
            responsable = rid;
        }

        datos.NombreCompleto = nombre;
        datos.NombreSocial = Validaciones.TextoOpcional(input.NombreSocial);
        datos.FechaNacimiento = Validaciones.TextoOpcional(input.FechaNacimiento);
        datos.Telefono = telefono;
        datos.Correo = Validaciones.TextoOpcional(input.Correo);
        datos.Instagram = instagram;
        datos.Pronombres = Validaciones.TextoOpcional(input.Pronombres);
        datos.Estatura = Validaciones.TextoOpcional(input.Estatura);
        datos.MedioContacto = Validaciones.Texto(input.MedioContacto);
        datos.Estado = estado;
        datos.ResponsablePersonaId = responsable;
        datos.Notas = Validaciones.TextoOpcional(input.Notas);
        datos.ProximasAcciones = Validaciones.TextoOpcional(input.ProximasAcciones);
        datos.FechaContacto = Validaciones.TextoOpcional(input.FechaContacto);
        datos.FechaRegistro = Validaciones.TextoOpcional(input.FechaRegistro);
        datos.FechaSeguimiento = Validaciones.TextoOpcional(input.FechaSeguimiento);
        return null;
    }

    private async Task<string?> ValidarEntrevistaAsync(EntrevistaInput input, EntrevistaLimpia datos)
    {
        if (input.AspirantePersonaId is null or 0)
            return "Debes seleccionar un modelo candidato.";

        if (string.IsNullOrWhiteSpace(input.FechaHora))
            return "La fecha y hora son obligatorias.";
        if (!DateTime.TryParse(input.FechaHora, out _))
            return "La fecha y hora deben tener un formato válido (por ejemplo 2026-10-13T15:00).";

        var estado = Validaciones.Texto(input.EstadoAsistencia);
        if (estado.Length == 0) estado = "Programada";
        if (!EstadosEntrevista.Contains(estado))
            return $"Estado no válido: {estado}. Admitidos: {string.Join(", ", EstadosEntrevista)}.";

        if (!string.IsNullOrWhiteSpace(input.FechaSeguimiento) && !Validaciones.EsFecha(input.FechaSeguimiento))
            return "La fecha de seguimiento debe tener el formato yyyy-MM-dd.";

        int? responsable = null;
        if (input.ResponsablePersonaId is int rid && rid != 0)
        {
            var esStaff = await _db.Staff.AnyAsync(s => s.PersonaId == rid);
            if (!esStaff) return "El entrevistador indicado no es un trabajador del sistema.";
            responsable = rid;
        }

        datos.AspirantePersonaId = input.AspirantePersonaId.Value;
        datos.FechaHora = input.FechaHora!;
        datos.ResponsablePersonaId = responsable;
        datos.EstadoAsistencia = estado;
        datos.Resultado = Validaciones.TextoOpcional(input.Resultado);
        datos.Observaciones = Validaciones.TextoOpcional(input.Observaciones);
        datos.ProximosPasos = Validaciones.TextoOpcional(input.ProximosPasos);
        datos.FechaSeguimiento = Validaciones.TextoOpcional(input.FechaSeguimiento);
        return null;
    }

    // ----------------------------------------------------------
    // Utilidades
    // ----------------------------------------------------------

    private async Task<Persona?> BuscarDuplicadoAsync(string? instagram, string? telefono)
    {
        if (string.IsNullOrWhiteSpace(instagram) && string.IsNullOrWhiteSpace(telefono)) return null;
        var personas = await _db.Personas.AsNoTracking().ToListAsync();
        return personas.FirstOrDefault(p =>
            (!string.IsNullOrWhiteSpace(instagram) &&
             NormalizarInstagram(p.InstagramUsuario) == instagram) ||
            (!string.IsNullOrWhiteSpace(telefono) &&
             NormalizarTelefono(p.Telefono) == telefono));
    }

    internal static string? NormalizarInstagram(string? valor)
    {
        var limpio = (valor ?? "").Trim().TrimStart('@').ToLowerInvariant();
        if (limpio.Length == 0) return null;
        if (limpio.StartsWith("http")) limpio = limpio[(limpio.IndexOf('/', 8) >= 0 ? limpio.IndexOf('/', 8) + 1 : 0)..];
        var slash = limpio.LastIndexOf('/');
        if (slash >= 0 && slash < limpio.Length - 1) limpio = limpio[(slash + 1)..];
        return limpio.Length == 0 ? null : limpio;
    }

    internal static string? NormalizarTelefono(string? valor)
    {
        var digitos = new string((valor ?? "").Where(char.IsDigit).ToArray());
        return digitos.Length < 6 ? null : digitos;
    }

    private async Task<Dictionary<int, Persona>> CargarPersonas(IEnumerable<int> ids)
    {
        var lista = ids.Distinct().Where(i => i != 0).ToList();
        if (lista.Count == 0) return new Dictionary<int, Persona>();
        return await _db.Personas.AsNoTracking()
            .Where(p => lista.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id);
    }

    private async Task<Dictionary<int, string>> CargarNombres(IEnumerable<int?> ids)
    {
        var lista = ids.Where(i => i.HasValue && i.Value != 0).Select(i => i!.Value).Distinct().ToList();
        if (lista.Count == 0) return new Dictionary<int, string>();
        var personas = await _db.Personas.AsNoTracking().Where(p => lista.Contains(p.Id)).ToListAsync();
        return personas.ToDictionary(p => p.Id, p => p.NombreCompleto);
    }

    private async Task AbrirRolAsync(int personaId, string tipoRol, string fecha)
    {
        var tipo = await _db.TipoRoles.FirstOrDefaultAsync(t => t.Nombre == tipoRol);
        if (tipo == null) return;
        var yaActivo = await _db.RolPersonas.AnyAsync(r =>
            r.PersonaId == personaId && r.TipoRolId == tipo.Id && r.FechaFin == null);
        if (yaActivo) return;
        _db.RolPersonas.Add(new RolPersona
        {
            PersonaId = personaId,
            TipoRolId = tipo.Id,
            FechaInicio = fecha,
        });
    }

    private async Task CerrarRolAsync(int personaId, string tipoRol)
    {
        var tipo = await _db.TipoRoles.FirstOrDefaultAsync(t => t.Nombre == tipoRol);
        if (tipo == null) return;
        var hoy = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var abiertos = await _db.RolPersonas
            .Where(r => r.PersonaId == personaId && r.TipoRolId == tipo.Id && r.FechaFin == null)
            .ToListAsync();
        foreach (var rol in abiertos) rol.FechaFin = hoy;
    }

    // Al pasar a Descartado o Vinculado el rol de aspirante se cierra, de modo que
    // el alcance del Entrevistador (spec §3.2.3) surta efecto. Al vincular se abre
    // el rol de modelo (spec §6.1, paso 4).
    private async Task SincronizarRolPorEstadoAsync(int personaId, string estado)
    {
        if (estado == "Descartado" || estado == "Vinculado")
            await CerrarRolAsync(personaId, "Aspirante");

        if (estado == "Vinculado")
        {
            var hoy = DateTime.UtcNow.ToString("yyyy-MM-dd");
            await AbrirRolAsync(personaId, "Modelo", hoy);
            if (!await _db.Modelos.AnyAsync(m => m.PersonaId == personaId))
            {
                var persona = await _db.Personas.FirstOrDefaultAsync(p => p.Id == personaId);
                _db.Modelos.Add(new Modelo
                {
                    PersonaId = personaId,
                    NombreArtistico = persona?.NombreCompleto ?? "",
                    Genero = "",
                    Enfoque = "",
                    FechaInicioAgencia = hoy,
                });
            }
        }
        else if (estado == "Pendiente" || estado == "Entrevistado")
        {
            await AbrirRolAsync(personaId, "Aspirante", DateTime.UtcNow.ToString("yyyy-MM-dd"));
        }
    }

    private async Task<List<EntrevistaDto>> MapearEntrevistasAsync(List<Entrevista> entrevistas)
    {
        var ids = entrevistas.Select(e => e.AspirantePersonaId)
            .Concat(entrevistas.Select(e => e.ResponsablePersonaId))
            .Where(i => i != 0).Distinct().ToList();

        var personas = await _db.Personas.AsNoTracking()
            .Where(p => ids.Contains(p.Id)).ToDictionaryAsync(p => p.Id);

        return entrevistas.Select(e =>
        {
            personas.TryGetValue(e.AspirantePersonaId, out var candidato);
            personas.TryGetValue(e.ResponsablePersonaId, out var responsable);
            return new EntrevistaDto
            {
                Id = e.Id,
                AspirantePersonaId = e.AspirantePersonaId,
                ModeloNombre = candidato?.NombreCompleto ?? "",
                ModeloInstagram = candidato?.InstagramUsuario,
                ModeloTelefono = candidato?.Telefono,
                FechaHora = e.FechaHora,
                ResponsablePersonaId = e.ResponsablePersonaId,
                ResponsableNombre = responsable?.NombreCompleto ?? "",
                EstadoAsistencia = e.EstadoAsistencia,
                Resultado = e.Resultado,
                Observaciones = e.Observaciones,
                ProximosPasos = e.ProximosPasos,
                FechaSeguimiento = e.FechaSeguimiento,
                FechaCreacion = e.FechaCreacion,
                FechaActualizacion = e.FechaActualizacion,
            };
        }).ToList();
    }

    private static bool Contiene(string? valor, string busqueda)
        => !string.IsNullOrWhiteSpace(valor) &&
           valor.Contains(busqueda, StringComparison.OrdinalIgnoreCase);

    private static CandidatoDto Mapear(Aspirante aspirante, Persona? persona, Dictionary<int, string>? responsables)
    {
        int? edad = null;
        if (DateTime.TryParse(persona?.FechaNacimiento, out var nacimiento))
        {
            var hoy = DateTime.UtcNow;
            edad = hoy.Year - nacimiento.Year -
                   (hoy.DayOfYear < nacimiento.DayOfYear ? 1 : 0);
        }

        string? responsable = null;
        if (aspirante.ResponsablePersonaId is int rid && responsables != null)
            responsables.TryGetValue(rid, out responsable);

        return new CandidatoDto
        {
            PersonaId = aspirante.PersonaId,
            Nombre = persona?.NombreCompleto ?? "",
            NombreSocial = aspirante.NombreSocial,
            FechaNacimiento = persona?.FechaNacimiento,
            Edad = edad,
            Telefono = persona?.Telefono,
            Correo = persona?.Correo,
            Instagram = persona?.InstagramUsuario,
            Pronombres = aspirante.Pronombres,
            Estatura = aspirante.Estatura,
            Estado = aspirante.Estado,
            ResponsablePersonaId = aspirante.ResponsablePersonaId,
            ResponsableNombre = responsable,
            MedioContacto = aspirante.MedioContacto,
            Notas = aspirante.Notas,
            ProximasAcciones = aspirante.ProximasAcciones,
            FechaContacto = aspirante.FechaContacto,
            FechaRegistro = aspirante.FechaRegistro,
            FechaEstado = aspirante.FechaEstado,
            FechaSeguimiento = aspirante.FechaSeguimiento,
            FechaCreacion = persona?.FechaCreacion,
        };
    }

    private sealed class CandidatoLimpio
    {
        public string? NombreCompleto { get; set; }
        public string? NombreSocial { get; set; }
        public string? FechaNacimiento { get; set; }
        public string? Telefono { get; set; }
        public string? Correo { get; set; }
        public string? Instagram { get; set; }
        public string? Pronombres { get; set; }
        public string? Estatura { get; set; }
        public string? MedioContacto { get; set; }
        public string? Estado { get; set; }
        public int? ResponsablePersonaId { get; set; }
        public string? Notas { get; set; }
        public string? ProximasAcciones { get; set; }
        public string? FechaContacto { get; set; }
        public string? FechaRegistro { get; set; }
        public string? FechaSeguimiento { get; set; }
    }

    private sealed class EntrevistaLimpia
    {
        public int AspirantePersonaId { get; set; }
        public string? FechaHora { get; set; }
        public int? ResponsablePersonaId { get; set; }
        public string? EstadoAsistencia { get; set; }
        public string? Resultado { get; set; }
        public string? Observaciones { get; set; }
        public string? ProximosPasos { get; set; }
        public string? FechaSeguimiento { get; set; }
    }
}

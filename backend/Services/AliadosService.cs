using Crono.Api.Data;
using Crono.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Crono.Api.Services;

// ============================================================
// Scouter de aliados: red de contactos creativos + locaciones aliadas
// ============================================================

public class AliadoInput
{
    public string? NombreCompleto { get; set; }
    public string? NombreProfesional { get; set; }
    public string? Telefono { get; set; }
    public string? Correo { get; set; }
    public string? Instagram { get; set; }
    public string? TikTok { get; set; }
    public string? OtrosContactos { get; set; }
    // Uno o varios roles creativos sobre la misma persona (sin duplicar la ficha).
    public List<string>? RolesCreativos { get; set; }
    public string? Enfoque { get; set; }
    public string? ModalidadVinculacion { get; set; }
    public string? Descripcion { get; set; }
    public string? Observaciones { get; set; }
    public int? ResponsablePersonaId { get; set; }
    public string? EstadoRelacion { get; set; }
    public bool? EsRecluta { get; set; }
    public bool? EsAliado { get; set; }
    public string? FechaAceptacionLineamientos { get; set; }
    public string? FechaRegistro { get; set; }
}

public class AliadoDto
{
    public int PersonaId { get; set; }
    public string Nombre { get; set; } = "";
    public string? NombreProfesional { get; set; }
    public string? Telefono { get; set; }
    public string? Correo { get; set; }
    public string? Instagram { get; set; }
    public string? TikTok { get; set; }
    public string? OtrosContactos { get; set; }
    public string Categoria { get; set; } = "";
    public List<string> RolesCreativos { get; set; } = new();
    public string? Enfoque { get; set; }
    public string? ModalidadVinculacion { get; set; }
    public string? Descripcion { get; set; }
    public string? Observaciones { get; set; }
    public int? ResponsablePersonaId { get; set; }
    public string? ResponsableNombre { get; set; }
    public string EstadoRelacion { get; set; } = "";
    public bool EsRecluta { get; set; }
    public bool EsAliado { get; set; }
    public string? FechaAceptacionLineamientos { get; set; }
    public string FechaRegistro { get; set; } = "";
    public string? FechaActualizacion { get; set; }
    public int Locaciones { get; set; }
}

public class LocacionAliadaInput
{
    public string? Nombre { get; set; }
    public string? Direccion { get; set; }
    public string? ContactoNombre { get; set; }
    public string? ContactoTelefono { get; set; }
    public string? ContactoRedes { get; set; }
    public string? Descripcion { get; set; }
    public string? CondicionesCanje { get; set; }
    public string? Disponibilidad { get; set; }
    public string? Observaciones { get; set; }
    public string? Estado { get; set; }
    public int? ColaboradorPersonaId { get; set; }
    public int? ResponsablePersonaId { get; set; }
}

// Sin costo ni tarifa: no es un recurso comercial de Producción.
public class LocacionAliadaDto
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
    public string Estado { get; set; } = "";
    public int? ColaboradorPersonaId { get; set; }
    public string? ColaboradorNombre { get; set; }
    public int? ResponsablePersonaId { get; set; }
    public string? ResponsableNombre { get; set; }
    public string FechaRegistro { get; set; } = "";
    public string? FechaActualizacion { get; set; }
}

public interface IAliadosService
{
    // Categorías de categoria_colaborador (spec §DBML), reutilizadas como roles creativos.
    IReadOnlyCollection<string> RolesCreativosAdmisibles { get; }
    IReadOnlyCollection<string> EnfoquesAdmisibles { get; }
    IReadOnlyCollection<string> ModalidadesAdmisibles { get; }
    IReadOnlyCollection<string> EstadosLocacion { get; }

    Task<List<AliadoDto>> ListAsync(string? estado, string? busqueda);
    Task<AliadoDto?> GetAsync(int personaId);
    Task<CrudResult<AliadoDto>> CreateAsync(AliadoInput input, IReadOnlyCollection<string> roles, int usuarioId);
    Task<CrudResult<AliadoDto>> UpdateAsync(int personaId, AliadoInput input, IReadOnlyCollection<string> roles, int usuarioId);
    Task<CrudResult<AliadoDto>> DeleteAsync(int personaId, IReadOnlyCollection<string> roles, int usuarioId);

    Task<List<LocacionAliadaDto>> ListLocacionesAsync(string? estado, string? busqueda);
    Task<LocacionAliadaDto?> GetLocacionAsync(int id);
    Task<CrudResult<LocacionAliadaDto>> CreateLocacionAsync(LocacionAliadaInput input, IReadOnlyCollection<string> roles, int usuarioId);
    Task<CrudResult<LocacionAliadaDto>> UpdateLocacionAsync(int id, LocacionAliadaInput input, IReadOnlyCollection<string> roles, int usuarioId);
    Task<CrudResult<LocacionAliadaDto>> DeleteLocacionAsync(int id, IReadOnlyCollection<string> roles, int usuarioId);
}

public class AliadosService : IAliadosService
{
    // categoria_colaborador del DBML. "Locaciones" identifica al aliado que cede
    // un espacio, pero la locación en sí se guarda en su propia tabla.
    public IReadOnlyCollection<string> RolesCreativosAdmisibles { get; } = new[]
    {
        "Fotografía", "Estilismo", "Dirección creativa", "Apoyo",
        "Locaciones", "Recursos", "Directorio operativo",
    };

    public IReadOnlyCollection<string> EnfoquesAdmisibles { get; } = new[]
    { "moda", "urbano", "editorial", "beauty", "otros" };

    public IReadOnlyCollection<string> ModalidadesAdmisibles { get; } = new[]
    { "Red de Producción", "Alianza Creativa", "Mixta" };

    // Catálogo propuesto para el estado de la alianza: la spec no define uno.
    public IReadOnlyCollection<string> EstadosLocacion { get; } = new[]
    { "Propuesta", "En revisión", "Activa", "Inactiva" };

    private const int MaxRoles = 6;

    private readonly CronoDbContext _db;

    public AliadosService(CronoDbContext db) => _db = db;

    private static bool PuedeEscribir(IReadOnlyCollection<string> roles)
        => roles.Contains("Dueño") || roles.Contains("Scouter de Aliados") || roles.Contains("Administrativo");

    // ----------------------------------------------------------
    // Aliados creativos
    // ----------------------------------------------------------

    public async Task<List<AliadoDto>> ListAsync(string? estado, string? busqueda)
    {
        var query = _db.Colaboradores.AsQueryable();
        if (!string.IsNullOrWhiteSpace(estado))
            query = query.Where(c => c.EstadoContrato == estado);
        if (!string.IsNullOrWhiteSpace(busqueda))
            query = query.Where(c => c.Categoria.Contains(busqueda));

        var lista = await query.OrderBy(c => c.Categoria).ThenBy(c => c.PersonaId).ToListAsync();
        return await MapearAsync(lista, busqueda);
    }

    public async Task<AliadoDto?> GetAsync(int personaId)
    {
        var colaborador = await _db.Colaboradores.AsNoTracking()
            .FirstOrDefaultAsync(c => c.PersonaId == personaId);
        if (colaborador == null) return null;
        return (await MapearAsync(new List<Colaborador> { colaborador }))[0];
    }

    public async Task<CrudResult<AliadoDto>> CreateAsync(
        AliadoInput input, IReadOnlyCollection<string> roles, int usuarioId)
    {
        if (!PuedeEscribir(roles)) return CrudResult<AliadoDto>.Fail("No tienes permiso para crear aliados.");

        var datos = new AliadoLimpio();
        var error = await ValidarAsync(input, null, datos);
        if (error != null) return CrudResult<AliadoDto>.Fail(error);

        var duplicado = await BuscarDuplicadoAsync(datos.Instagram, datos.Telefono);
        if (duplicado != null)
            return CrudResult<AliadoDto>.Fail(
                $"Ya existe una ficha con el mismo contacto ({duplicado.NombreCompleto}, " +
                $"persona {duplicado.Id}).");

        var hoy = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var persona = new Persona
        {
            NombreCompleto = datos.NombreCompleto!,
            Telefono = datos.Telefono,
            Correo = datos.Correo,
            InstagramUsuario = datos.Instagram,
            FechaCreacion = hoy,
            CreadoPorPersonaId = usuarioId,
        };
        _db.Personas.Add(persona);
        await _db.SaveChangesAsync();

        var colaborador = new Colaborador
        {
            PersonaId = persona.Id,
            // Se conserva sincronizada con el primer rol: la usa el módulo de Producción.
            Categoria = datos.RolesCreativos![0],
            EsRecluta = datos.EsRecluta,
            EsAliado = datos.EsAliado,
            EstadoContrato = datos.EstadoRelacion ?? "Activo",
            RolesCreativos = datos.RolesCreativos,
            NombreProfesional = datos.NombreProfesional,
            TikTok = datos.TikTok,
            OtrosContactos = datos.OtrosContactos,
            Enfoque = datos.Enfoque,
            ModalidadVinculacion = datos.ModalidadVinculacion,
            Descripcion = datos.Descripcion,
            Observaciones = datos.Observaciones,
            ResponsablePersonaId = datos.ResponsablePersonaId ?? usuarioId,
            FechaAceptacionLineamientos = datos.FechaAceptacionLineamientos,
            FechaRegistro = datos.FechaRegistro ?? hoy,
            FechaActualizacion = hoy,
        };
        _db.Colaboradores.Add(colaborador);
        await _db.SaveChangesAsync();

        return CrudResult<AliadoDto>.Success((await MapearAsync(new List<Colaborador> { colaborador }))[0]);
    }

    public async Task<CrudResult<AliadoDto>> UpdateAsync(
        int personaId, AliadoInput input, IReadOnlyCollection<string> roles, int usuarioId)
    {
        if (!PuedeEscribir(roles)) return CrudResult<AliadoDto>.Fail("No tienes permiso para editar aliados.");

        var colaborador = await _db.Colaboradores.FirstOrDefaultAsync(c => c.PersonaId == personaId);
        if (colaborador == null) return CrudResult<AliadoDto>.Fail("Aliado no encontrado.");
        var persona = await _db.Personas.FirstOrDefaultAsync(p => p.Id == personaId);
        if (persona == null) return CrudResult<AliadoDto>.Fail("Aliado no encontrado.");

        var datos = new AliadoLimpio();
        var error = await ValidarAsync(input, personaId, datos);
        if (error != null) return CrudResult<AliadoDto>.Fail(error);

        var duplicado = await BuscarDuplicadoAsync(datos.Instagram, datos.Telefono);
        if (duplicado != null && duplicado.Id != personaId)
            return CrudResult<AliadoDto>.Fail(
                $"Ya existe otra ficha con el mismo contacto ({duplicado.NombreCompleto}, persona {duplicado.Id}).");

        persona.NombreCompleto = datos.NombreCompleto!;
        persona.Telefono = datos.Telefono;
        persona.Correo = datos.Correo;
        persona.InstagramUsuario = datos.Instagram;

        colaborador.Categoria = datos.RolesCreativos![0];
        colaborador.EsRecluta = datos.EsRecluta;
        colaborador.EsAliado = datos.EsAliado;
        colaborador.EstadoContrato = datos.EstadoRelacion ?? colaborador.EstadoContrato;
        colaborador.RolesCreativos = datos.RolesCreativos;
        colaborador.NombreProfesional = datos.NombreProfesional;
        colaborador.TikTok = datos.TikTok;
        colaborador.OtrosContactos = datos.OtrosContactos;
        colaborador.Enfoque = datos.Enfoque;
        colaborador.ModalidadVinculacion = datos.ModalidadVinculacion;
        colaborador.Descripcion = datos.Descripcion;
        colaborador.Observaciones = datos.Observaciones;
        colaborador.ResponsablePersonaId = datos.ResponsablePersonaId ?? colaborador.ResponsablePersonaId;
        colaborador.FechaAceptacionLineamientos = datos.FechaAceptacionLineamientos;
        colaborador.FechaRegistro = datos.FechaRegistro ?? colaborador.FechaRegistro;
        colaborador.FechaActualizacion = DateTime.UtcNow.ToString("yyyy-MM-dd");

        await _db.SaveChangesAsync();
        return CrudResult<AliadoDto>.Success((await MapearAsync(new List<Colaborador> { colaborador }))[0]);
    }

    public async Task<CrudResult<AliadoDto>> DeleteAsync(
        int personaId, IReadOnlyCollection<string> roles, int usuarioId)
    {
        if (!roles.Contains("Dueño"))
            return CrudResult<AliadoDto>.Fail("Solo el Dueño puede eliminar aliados.");

        var colaborador = await _db.Colaboradores.FirstOrDefaultAsync(c => c.PersonaId == personaId);
        if (colaborador == null) return CrudResult<AliadoDto>.Fail("Aliado no encontrado.");

        var locaciones = await _db.LocacionesAliadas.CountAsync(l => l.ColaboradorPersonaId == personaId);
        if (locaciones > 0)
            return CrudResult<AliadoDto>.Fail(
                $"El aliado tiene {locaciones} locaciones vinculadas. Desactiva el " +
                "aliado en lugar de eliminarlo para conservar la relación.");

        // Baja con trazabilidad: se marca el estado y no se borra la Persona,
        // que puede estar referenciada por otras tablas.
        colaborador.EstadoContrato = "Inactivo";
        colaborador.FechaActualizacion = DateTime.UtcNow.ToString("yyyy-MM-dd");
        await _db.SaveChangesAsync();
        return CrudResult<AliadoDto>.Success((await MapearAsync(new List<Colaborador> { colaborador }))[0]);
    }

    // ----------------------------------------------------------
    // Locaciones aliadas
    // ----------------------------------------------------------

    public async Task<List<LocacionAliadaDto>> ListLocacionesAsync(string? estado, string? busqueda)
    {
        var query = _db.LocacionesAliadas.AsQueryable();
        if (!string.IsNullOrWhiteSpace(estado))
            query = query.Where(l => l.Estado == estado);
        if (!string.IsNullOrWhiteSpace(busqueda))
            query = query.Where(l => l.Nombre.Contains(busqueda) || l.Direccion!.Contains(busqueda));

        var lista = await query.OrderByDescending(l => l.FechaRegistro).ToListAsync();
        return await MapearLocacionesAsync(lista);
    }

    public async Task<LocacionAliadaDto?> GetLocacionAsync(int id)
    {
        var locacion = await _db.LocacionesAliadas.AsNoTracking().FirstOrDefaultAsync(l => l.Id == id);
        if (locacion == null) return null;
        return (await MapearLocacionesAsync(new List<LocacionAliada> { locacion }))[0];
    }

    public async Task<CrudResult<LocacionAliadaDto>> CreateLocacionAsync(
        LocacionAliadaInput input, IReadOnlyCollection<string> roles, int usuarioId)
    {
        if (!PuedeEscribir(roles)) return CrudResult<LocacionAliadaDto>.Fail("No tienes permiso para crear locaciones aliadas.");

        var datos = new LocacionLimpia();
        var error = await ValidarLocacionAsync(input, datos);
        if (error != null) return CrudResult<LocacionAliadaDto>.Fail(error);

        var hoy = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var locacion = new LocacionAliada
        {
            Nombre = datos.Nombre!,
            Direccion = datos.Direccion,
            ContactoNombre = datos.ContactoNombre,
            ContactoTelefono = datos.ContactoTelefono,
            ContactoRedes = datos.ContactoRedes,
            Descripcion = datos.Descripcion,
            CondicionesCanje = datos.CondicionesCanje,
            Disponibilidad = datos.Disponibilidad,
            Observaciones = datos.Observaciones,
            Estado = datos.Estado ?? "Propuesta",
            ColaboradorPersonaId = datos.ColaboradorPersonaId,
            ResponsablePersonaId = datos.ResponsablePersonaId ?? usuarioId,
            FechaRegistro = hoy,
            FechaActualizacion = hoy,
        };
        _db.LocacionesAliadas.Add(locacion);
        await _db.SaveChangesAsync();

        return CrudResult<LocacionAliadaDto>.Success(
            (await MapearLocacionesAsync(new List<LocacionAliada> { locacion }))[0]);
    }

    public async Task<CrudResult<LocacionAliadaDto>> UpdateLocacionAsync(
        int id, LocacionAliadaInput input, IReadOnlyCollection<string> roles, int usuarioId)
    {
        if (!PuedeEscribir(roles)) return CrudResult<LocacionAliadaDto>.Fail("No tienes permiso para editar locaciones aliadas.");

        var locacion = await _db.LocacionesAliadas.FirstOrDefaultAsync(l => l.Id == id);
        if (locacion == null) return CrudResult<LocacionAliadaDto>.Fail("Locación no encontrada.");

        var datos = new LocacionLimpia();
        var error = await ValidarLocacionAsync(input, datos);
        if (error != null) return CrudResult<LocacionAliadaDto>.Fail(error);

        locacion.Nombre = datos.Nombre!;
        locacion.Direccion = datos.Direccion;
        locacion.ContactoNombre = datos.ContactoNombre;
        locacion.ContactoTelefono = datos.ContactoTelefono;
        locacion.ContactoRedes = datos.ContactoRedes;
        locacion.Descripcion = datos.Descripcion;
        locacion.CondicionesCanje = datos.CondicionesCanje;
        locacion.Disponibilidad = datos.Disponibilidad;
        locacion.Observaciones = datos.Observaciones;
        locacion.Estado = datos.Estado ?? locacion.Estado;
        locacion.ColaboradorPersonaId = datos.ColaboradorPersonaId;
        locacion.ResponsablePersonaId = datos.ResponsablePersonaId ?? locacion.ResponsablePersonaId;
        locacion.FechaActualizacion = DateTime.UtcNow.ToString("yyyy-MM-dd");

        await _db.SaveChangesAsync();
        return CrudResult<LocacionAliadaDto>.Success(
            (await MapearLocacionesAsync(new List<LocacionAliada> { locacion }))[0]);
    }

    public async Task<CrudResult<LocacionAliadaDto>> DeleteLocacionAsync(
        int id, IReadOnlyCollection<string> roles, int usuarioId)
    {
        if (!roles.Contains("Dueño"))
            return CrudResult<LocacionAliadaDto>.Fail("Solo el Dueño puede eliminar locaciones aliadas.");

        var locacion = await _db.LocacionesAliadas.FirstOrDefaultAsync(l => l.Id == id);
        if (locacion == null) return CrudResult<LocacionAliadaDto>.Fail("Locación no encontrada.");

        _db.LocacionesAliadas.Remove(locacion);
        await _db.SaveChangesAsync();
        return CrudResult<LocacionAliadaDto>.Success(null!);
    }

    // ----------------------------------------------------------
    // Validaciones
    // ----------------------------------------------------------

    private async Task<string?> ValidarAsync(AliadoInput input, int? personaIdExistente, AliadoLimpio datos)
    {
        var nombre = Validaciones.Texto(input.NombreCompleto);
        if (nombre.Length == 0) return "El nombre completo es obligatorio.";
        if (nombre.Length > 150) return "El nombre completo no puede superar los 150 caracteres.";

        var roles = (input.RolesCreativos ?? new List<string>())
            .Select(Validaciones.Texto).Where(r => r.Length > 0)
            .Distinct().ToList();
        if (roles.Count == 0) return "Selecciona al menos un rol creativo.";
        if (roles.Count > MaxRoles) return $"Puedes asignar como máximo {MaxRoles} roles creativos.";
        var invalido = roles.FirstOrDefault(r => !RolesCreativosAdmisibles.Contains(r));
        if (invalido != null)
            return $"Rol creativo no válido: {invalido}. Admitidos: {string.Join(", ", RolesCreativosAdmisibles)}.";

        var enfoque = Validaciones.TextoOpcional(input.Enfoque);
        if (enfoque != null && !EnfoquesAdmisibles.Contains(enfoque))
            return $"Enfoque no válido: {enfoque}. Admitidos: {string.Join(", ", EnfoquesAdmisibles)}.";

        // La modalidad solo aplica a fotógrafos (§9.2 del encargo).
        var modalidad = Validaciones.TextoOpcional(input.ModalidadVinculacion);
        if (modalidad != null)
        {
            if (!ModalidadesAdmisibles.Contains(modalidad))
                return $"Modalidad no válida: {modalidad}. Admitidas: {string.Join(", ", ModalidadesAdmisibles)}.";
            if (!roles.Contains("Fotografía"))
                return "La modalidad de vinculación solo se asigna a quienes tienen el rol de Fotografía.";
        }

        if (!string.IsNullOrWhiteSpace(input.FechaAceptacionLineamientos) &&
            !Validaciones.EsFecha(input.FechaAceptacionLineamientos))
            return "La fecha de aceptación de lineamientos debe tener el formato yyyy-MM-dd.";
        if (!string.IsNullOrWhiteSpace(input.FechaRegistro) && !Validaciones.EsFecha(input.FechaRegistro))
            return "La fecha de registro debe tener el formato yyyy-MM-dd.";

        var estado = Validaciones.Texto(input.EstadoRelacion);
        if (estado.Length == 0) estado = "Activo";
        if (estado.Length > 50) return "El estado de la relación no puede superar los 50 caracteres.";

        var telefono = Validaciones.TextoOpcional(input.Telefono);
        var instagram = AspirantesService.NormalizarInstagram(input.Instagram);
        if (string.IsNullOrWhiteSpace(telefono) && string.IsNullOrWhiteSpace(instagram))
            return "Indica al menos un medio de contacto: teléfono o Instagram.";

        int? responsable = null;
        if (input.ResponsablePersonaId is int rid && rid != 0)
        {
            if (!await _db.Staff.AnyAsync(s => s.PersonaId == rid))
                return "El responsable indicado no es un trabajador del sistema.";
            responsable = rid;
        }

        datos.NombreCompleto = nombre;
        datos.NombreProfesional = Validaciones.TextoOpcional(input.NombreProfesional);
        datos.Telefono = telefono;
        datos.Correo = Validaciones.TextoOpcional(input.Correo);
        datos.Instagram = instagram;
        datos.TikTok = Validaciones.TextoOpcional(input.TikTok);
        datos.OtrosContactos = Validaciones.TextoOpcional(input.OtrosContactos);
        datos.RolesCreativos = roles;
        datos.Enfoque = enfoque;
        datos.ModalidadVinculacion = modalidad;
        datos.Descripcion = Validaciones.TextoOpcional(input.Descripcion);
        datos.Observaciones = Validaciones.TextoOpcional(input.Observaciones);
        datos.ResponsablePersonaId = responsable;
        datos.EstadoRelacion = estado;
        datos.EsRecluta = input.EsRecluta ?? false;
        datos.EsAliado = input.EsAliado ?? false;
        datos.FechaAceptacionLineamientos = Validaciones.TextoOpcional(input.FechaAceptacionLineamientos);
        datos.FechaRegistro = Validaciones.TextoOpcional(input.FechaRegistro);
        return null;
    }

    private async Task<string?> ValidarLocacionAsync(LocacionAliadaInput input, LocacionLimpia datos)
    {
        var nombre = Validaciones.Texto(input.Nombre);
        if (nombre.Length == 0) return "El nombre del espacio es obligatorio.";
        if (nombre.Length > 150) return "El nombre no puede superar los 150 caracteres.";

        var direccion = Validaciones.TextoOpcional(input.Direccion);
        if (direccion != null && direccion.Length > 300)
            return "La dirección no puede superar los 300 caracteres.";

        var estado = Validaciones.Texto(input.Estado);
        if (estado.Length == 0) estado = "Propuesta";
        if (!EstadosLocacion.Contains(estado))
            return $"Estado no válido: {estado}. Admitidos: {string.Join(", ", EstadosLocacion)}.";

        if (input.ColaboradorPersonaId is int cid && cid != 0)
        {
            if (!await _db.Colaboradores.AsNoTracking().AnyAsync(c => c.PersonaId == cid))
                return "El aliado indicado no existe.";
        }

        if (input.ResponsablePersonaId is int rid && rid != 0)
        {
            if (!await _db.Staff.AnyAsync(s => s.PersonaId == rid))
                return "El responsable indicado no es un trabajador del sistema.";
        }

        datos.Nombre = nombre;
        datos.Direccion = direccion;
        datos.ContactoNombre = Validaciones.TextoOpcional(input.ContactoNombre);
        datos.ContactoTelefono = Validaciones.TextoOpcional(input.ContactoTelefono);
        datos.ContactoRedes = Validaciones.TextoOpcional(input.ContactoRedes);
        datos.Descripcion = Validaciones.TextoOpcional(input.Descripcion);
        datos.CondicionesCanje = Validaciones.TextoOpcional(input.CondicionesCanje);
        datos.Disponibilidad = Validaciones.TextoOpcional(input.Disponibilidad);
        datos.Observaciones = Validaciones.TextoOpcional(input.Observaciones);
        datos.Estado = estado;
        datos.ColaboradorPersonaId = input.ColaboradorPersonaId is int c && c != 0 ? c : null;
        datos.ResponsablePersonaId = input.ResponsablePersonaId is int r && r != 0 ? r : null;
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
             AspirantesService.NormalizarInstagram(p.InstagramUsuario) == instagram) ||
            (!string.IsNullOrWhiteSpace(telefono) &&
             AspirantesService.NormalizarTelefono(p.Telefono) == telefono));
    }

    private async Task<List<AliadoDto>> MapearAsync(List<Colaborador> lista, string? busqueda = null)
    {
        if (lista.Count == 0) return new List<AliadoDto>();

        var ids = lista.Select(c => c.PersonaId).ToList();
        var personas = await _db.Personas.AsNoTracking().Where(p => ids.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id);

        var responsables = lista.Where(c => c.ResponsablePersonaId.HasValue)
            .Select(c => c.ResponsablePersonaId!.Value).Distinct().ToList();
        var nombres = responsables.Count > 0
            ? await _db.Personas.AsNoTracking().Where(p => responsables.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id, p => p.NombreCompleto)
            : new Dictionary<int, string>();

        var locaciones = await _db.LocacionesAliadas.AsNoTracking()
            .Where(l => ids.Contains(l.ColaboradorPersonaId ?? 0))
            .GroupBy(l => l.ColaboradorPersonaId)
            .Select(g => new { g.Key, Total = g.Count() })
            .ToDictionaryAsync(x => x.Key!.Value, x => x.Total);

        return lista
            .Select(c =>
            {
                personas.TryGetValue(c.PersonaId, out var persona);
                string? responsable = c.ResponsablePersonaId is int rid ? nombres.GetValueOrDefault(rid) : null;
                return new AliadoDto
                {
                    PersonaId = c.PersonaId,
                    Nombre = persona?.NombreCompleto ?? "",
                    NombreProfesional = c.NombreProfesional,
                    Telefono = persona?.Telefono,
                    Correo = persona?.Correo,
                    Instagram = persona?.InstagramUsuario,
                    TikTok = c.TikTok,
                    OtrosContactos = c.OtrosContactos,
                    Categoria = c.Categoria,
                    RolesCreativos = c.RolesCreativos ?? new List<string>(),
                    Enfoque = c.Enfoque,
                    ModalidadVinculacion = c.ModalidadVinculacion,
                    Descripcion = c.Descripcion,
                    Observaciones = c.Observaciones,
                    ResponsablePersonaId = c.ResponsablePersonaId,
                    ResponsableNombre = responsable,
                    EstadoRelacion = c.EstadoContrato,
                    EsRecluta = c.EsRecluta,
                    EsAliado = c.EsAliado,
                    FechaAceptacionLineamientos = c.FechaAceptacionLineamientos,
                    FechaRegistro = c.FechaRegistro,
                    FechaActualizacion = c.FechaActualizacion,
                    Locaciones = locaciones.GetValueOrDefault(c.PersonaId),
                };
            })
            .Where(a =>
                string.IsNullOrWhiteSpace(busqueda) ||
                a.Nombre.Contains(busqueda, StringComparison.OrdinalIgnoreCase) ||
                (a.NombreProfesional?.Contains(busqueda, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (a.Instagram?.Contains(busqueda, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (a.TikTok?.Contains(busqueda, StringComparison.OrdinalIgnoreCase) ?? false))
            .ToList();
    }

    private async Task<List<LocacionAliadaDto>> MapearLocacionesAsync(List<LocacionAliada> lista)
    {
        if (lista.Count == 0) return new List<LocacionAliadaDto>();

        var ids = lista.Select(l => l.ColaboradorPersonaId)
            .Concat(lista.Select(l => l.ResponsablePersonaId))
            .Where(i => i.HasValue && i.Value != 0).Select(i => i!.Value)
            .Distinct().ToList();

        var nombres = ids.Count > 0
            ? await _db.Personas.AsNoTracking().Where(p => ids.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id, p => p.NombreCompleto)
            : new Dictionary<int, string>();

        return lista.Select(l => new LocacionAliadaDto
        {
            Id = l.Id,
            Nombre = l.Nombre,
            Direccion = l.Direccion,
            ContactoNombre = l.ContactoNombre,
            ContactoTelefono = l.ContactoTelefono,
            ContactoRedes = l.ContactoRedes,
            Descripcion = l.Descripcion,
            CondicionesCanje = l.CondicionesCanje,
            Disponibilidad = l.Disponibilidad,
            Observaciones = l.Observaciones,
            Estado = l.Estado,
            ColaboradorPersonaId = l.ColaboradorPersonaId,
            ColaboradorNombre = l.ColaboradorPersonaId is int cid ? nombres.GetValueOrDefault(cid) : null,
            ResponsablePersonaId = l.ResponsablePersonaId,
            ResponsableNombre = l.ResponsablePersonaId is int rid ? nombres.GetValueOrDefault(rid) : null,
            FechaRegistro = l.FechaRegistro,
            FechaActualizacion = l.FechaActualizacion,
        }).ToList();
    }

    private sealed class AliadoLimpio
    {
        public string? NombreCompleto { get; set; }
        public string? NombreProfesional { get; set; }
        public string? Telefono { get; set; }
        public string? Correo { get; set; }
        public string? Instagram { get; set; }
        public string? TikTok { get; set; }
        public string? OtrosContactos { get; set; }
        public List<string>? RolesCreativos { get; set; }
        public string? Enfoque { get; set; }
        public string? ModalidadVinculacion { get; set; }
        public string? Descripcion { get; set; }
        public string? Observaciones { get; set; }
        public int? ResponsablePersonaId { get; set; }
        public string? EstadoRelacion { get; set; }
        public bool EsRecluta { get; set; }
        public bool EsAliado { get; set; }
        public string? FechaAceptacionLineamientos { get; set; }
        public string? FechaRegistro { get; set; }
    }

    private sealed class LocacionLimpia
    {
        public string? Nombre { get; set; }
        public string? Direccion { get; set; }
        public string? ContactoNombre { get; set; }
        public string? ContactoTelefono { get; set; }
        public string? ContactoRedes { get; set; }
        public string? Descripcion { get; set; }
        public string? CondicionesCanje { get; set; }
        public string? Disponibilidad { get; set; }
        public string? Observaciones { get; set; }
        public string? Estado { get; set; }
        public int? ColaboradorPersonaId { get; set; }
        public int? ResponsablePersonaId { get; set; }
    }
}

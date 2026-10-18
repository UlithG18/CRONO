using Crono.Api.Data;
using Crono.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Crono.Api.Services;

public class StaffItem
{
    public int PersonaId { get; set; }
    public string Nombre { get; set; } = "";
    // Rol principal: el de mayor alcance entre los roles asignados.
    public string Rol { get; set; } = "";
    public List<string> Roles { get; set; } = new();
    public string FechaContratacion { get; set; } = "";
    public string? Correo { get; set; }
    public string? Telefono { get; set; }
    public string? FechaNacimiento { get; set; }
    public string? InstagramUsuario { get; set; }
    public string? InstagramLink { get; set; }
    public string? FechaCreacion { get; set; }
}

public class StaffInput
{
    public string? Nombre { get; set; }
    public string? Correo { get; set; }
    public string? Telefono { get; set; }
    public string? FechaNacimiento { get; set; }
    public string? InstagramUsuario { get; set; }
    public string? InstagramLink { get; set; }
    public string? FechaContratacion { get; set; }
    public List<string>? Roles { get; set; }
}

public class StaffResult
{
    public bool Ok { get; set; }
    public string? Error { get; set; }
    public StaffItem? Data { get; set; }

    public static StaffResult Success(StaffItem item) => new() { Ok = true, Data = item };
    public static StaffResult Fail(string error) => new() { Ok = false, Error = error };
}

public interface IStaffService
{
    Task<List<StaffItem>> GetAllAsync();
    Task<StaffItem?> GetAsync(int personaId);
    Task<List<string>> GetRolesCatalogAsync();
    Task<StaffResult> CreateAsync(StaffInput input);
    Task<StaffResult> UpdateAsync(int personaId, StaffInput input);
    Task<StaffResult> DeleteAsync(int personaId);
}

public class StaffService : IStaffService
{
    private readonly CronoDbContext _db;
    private readonly IRbacService _rbac;

    public StaffService(CronoDbContext db, IRbacService rbac)
    {
        _db = db;
        _rbac = rbac;
    }

    public async Task<List<StaffItem>> GetAllAsync()
    {
        var staff = await _db.Staff
            .AsNoTracking()
            .Include(s => s.Persona)
            .OrderBy(s => s.Nombre)
            .ToListAsync();

        var rolesPorPersona = await _db.StaffRoles.AsNoTracking().ToListAsync();

        return staff.Select(s =>
        {
            var item = Map(s);
            item.Roles = rolesPorPersona
                .Where(r => r.PersonaId == s.PersonaId)
                .Select(r => r.Rol)
                .ToList();

            if (item.Roles.Count == 0 && !string.IsNullOrWhiteSpace(s.Rol))
                item.Roles = new List<string> { s.Rol };

            return item;
        }).ToList();
    }

    public async Task<StaffItem?> GetAsync(int personaId)
    {
        var list = await GetAllAsync();
        return list.FirstOrDefault(s => s.PersonaId == personaId);
    }

    public Task<List<string>> GetRolesCatalogAsync()
        => Task.FromResult(_rbac.GetKnownRoles());

    public async Task<StaffResult> CreateAsync(StaffInput input)
    {
        var roles = NormalizarRoles(input.Roles, out var errorRoles);
        if (errorRoles != null) return StaffResult.Fail(errorRoles);

        var nombre = (input.Nombre ?? "").Trim();
        if (nombre.Length == 0) return StaffResult.Fail("El nombre es obligatorio.");

        var correo = (input.Correo ?? "").Trim().ToLower();
        if (correo.Length == 0) return StaffResult.Fail("El correo es obligatorio.");
        if (!correo.Contains('@')) return StaffResult.Fail("El correo no tiene un formato válido.");

        var existe = await _db.Personas.AnyAsync(p => p.Correo != null && p.Correo.ToLower() == correo);
        if (existe) return StaffResult.Fail("Ya existe una persona con ese correo.");

        var hoy = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var persona = new Persona
        {
            NombreCompleto = nombre,
            Correo = correo,
            Telefono = (input.Telefono ?? "").Trim(),
            FechaNacimiento = (input.FechaNacimiento ?? "").Trim(),
            InstagramUsuario = (input.InstagramUsuario ?? "").Trim(),
            InstagramLink = (input.InstagramLink ?? "").Trim(),
            FechaCreacion = hoy,
        };
        _db.Personas.Add(persona);
        await _db.SaveChangesAsync();

        var principal = _rbac.ResolveScopeRole(roles);
        var staff = new Staff
        {
            PersonaId = persona.Id,
            Nombre = nombre,
            Rol = principal,
            FechaContratacion = string.IsNullOrWhiteSpace(input.FechaContratacion) ? hoy : input.FechaContratacion!.Trim(),
        };
        _db.Staff.Add(staff);

        _db.StaffRoles.AddRange(roles.Select(r => new StaffRol
        {
            PersonaId = persona.Id,
            Rol = r,
        }));

        await _db.SaveChangesAsync();

        return StaffResult.Success(await GetAsync(persona.Id) ?? Map(staff));
    }

    public async Task<StaffResult> UpdateAsync(int personaId, StaffInput input)
    {
        var staff = await _db.Staff.Include(s => s.Persona).FirstOrDefaultAsync(s => s.PersonaId == personaId);
        if (staff == null) return StaffResult.Fail("Trabajador no encontrado.");
        if (staff.Persona == null) return StaffResult.Fail("Trabajador sin persona asociada.");

        var roles = NormalizarRoles(input.Roles, out var errorRoles);
        if (errorRoles != null) return StaffResult.Fail(errorRoles);

        var nombre = (input.Nombre ?? "").Trim();
        if (nombre.Length == 0) return StaffResult.Fail("El nombre es obligatorio.");

        var correo = (input.Correo ?? "").Trim().ToLower();
        if (correo.Length == 0) return StaffResult.Fail("El correo es obligatorio.");
        if (!correo.Contains('@')) return StaffResult.Fail("El correo no tiene un formato válido.");

        var duplicado = await _db.Personas.AnyAsync(p =>
            p.Id != personaId && p.Correo != null && p.Correo.ToLower() == correo);
        if (duplicado) return StaffResult.Fail("Ya existe otra persona con ese correo.");

        // Datos personales
        staff.Persona.NombreCompleto = nombre;
        staff.Persona.Correo = correo;
        staff.Persona.Telefono = (input.Telefono ?? "").Trim();
        staff.Persona.FechaNacimiento = (input.FechaNacimiento ?? "").Trim();
        staff.Persona.InstagramUsuario = (input.InstagramUsuario ?? "").Trim();
        staff.Persona.InstagramLink = (input.InstagramLink ?? "").Trim();

        // Datos de staff
        staff.Nombre = nombre;
        if (!string.IsNullOrWhiteSpace(input.FechaContratacion))
            staff.FechaContratacion = input.FechaContratacion!.Trim();

        // Roles: se sustituyen únicamente por los enviados (la interfaz envía los
        // vigentes salvo que el administrador los cambie). Mínimo uno.
        // El rol Dueño no puede retirarse: sí pueden añadirse los demás roles.
        var existentes = await _db.StaffRoles.Where(r => r.PersonaId == personaId).ToListAsync();
        var teniaDueno = existentes.Any(r => r.Rol == "Dueño") || staff.Rol == "Dueño";
        if (teniaDueno && !roles.Contains("Dueño"))
            return StaffResult.Fail("El rol Dueño no puede retirarse de un trabajador; sí puede sumarse cualquier otro rol.");

        staff.Rol = _rbac.ResolveScopeRole(roles);

        _db.StaffRoles.RemoveRange(existentes);
        _db.StaffRoles.AddRange(roles.Select(r => new StaffRol
        {
            PersonaId = personaId,
            Rol = r,
        }));

        await _db.SaveChangesAsync();

        return StaffResult.Success(await GetAsync(personaId)!);
    }

    // Baja de trabajador. Se elimina la ficha de staff y la persona asociada,
    // junto con sus roles de trabajo. Se bloquea si la persona participa en
    // registros de negocio para no dejar referencias huérfanas.
    public async Task<StaffResult> DeleteAsync(int personaId)
    {
        var staff = await _db.Staff.Include(s => s.Persona)
            .FirstOrDefaultAsync(s => s.PersonaId == personaId);
        if (staff == null) return StaffResult.Fail("Trabajador no encontrado.");

        var rolesActuales = await _db.StaffRoles
            .Where(r => r.PersonaId == personaId)
            .Select(r => r.Rol)
            .ToListAsync();

        if (rolesActuales.Contains("Dueño") || staff.Rol == "Dueño")
            return StaffResult.Fail("No se puede eliminar un trabajador con el rol Dueño.");

        var vinculos = await VinculosAsync(personaId);
        if (vinculos.Count > 0)
            return StaffResult.Fail(
                $"No se puede eliminar: la persona está vinculada a {string.Join(", ", vinculos)}. " +
                "Revísalos antes de dar de baja el registro.");

        var roles = await _db.StaffRoles.Where(r => r.PersonaId == personaId).ToListAsync();
        _db.StaffRoles.RemoveRange(roles);
        _db.Staff.Remove(staff);
        if (staff.Persona != null) _db.Personas.Remove(staff.Persona);

        await _db.SaveChangesAsync();
        return StaffResult.Success(new StaffItem { PersonaId = personaId, Nombre = staff.Nombre });
    }

    // Tablas de negocio que referencian a la persona por su id.
    private async Task<List<string>> VinculosAsync(int personaId)
    {
        var vinculos = new List<string>();

        if (await _db.Modelos.AnyAsync(m => m.PersonaId == personaId)) vinculos.Add("ficha de modelo");
        if (await _db.Clientes.AnyAsync(c => c.PersonaId == personaId || c.BookerPersonaId == personaId)) vinculos.Add("fichas de cliente");
        if (await _db.Colaboradores.AnyAsync(c => c.PersonaId == personaId)) vinculos.Add("ficha de colaborador");
        if (await _db.Aspirantes.AnyAsync(a => a.PersonaId == personaId || a.ResponsablePersonaId == personaId)) vinculos.Add("fichas de aspirante");
        if (await _db.Matriculas.AnyAsync(m => m.EstudiantePersonaId == personaId)) vinculos.Add("matrículas de academia");
        if (await _db.Transacciones.AnyAsync(t => t.ContrapartePersonaId == personaId)) vinculos.Add("transacciones");
        if (await _db.Entrevistas.AnyAsync(e => e.AspirantePersonaId == personaId || e.ResponsablePersonaId == personaId)) vinculos.Add("entrevistas");
        if (await _db.AsignacionesBooker.AnyAsync(a => a.ModeloPersonaId == personaId || a.BookerPersonaId == personaId)) vinculos.Add("asignaciones de booking");
        if (await _db.ActasReunion.AnyAsync(a => a.AutorPersonaId == personaId)) vinculos.Add("minutas de reunión");
        if (await _db.CastingConvocatorias.AnyAsync(c => c.ResponsablePersonaId == personaId)) vinculos.Add("convocatorias de casting");
        if (await _db.CastingParticipantes.AnyAsync(p => p.AspirantePersonaId == personaId)) vinculos.Add("registros de casting");
        if (await _db.LocacionesAliadas.AnyAsync(l => l.ColaboradorPersonaId == personaId || l.ResponsablePersonaId == personaId)) vinculos.Add("locaciones aliadas");
        if (await _db.EnviosPublicos.AnyAsync(e => e.RevisionPersonaId == personaId || e.RegistroPersonaId == personaId)) vinculos.Add("envíos de formularios públicos");
        if (await _db.RolPersonas.AnyAsync(r => r.PersonaId == personaId)) vinculos.Add("roles de sistema (tipo_rol)");

        return vinculos;
    }

    // Valida y normaliza la lista de roles: sin duplicados, del catálogo y mínimo uno.
    private List<string>? NormalizarRoles(List<string>? roles, out string? error)
    {
        error = null;

        var limpios = (roles ?? new List<string>())
            .Where(r => !string.IsNullOrWhiteSpace(r))
            .Select(r => r.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (limpios.Count == 0)
        {
            error = "Debe asignarse al menos un rol al trabajador.";
            return null;
        }

        var catalogo = _rbac.GetKnownRoles();
        var desconocidos = limpios.Where(r => !catalogo.Contains(r, StringComparer.OrdinalIgnoreCase)).ToList();
        if (desconocidos.Count > 0)
        {
            error = $"Roles no válidos: {string.Join(", ", desconocidos)}.";
            return null;
        }

        // Se devuelven con la grafía canónica del catálogo.
        return limpios
            .Select(r => catalogo.First(c => string.Equals(c, r, StringComparison.OrdinalIgnoreCase)))
            .ToList();
    }

    private static StaffItem Map(Staff s) => new()
    {
        PersonaId = s.PersonaId,
        Nombre = s.Nombre,
        Rol = s.Rol,
        FechaContratacion = s.FechaContratacion,
        Correo = s.Persona?.Correo,
        Telefono = s.Persona?.Telefono,
        FechaNacimiento = s.Persona?.FechaNacimiento,
        InstagramUsuario = s.Persona?.InstagramUsuario,
        InstagramLink = s.Persona?.InstagramLink,
        FechaCreacion = s.Persona?.FechaCreacion,
    };
}

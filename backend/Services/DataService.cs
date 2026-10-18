using Crono.Api.Data;
using Crono.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Crono.Api.Services;

// Todos los métodos reciben la lista completa de roles del trabajador.
// El resultado es la UNIÓN de lo que cada uno de sus roles puede ver:
// un rol restringido solo limita la información si todos los roles la restringen.
public interface IDataService
{
    Task<List<Modelo>> GetModelosAsync(IReadOnlyCollection<string> roles, int? personaId);
    Task<List<Cliente>> GetClientesAsync(IReadOnlyCollection<string> roles, int? personaId);
    Task<List<Transaccion>> GetTransaccionesAsync(IReadOnlyCollection<string> roles);
    Task<List<Aspirante>> GetAspirantesAsync(IReadOnlyCollection<string> roles);
    Task<List<NotificacionNivel>> GetNotificacionesNivelAsync(IReadOnlyCollection<string> roles);
    Task<List<Produccion>> GetProduccionesAsync(IReadOnlyCollection<string> roles);
    Task<List<Persona>> GetPersonasAsync(IReadOnlyCollection<string> roles);
    Task<List<Corte>> GetCortesAsync(IReadOnlyCollection<string> roles);
    Task<List<CorteHistorial>> GetCorteHistorialAsync(IReadOnlyCollection<string> roles);
    Task<List<HabilidadActual>> GetHabilidadesAsync(IReadOnlyCollection<string> roles);
    Task<List<Entrevista>> GetEntrevistasAsync(IReadOnlyCollection<string> roles);
    Task<List<FormatoOficial>> GetFormatosAsync(IReadOnlyCollection<string> roles);
    Task<List<ActaReunion>> GetActasAsync(IReadOnlyCollection<string> roles);
    Task<List<Colaborador>> GetColaboradoresAsync(IReadOnlyCollection<string> roles);
    Task<List<Curso>> GetCursosAsync(IReadOnlyCollection<string> roles);
    Task<List<Matricula>> GetMatriculasAsync(IReadOnlyCollection<string> roles);
    Task<List<AsignacionBooker>> GetAsignacionesAsync(IReadOnlyCollection<string> roles);
    Task<List<RolPersona>> GetRolesAsync(IReadOnlyCollection<string> roles);
    Task<List<AspectoEvaluable>> GetAspectosAsync(IReadOnlyCollection<string> roles);
    Task<List<TipoRol>> GetTipoRolesAsync(IReadOnlyCollection<string> roles);
    Task<List<Documento>> GetDocumentosAsync(IReadOnlyCollection<string> roles);
    Task<List<Contrato>> GetContratosAsync(IReadOnlyCollection<string> roles, int? personaId);
    Task<Estadisticas> GetEstadisticasAsync();
}

public class Estadisticas
{
    public int ModelosActivos { get; set; }
    public int AspirantesEnProceso { get; set; }
    public int EstudiantesActivos { get; set; }
    public int NotifPendientes { get; set; }
    public int TotalProyectos { get; set; }
    public double Ingresos { get; set; }
    public double Egresos { get; set; }
    public double Inversiones { get; set; }
    public double Balance { get; set; }
}

public class DataService : IDataService
{
    // Roles sin acceso a modelos/clientes: en la unión solo privan si son todos.
    private static readonly string[] SinAccesoModelos = { "Producción", "Creativo" };

    // Roles que solo ven contratos y alertas de sus propias asignaciones.
    private static readonly string[] SinAccesoContratos =
        { "Entrevistador", "Scouter", "Producción", "Creativo", "Tesorería Agencia", "Tesorería Academia" };

    private static readonly string[] SinAccesoNotificaciones =
        { "Entrevistador", "Scouter", "Booker", "Producción", "Creativo" };

    private static readonly string[] SinAccesoPersonas = { "Producción", "Creativo" };

    // Roles con visibilidad administrativa completa.
    private static readonly string[] VisibilidadTotal = { "Dueño", "Administrativo" };

    private readonly CronoDbContext _db;

    public DataService(CronoDbContext db)
    {
        _db = db;
    }

    // Cierto si todos los roles entregados pertenecen a `restringidos`.
    // Si es así, la unión no aporta nada y aplica la restricción.
    private static bool TodosRestringidos(IReadOnlyCollection<string> roles, string[] restringidos)
        => roles.Count > 0 && roles.All(r => restringidos.Contains(r));

    public async Task<List<Modelo>> GetModelosAsync(IReadOnlyCollection<string> roles, int? personaId)
    {
        // Sin roles válidos no hay visibilidad.
        if (roles.Count == 0 || TodosRestringidos(roles, SinAccesoModelos)) return new List<Modelo>();

        var query = _db.Modelos.AsQueryable();

        // Solo se estrecha si todos los roles ven únicamente sus asignaciones.
        if (roles.All(r => r == "Booker") && personaId.HasValue)
        {
            var asignados = await _db.AsignacionesBooker
                .Where(a => a.BookerPersonaId == personaId && a.Activo)
                .Select(a => a.ModeloPersonaId).ToListAsync();
            query = query.Where(m => asignados.Contains(m.PersonaId));
        }

        return await query.ToListAsync();
    }

    public async Task<List<Cliente>> GetClientesAsync(IReadOnlyCollection<string> roles, int? personaId)
    {
        if (roles.Count == 0) return new List<Cliente>();

        var query = _db.Clientes.AsQueryable();

        if (roles.All(r => r == "Booker") && personaId.HasValue)
            query = query.Where(c => c.BookerPersonaId == personaId);

        return await query.ToListAsync();
    }

    public async Task<List<Transaccion>> GetTransaccionesAsync(IReadOnlyCollection<string> roles)
    {
        if (roles.Count == 0) return new List<Transaccion>();

        var query = _db.Transacciones.AsQueryable();

        var veAgencia = roles.Contains("Tesorería Agencia");
        var veAcademia = roles.Contains("Tesorería Academia");
        var veTodo = roles.Any(r => r != "Tesorería Agencia" && r != "Tesorería Academia");

        // La unión de ambas tesorerías equivale a ver todas las divisiones.
        if (!veTodo && veAgencia && veAcademia) veTodo = true;

        if (!veTodo)
        {
            if (veAgencia) query = query.Where(t => t.Division == "Agencia");
            else if (veAcademia) query = query.Where(t => t.Division == "Academia");
            else return new List<Transaccion>();
        }

        return await query.OrderByDescending(t => t.Fecha).ToListAsync();
    }

    public async Task<List<Aspirante>> GetAspirantesAsync(IReadOnlyCollection<string> roles)
    {
        if (roles.Count == 0) return new List<Aspirante>();
        return await _db.Aspirantes.Where(a => a.Estado != "Descartado").ToListAsync();
    }

    public async Task<List<NotificacionNivel>> GetNotificacionesNivelAsync(IReadOnlyCollection<string> roles)
    {
        if (roles.Count == 0 || TodosRestringidos(roles, SinAccesoNotificaciones))
            return new List<NotificacionNivel>();

        return await _db.NotificacionesNivel.ToListAsync();
    }

    public async Task<List<Produccion>> GetProduccionesAsync(IReadOnlyCollection<string> roles)
    {
        if (roles.Count == 0) return new List<Produccion>();

        var query = _db.Producciones.AsQueryable();

        // Creativo ve solo lo activo; si otro rol acompaña, se une la visión completa.
        if (roles.All(r => r == "Creativo"))
            query = query.Where(p => p.Estado != "Completado");

        return await query.OrderByDescending(p => p.Fecha).ToListAsync();
    }

    public async Task<List<Persona>> GetPersonasAsync(IReadOnlyCollection<string> roles)
    {
        if (roles.Count == 0 || TodosRestringidos(roles, SinAccesoPersonas)) return new List<Persona>();
        return await _db.Personas.OrderBy(p => p.NombreCompleto).ToListAsync();
    }

    public async Task<List<Corte>> GetCortesAsync(IReadOnlyCollection<string> roles)
    {
        if (roles.Count == 0 || TodosRestringidos(roles, SinAccesoPersonas)) return new List<Corte>();
        return await _db.Cortes.OrderBy(c => c.OrdenJerarquico).ToListAsync();
    }

    public async Task<List<CorteHistorial>> GetCorteHistorialAsync(IReadOnlyCollection<string> roles)
    {
        if (roles.Count == 0 || TodosRestringidos(roles, SinAccesoPersonas)) return new List<CorteHistorial>();
        return await _db.CorteHistorial.OrderByDescending(h => h.FechaAsignacion).ToListAsync();
    }

    public async Task<List<HabilidadActual>> GetHabilidadesAsync(IReadOnlyCollection<string> roles)
    {
        if (roles.Count == 0 || TodosRestringidos(roles, SinAccesoPersonas)) return new List<HabilidadActual>();
        return await _db.HabilidadActual.OrderByDescending(h => h.Fecha).ToListAsync();
    }

    public async Task<List<Entrevista>> GetEntrevistasAsync(IReadOnlyCollection<string> roles)
    {
        if (roles.Count == 0) return new List<Entrevista>();
        return await _db.Entrevistas.OrderByDescending(e => e.FechaHora).ToListAsync();
    }

    public async Task<List<FormatoOficial>> GetFormatosAsync(IReadOnlyCollection<string> roles)
    {
        var todos = await _db.FormatosOficiales.OrderBy(f => f.Categoria).ToListAsync();
        if (roles.Count == 0) return new List<FormatoOficial>();

        // Un solo rol con visibilidad total alcanza para ver todo el catálogo.
        if (roles.Any(r => VisibilidadTotal.Contains(r))) return todos;

        var rolesSet = roles.ToHashSet();
        return todos.Where(f => f.Roles != null && f.Roles.Any(rolesSet.Contains)).ToList();
    }

    public async Task<List<ActaReunion>> GetActasAsync(IReadOnlyCollection<string> roles)
    {
        if (roles.Count == 0 || !roles.Any(r => VisibilidadTotal.Contains(r)))
            return new List<ActaReunion>();

        return await _db.ActasReunion.OrderByDescending(a => a.Fecha).ToListAsync();
    }

    public async Task<List<Colaborador>> GetColaboradoresAsync(IReadOnlyCollection<string> roles)
    {
        if (roles.Count == 0) return new List<Colaborador>();
        return await _db.Colaboradores.ToListAsync();
    }

    public async Task<List<Curso>> GetCursosAsync(IReadOnlyCollection<string> roles)
    {
        if (roles.Count == 0) return new List<Curso>();
        return await _db.Cursos.OrderBy(c => c.Nombre).ToListAsync();
    }

    public async Task<List<Matricula>> GetMatriculasAsync(IReadOnlyCollection<string> roles)
    {
        if (roles.Count == 0) return new List<Matricula>();
        return await _db.Matriculas.ToListAsync();
    }

    public async Task<List<AsignacionBooker>> GetAsignacionesAsync(IReadOnlyCollection<string> roles)
    {
        if (roles.Count == 0 || TodosRestringidos(roles, SinAccesoPersonas))
            return new List<AsignacionBooker>();
        return await _db.AsignacionesBooker.Where(a => a.Activo).ToListAsync();
    }

    public async Task<List<RolPersona>> GetRolesAsync(IReadOnlyCollection<string> roles)
    {
        if (roles.Count == 0 || TodosRestringidos(roles, SinAccesoPersonas))
            return new List<RolPersona>();
        return await _db.RolPersonas.ToListAsync();
    }

    public async Task<List<AspectoEvaluable>> GetAspectosAsync(IReadOnlyCollection<string> roles)
    {
        if (roles.Count == 0) return new List<AspectoEvaluable>();
        return await _db.AspectosEvaluables.ToListAsync();
    }

    public async Task<List<TipoRol>> GetTipoRolesAsync(IReadOnlyCollection<string> roles)
    {
        if (roles.Count == 0) return new List<TipoRol>();
        return await _db.TipoRoles.ToListAsync();
    }

    public async Task<List<Documento>> GetDocumentosAsync(IReadOnlyCollection<string> roles)
    {
        var todos = await _db.Documentos
            .OrderBy(d => d.Departamento).ThenBy(d => d.Categoria).ThenBy(d => d.Nombre)
            .ToListAsync();

        if (roles.Count == 0) return new List<Documento>();
        if (roles.Any(r => VisibilidadTotal.Contains(r))) return todos;

        // Un documento sin roles declarados es de acceso administrativo general:
        // los restringidos solo suman sus propios documentos.
        var rolesSet = roles.ToHashSet();
        return todos
            .Where(d => d.Roles == null || d.Roles.Count == 0 || d.Roles.Any(rolesSet.Contains))
            .ToList();
    }

    public async Task<List<Contrato>> GetContratosAsync(IReadOnlyCollection<string> roles, int? personaId)
    {
        if (roles.Count == 0 || TodosRestringidos(roles, SinAccesoContratos))
            return new List<Contrato>();

        var query = _db.Contratos.AsQueryable();

        if (roles.All(r => r == "Booker") && personaId.HasValue)
        {
            var asignados = await _db.AsignacionesBooker
                .Where(a => a.BookerPersonaId == personaId && a.Activo)
                .Select(a => a.ModeloPersonaId).ToListAsync();
            query = query.Where(c => asignados.Contains(c.ModeloPersonaId));
        }

        return await query.OrderByDescending(c => c.FechaFirma).ToListAsync();
    }

    public async Task<Estadisticas> GetEstadisticasAsync()
    {
        var modelosActivos = await _db.RolPersonas.CountAsync(r => r.TipoRolId == 2 && r.FechaFin == null);
        var aspirantesEnProceso = await _db.Aspirantes.CountAsync(a => a.Estado != "Descartado" && a.Estado != "Vinculado");
        var estudiantesActivos = await _db.Matriculas.CountAsync(m => m.Estado == "Activo");
        var notifPendientes = await _db.NotificacionesNivel.CountAsync(n => n.Estado == "Pendiente");
        var totalProyectos = await _db.Producciones.CountAsync();
        var ingresos = await _db.Transacciones.Where(t => t.Tipo == "Ingreso").SumAsync(t => t.Valor);
        var egresos = await _db.Transacciones.Where(t => t.Tipo == "Egreso").SumAsync(t => t.Valor);
        var inversiones = await _db.Transacciones.Where(t => t.Tipo == "Inversión").SumAsync(t => t.Valor);

        return new Estadisticas
        {
            ModelosActivos = modelosActivos,
            AspirantesEnProceso = aspirantesEnProceso,
            EstudiantesActivos = estudiantesActivos,
            NotifPendientes = notifPendientes,
            TotalProyectos = totalProyectos,
            Ingresos = ingresos,
            Egresos = egresos,
            Inversiones = inversiones,
            Balance = ingresos - egresos - inversiones,
        };
    }
}

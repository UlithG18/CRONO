using Crono.Api.Data;
using Crono.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Crono.Api.Services;

// ============================================================
// Copys de comunicación + textos legales configurables
// ============================================================

public class CopyInput
{
    public string? Titulo { get; set; }
    public string? Contenido { get; set; }
    public string? Categoria { get; set; }
}

public class CopyDto
{
    public int Id { get; set; }
    public string Titulo { get; set; } = "";
    public string Contenido { get; set; } = "";
    public string Categoria { get; set; } = "";
    public string FechaCreacion { get; set; } = "";
    public string FechaActualizacion { get; set; } = "";
}

public class TextoLegalInput
{
    public string? Valor { get; set; }
}

public class TextoLegalDto
{
    public string Clave { get; set; } = "";
    public string Valor { get; set; } = "";
    public string FechaActualizacion { get; set; } = "";
    public int? ActualizadoPorPersonaId { get; set; }
    public string? ActualizadoPorNombre { get; set; }
}

public interface ICopysService
{
    IReadOnlyCollection<string> CategoriasAdmisibles { get; }
    // Claves de los textos legales. Vacías: el equipo de Crono debe aportarlas.
    IReadOnlyCollection<string> ClavesTextoLegal { get; }

    Task<List<CopyDto>> ListAsync(string? categoria, string? busqueda);
    Task<CrudResult<CopyDto>> CreateAsync(CopyInput input, IReadOnlyCollection<string> roles, int usuarioId);
    Task<CrudResult<CopyDto>> UpdateAsync(int id, CopyInput input, IReadOnlyCollection<string> roles, int usuarioId);
    Task<CrudResult<CopyDto>> DeleteAsync(int id, IReadOnlyCollection<string> roles, int usuarioId);

    Task<List<TextoLegalDto>> ListTextosLegalesAsync();
    Task<CrudResult<TextoLegalDto>> UpsertTextoLegalAsync(string clave, TextoLegalInput input, IReadOnlyCollection<string> roles, int usuarioId);
}

public class CopysService : ICopysService
{
    public IReadOnlyCollection<string> CategoriasAdmisibles { get; } = new[]
    {
        "Reclutamiento de Contactos",
        "Contacto Inicial",
        "Previnculación",
        "Entrevista",
        "Seguimiento",
        "Bienvenida",
    };

    // El aviso de confidencialidad y la autorización de tratamiento de datos son
    // textos legales: la spec no los aporta, por lo que solo se define dónde se
    // guardan y quién los edita. No se inventa ninguno.
    public IReadOnlyCollection<string> ClavesTextoLegal { get; } = new[]
    {
        "casting.aviso_confidencialidad",
        "casting.autorizacion_datos",
        "casting.condiciones",
        "red.aviso",
        "red.condiciones",
    };

    private readonly CronoDbContext _db;

    public CopysService(CronoDbContext db) => _db = db;

    // Escritura reservada a quien administra la documentación de reclutamiento.
    private static bool PuedeEscribir(IReadOnlyCollection<string> roles)
        => roles.Contains("Dueño") || roles.Contains("Administrativo");

    public async Task<List<CopyDto>> ListAsync(string? categoria, string? busqueda)
    {
        var query = _db.Copys.AsQueryable();
        if (!string.IsNullOrWhiteSpace(categoria))
            query = query.Where(c => c.Categoria == categoria);
        if (!string.IsNullOrWhiteSpace(busqueda))
            query = query.Where(c => c.Titulo.Contains(busqueda) || c.Contenido.Contains(busqueda));

        var lista = await query.OrderBy(c => c.Categoria).ThenBy(c => c.Titulo).ToListAsync();
        return lista.Select(Devolver).ToList();
    }

    public async Task<CrudResult<CopyDto>> CreateAsync(CopyInput input, IReadOnlyCollection<string> roles, int usuarioId)
    {
        if (!PuedeEscribir(roles)) return CrudResult<CopyDto>.Fail("No tienes permiso para crear copys.");

        var error = Validar(input, out var datos);
        if (error != null) return CrudResult<CopyDto>.Fail(error);

        var hoy = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var copy = new Copy
        {
            Titulo = datos.Titulo!,
            Contenido = datos.Contenido!,
            Categoria = datos.Categoria!,
            FechaCreacion = hoy,
            FechaActualizacion = hoy,
        };
        _db.Copys.Add(copy);
        await _db.SaveChangesAsync();
        return CrudResult<CopyDto>.Success(Devolver(copy));
    }

    public async Task<CrudResult<CopyDto>> UpdateAsync(int id, CopyInput input, IReadOnlyCollection<string> roles, int usuarioId)
    {
        if (!PuedeEscribir(roles)) return CrudResult<CopyDto>.Fail("No tienes permiso para editar copys.");

        var copy = await _db.Copys.FirstOrDefaultAsync(c => c.Id == id);
        if (copy == null) return CrudResult<CopyDto>.Fail("Copy no encontrado.");

        var error = Validar(input, out var datos);
        if (error != null) return CrudResult<CopyDto>.Fail(error);

        copy.Titulo = datos.Titulo!;
        copy.Contenido = datos.Contenido!;
        copy.Categoria = datos.Categoria!;
        copy.FechaActualizacion = DateTime.UtcNow.ToString("yyyy-MM-dd");

        await _db.SaveChangesAsync();
        return CrudResult<CopyDto>.Success(Devolver(copy));
    }

    public async Task<CrudResult<CopyDto>> DeleteAsync(int id, IReadOnlyCollection<string> roles, int usuarioId)
    {
        if (!PuedeEscribir(roles)) return CrudResult<CopyDto>.Fail("No tienes permiso para eliminar copys.");

        var copy = await _db.Copys.FirstOrDefaultAsync(c => c.Id == id);
        if (copy == null) return CrudResult<CopyDto>.Fail("Copy no encontrado.");

        _db.Copys.Remove(copy);
        await _db.SaveChangesAsync();
        return CrudResult<CopyDto>.Success(null!);
    }

    // ----------------------------------------------------------
    // Textos legales
    // ----------------------------------------------------------

    public async Task<List<TextoLegalDto>> ListTextosLegalesAsync()
    {
        var guardados = await _db.TextosLegales.AsNoTracking().ToListAsync();
        var porClave = guardados.ToDictionary(t => t.Clave);

        var ids = guardados.Where(t => t.ActualizadoPorPersonaId.HasValue)
            .Select(t => t.ActualizadoPorPersonaId!.Value).Distinct().ToList();
        var nombres = ids.Count > 0
            ? await _db.Personas.AsNoTracking().Where(p => ids.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id, p => p.NombreCompleto)
            : new Dictionary<int, string>();

        // Se devuelven siempre todas las claves: las no guardadas aparecen vacías,
        // para que el equipo sepa qué textos aún debe aportar.
        return ClavesTextoLegal.Select(clave =>
        {
            var existente = porClave.GetValueOrDefault(clave);
            int? autorId = existente?.ActualizadoPorPersonaId;
            return new TextoLegalDto
            {
                Clave = clave,
                Valor = existente?.Valor ?? "",
                FechaActualizacion = existente?.FechaActualizacion ?? "",
                ActualizadoPorPersonaId = autorId,
                ActualizadoPorNombre = autorId is int aid ? nombres.GetValueOrDefault(aid) : null,
            };
        }).ToList();
    }

    public async Task<CrudResult<TextoLegalDto>> UpsertTextoLegalAsync(
        string clave, TextoLegalInput input, IReadOnlyCollection<string> roles, int usuarioId)
    {
        if (!roles.Contains("Dueño"))
            return CrudResult<TextoLegalDto>.Fail("Solo el Dueño puede modificar los textos legales.");

        if (!ClavesTextoLegal.Contains(clave))
            return CrudResult<TextoLegalDto>.Fail(
                $"Clave no reconocida: {clave}. Admitidas: {string.Join(", ", ClavesTextoLegal)}.");

        var valor = Validaciones.TextoOpcional(input.Valor);
        if (valor != null && valor.Length > 8000)
            return CrudResult<TextoLegalDto>.Fail("El texto no puede superar los 8000 caracteres.");

        var registro = await _db.TextosLegales.FirstOrDefaultAsync(t => t.Clave == clave);
        if (registro == null)
        {
            registro = new TextoLegal { Clave = clave, Valor = valor ?? "" };
            _db.TextosLegales.Add(registro);
        }
        else
        {
            registro.Valor = valor ?? "";
        }

        registro.FechaActualizacion = DateTime.UtcNow.ToString("yyyy-MM-dd");
        registro.ActualizadoPorPersonaId = usuarioId;
        await _db.SaveChangesAsync();

        var persona = await _db.Personas.AsNoTracking().FirstOrDefaultAsync(p => p.Id == usuarioId);
        return CrudResult<TextoLegalDto>.Success(new TextoLegalDto
        {
            Clave = registro.Clave,
            Valor = registro.Valor,
            FechaActualizacion = registro.FechaActualizacion,
            ActualizadoPorPersonaId = registro.ActualizadoPorPersonaId,
            ActualizadoPorNombre = persona?.NombreCompleto,
        });
    }

    // ----------------------------------------------------------
    // Validaciones y mapeo
    // ----------------------------------------------------------

    private string? Validar(CopyInput input, out CopyLimpio datos)
    {
        datos = new CopyLimpio();

        var titulo = Validaciones.Texto(input.Titulo);
        if (titulo.Length == 0) return "El título es obligatorio.";
        if (titulo.Length > 150) return "El título no puede superar los 150 caracteres.";

        var contenido = Validaciones.TextoOpcional(input.Contenido);
        if (string.IsNullOrWhiteSpace(contenido)) return "El contenido del mensaje es obligatorio.";

        var categoria = Validaciones.Texto(input.Categoria);
        if (!CategoriasAdmisibles.Contains(categoria))
            return $"Categoría no válida: {categoria}. Admitidas: {string.Join(", ", CategoriasAdmisibles)}.";

        datos = new CopyLimpio { Titulo = titulo, Contenido = contenido!, Categoria = categoria };
        return null;
    }

    private static CopyDto Devolver(Copy copy) => new()
    {
        Id = copy.Id,
        Titulo = copy.Titulo,
        Contenido = copy.Contenido,
        Categoria = copy.Categoria,
        FechaCreacion = copy.FechaCreacion,
        FechaActualizacion = copy.FechaActualizacion,
    };

    private sealed class CopyLimpio
    {
        public string? Titulo { get; set; }
        public string? Contenido { get; set; }
        public string? Categoria { get; set; }
    }
}

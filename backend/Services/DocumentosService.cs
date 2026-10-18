using Crono.Api.Data;
using Crono.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Crono.Api.Services;

public class DocumentoInput
{
    public string? Departamento { get; set; }
    public string? Categoria { get; set; }
    public string? Nombre { get; set; }
    public string? Descripcion { get; set; }
    public string? Tipo { get; set; }
    // Enlace al archivo en el repositorio externo (Drive). Opcional: mientras no
    // exista el archivo real el registro queda sin enlace, nunca con uno simulado.
    public string? Enlace { get; set; }
    public string? Fecha { get; set; }
    // Roles con acceso. Vacío = acceso administrativo general.
    public List<string>? Roles { get; set; }
}

public interface IDocumentosService
{
    // `departamentos` es el ámbito del módulo que invoca: ningún controlador puede
    // leer ni alterar registros de otro departamento.
    Task<List<Documento>> ListAsync(IReadOnlyCollection<string> departamentos, string? categoria);
    Task<Documento?> GetAsync(int id, IReadOnlyCollection<string> departamentos);
    Task<CrudResult<Documento>> CreateAsync(DocumentoInput input, IReadOnlyCollection<string> departamentos);
    Task<CrudResult<Documento>> UpdateAsync(int id, DocumentoInput input, IReadOnlyCollection<string> departamentos);
    Task<CrudResult<Documento>> DeleteAsync(int id, IReadOnlyCollection<string> departamentos);
}

public class DocumentosService : IDocumentosService
{
    // Estructura documental vigente: departamento → categorías admisibles.
    // Coincide con las secciones del módulo administrativo.
    public static readonly Dictionary<string, string[]> CategoriasPorDepartamento = new()
    {
        ["ceo-direccion"] = new[] { "legal", "institucional" },
        ["formatos"] = new[] { "logos", "papeleria", "plantillas" },
        ["junta-oraculo"] = new[] { "horizonte", "minutas" },
        ["reclutamiento"] = new[] { "contactos", "ruta-modelos" },
    };

    public static readonly string[] TiposAdmisibles = { "Documento", "Logo", "Plantilla", "Enlace" };

    // Departamentos que administra cada controlador del módulo documental.
    public static readonly string[] DepartamentosCeoyDireccion = { "ceo-direccion", "formatos" };
    public static readonly string[] DepartamentosJunta = { "junta-oraculo" };
    public static readonly string[] DepartamentosReclutamiento = { "reclutamiento" };

    private readonly CronoDbContext _db;
    private readonly IRbacService _rbac;

    public DocumentosService(CronoDbContext db, IRbacService rbac)
    {
        _db = db;
        _rbac = rbac;
    }

    public async Task<List<Documento>> ListAsync(IReadOnlyCollection<string> departamentos, string? categoria)
    {
        var query = _db.Documentos
            .AsQueryable()
            .Where(d => departamentos.Contains(d.Departamento));

        if (!string.IsNullOrWhiteSpace(categoria))
            query = query.Where(d => d.Categoria == categoria);

        return await query
            .OrderBy(d => d.Departamento).ThenBy(d => d.Categoria).ThenBy(d => d.Nombre)
            .ToListAsync();
    }

    public Task<Documento?> GetAsync(int id, IReadOnlyCollection<string> departamentos)
        => _db.Documentos.AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == id && departamentos.Contains(d.Departamento));

    public async Task<CrudResult<Documento>> CreateAsync(DocumentoInput input, IReadOnlyCollection<string> departamentos)
    {
        var error = Validar(input, departamentos, out var enlace, out var fecha);
        if (error != null) return CrudResult<Documento>.Fail(error);

        var roles = NormalizarRoles(input.Roles, out var errorRoles);
        if (errorRoles != null) return CrudResult<Documento>.Fail(errorRoles);

        var documento = new Documento
        {
            Departamento = Validaciones.Texto(input.Departamento),
            Categoria = Validaciones.Texto(input.Categoria),
            Nombre = Validaciones.Texto(input.Nombre),
            Descripcion = Validaciones.TextoOpcional(input.Descripcion),
            Tipo = Validaciones.Texto(input.Tipo),
            Enlace = enlace,
            Fecha = fecha!,
            Roles = roles,
        };

        _db.Documentos.Add(documento);
        await _db.SaveChangesAsync();

        return CrudResult<Documento>.Success(documento);
    }

    public async Task<CrudResult<Documento>> UpdateAsync(int id, DocumentoInput input, IReadOnlyCollection<string> departamentos)
    {
        var documento = await _db.Documentos
            .FirstOrDefaultAsync(d => d.Id == id && departamentos.Contains(d.Departamento));
        if (documento == null) return CrudResult<Documento>.Fail("Documento no encontrado.");

        var error = Validar(input, departamentos, out var enlace, out var fecha);
        if (error != null) return CrudResult<Documento>.Fail(error);

        var roles = NormalizarRoles(input.Roles, out var errorRoles);
        if (errorRoles != null) return CrudResult<Documento>.Fail(errorRoles);

        documento.Departamento = Validaciones.Texto(input.Departamento);
        documento.Categoria = Validaciones.Texto(input.Categoria);
        documento.Nombre = Validaciones.Texto(input.Nombre);
        documento.Descripcion = Validaciones.TextoOpcional(input.Descripcion);
        documento.Tipo = Validaciones.Texto(input.Tipo);
        documento.Enlace = enlace;
        documento.Fecha = fecha!;
        documento.Roles = roles;

        await _db.SaveChangesAsync();

        return CrudResult<Documento>.Success(documento);
    }

    public async Task<CrudResult<Documento>> DeleteAsync(int id, IReadOnlyCollection<string> departamentos)
    {
        var documento = await _db.Documentos
            .FirstOrDefaultAsync(d => d.Id == id && departamentos.Contains(d.Departamento));
        if (documento == null) return CrudResult<Documento>.Fail("Documento no encontrado.");

        // Los documentos no tienen registros dependientes: se elimina solo el registro
        // de metadatos. El archivo externo, si existe, no se toca.
        _db.Documentos.Remove(documento);
        await _db.SaveChangesAsync();

        return CrudResult<Documento>.Success(documento);
    }

    private string? Validar(DocumentoInput input, IReadOnlyCollection<string> departamentos, out string? enlace, out string? fecha)
    {
        enlace = null;
        fecha = null;

        var departamento = Validaciones.Texto(input.Departamento);
        var categoria = Validaciones.Texto(input.Categoria);
        var nombre = Validaciones.Texto(input.Nombre);
        var tipo = Validaciones.Texto(input.Tipo);

        if (nombre.Length == 0) return "El nombre del documento es obligatorio.";
        if (nombre.Length > 200) return "El nombre no puede superar los 200 caracteres.";

        // El módulo solo admite sus propios departamentos: un registro nunca puede
        // crearse ni moverse a la sección de otro módulo.
        if (!departamentos.Contains(departamento))
            return $"El departamento \\\"{departamento}\\\" no pertenece a este módulo. " +
                   $"Admitidos: {string.Join(", ", departamentos)}.";

        if (!CategoriasPorDepartamento.TryGetValue(departamento, out var categorias))
            return $"Departamento no válido: {departamento}.";

        if (!categorias.Contains(categoria))
            return $"La categoría \\\"{categoria}\\\" no pertenece al departamento \\\"{departamento}\\\". " +
                   $"Admitidas: {string.Join(", ", categorias)}.";

        if (!TiposAdmisibles.Contains(tipo))
            return $"Tipo no válido: {tipo}. Admitidos: {string.Join(", ", TiposAdmisibles)}.";

        // `enlace` es el parámetro de salida: solo se rellena cuando la URL es válida.
        var (enlaceNormalizado, enlaceError) = Validaciones.NormalizarEnlace(input.Enlace);
        if (enlaceError != null) return enlaceError;
        enlace = enlaceNormalizado;

        var fechaTexto = Validaciones.Texto(input.Fecha);
        if (fechaTexto.Length == 0)
        {
            fecha = DateTime.UtcNow.ToString("yyyy-MM-dd");
        }
        else if (Validaciones.EsFecha(fechaTexto))
        {
            fecha = fechaTexto;
        }
        else
        {
            return "La fecha debe tener el formato yyyy-MM-dd.";
        }

        return null;
    }

    // Roles con acceso: vacío = acceso administrativo general.
    private List<string> NormalizarRoles(List<string>? roles, out string? error)
    {
        error = null;
        var limpios = (roles ?? new List<string>())
            .Where(r => !string.IsNullOrWhiteSpace(r))
            .Select(r => r.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var catalogo = _rbac.GetKnownRoles();
        var desconocidos = limpios.Where(r => !catalogo.Contains(r, StringComparer.OrdinalIgnoreCase)).ToList();
        if (desconocidos.Count > 0)
        {
            error = $"Roles no válidos: {string.Join(", ", desconocidos)}.";
            return new List<string>();
        }

        return limpios
            .Select(r => catalogo.First(c => string.Equals(c, r, StringComparison.OrdinalIgnoreCase)))
            .ToList();
    }
}

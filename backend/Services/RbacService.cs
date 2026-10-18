namespace Crono.Api.Services;

public interface IRbacService
{
    bool CanAccess(string rol, string recurso, string accion);
    // Autorización con varios roles: se concede si al menos uno de los roles permite el acceso.
    bool CanAccessAny(IReadOnlyCollection<string> roles, string recurso, string accion);
    // Rol que determina el filtrado de datos cuando un trabajador tiene varios roles.
    string ResolveScopeRole(IReadOnlyCollection<string> roles);
    // Catálogo de roles de trabajo válidos (única fuente de verdad).
    List<string> GetKnownRoles();
    List<string> GetAllowedResources(string rol);
}

public class RbacService : IRbacService
{
    // Orden de alcance visible, de mayor a menor. Al tener varios roles se usa
    // el de mayor alcance para el filtrado de datos, de modo que combinar roles
    // nunca estrecha la información que el trabajador ya podía ver con uno solo.
    private static readonly string[] ScopeOrder =
    {
        "Dueño", "Administrativo", "Head Booker", "Booker",
        "Entrevistador", "Scouter", "Scouter de Aliados",
        "Tesorería Agencia", "Tesorería Academia",
        "Producción", "Creativo",
    };

    // Matriz de permisos (misma lógica que permissions.js del frontend)
    private static readonly Dictionary<string, Dictionary<string, (string read, string write)>> Policies = new()
    {
        ["Entrevistador"] = new() {
            // Alcance ACTIVE: solo candidatos con el rol de aspirante activo (spec §3.2.3).
            ["aspirantes"] = ("ACTIVE", "ACTIVE"),
            ["modelos"] = ("false", "false"),
            ["clientes"] = ("false", "false"),
            ["produccion"] = ("false", "false"),
            ["finanzas"] = ("false", "false"),
            ["academia"] = ("false", "false"),
            ["rrhh"] = ("false", "false"),
            ["formatos"] = ("Reclutamiento", "false"),
            ["documentos"] = ("false", "false"),
            ["contratos"] = ("false", "false"),
            ["privado"] = ("false", "false"),
            // Reclutamiento: solo sus entrevistas y los candidatos asignados.
            ["entrevistas"] = ("OWN", "OWN"),
            ["reclutamiento"] = ("true", "false"),
        },
        ["Scouter"] = new() {
            ["aspirantes"] = ("ALL", "ALL"),
            ["modelos"] = ("false", "false"),
            ["clientes"] = ("false", "false"),
            ["produccion"] = ("false", "false"),
            ["finanzas"] = ("false", "false"),
            ["academia"] = ("false", "false"),
            ["rrhh"] = ("false", "false"),
            ["formatos"] = ("Reclutamiento", "false"),
            ["documentos"] = ("false", "false"),
            ["contratos"] = ("false", "false"),
            ["privado"] = ("false", "false"),
            // Scouter de modelos: gestiona candidatos, castings y revisa su formulario.
            ["entrevistas"] = ("ALL", "false"),
            ["castings"] = ("ALL", "ALL"),
            ["reclutamiento"] = ("true", "false"),
            ["envios"] = ("ALL", "ALL"),
        },
        ["Scouter de Aliados"] = new() {
            // Rol de Reclutamiento sin acceso al resto de módulos.
            ["modelos"] = ("false", "false"),
            ["clientes"] = ("false", "false"),
            ["produccion"] = ("false", "false"),
            ["finanzas"] = ("false", "false"),
            ["academia"] = ("false", "false"),
            ["rrhh"] = ("false", "false"),
            ["formatos"] = ("Reclutamiento", "false"),
            ["documentos"] = ("false", "false"),
            ["contratos"] = ("false", "false"),
            ["privado"] = ("false", "false"),
            ["aliados"] = ("ALL", "ALL"),
            ["reclutamiento"] = ("true", "false"),
            ["envios"] = ("ALL", "ALL"),
        },
        ["Booker"] = new() {
            ["modelos"] = ("ASSIGNED", "false"),
            ["clientes"] = ("ASSIGNED", "true"),
            ["formatos"] = ("Booking", "false"),
            ["documentos"] = ("false", "false"),
            ["contratos"] = ("ASSIGNED", "false"),
        },
        ["Head Booker"] = new() {
            ["modelos"] = ("ALL", "ASSIGN"),
            ["clientes"] = ("ALL", "REASSIGN"),
            ["formatos"] = ("Booking", "false"),
            ["documentos"] = ("false", "false"),
            ["contratos"] = ("ALL", "false"),
        },
        ["Producción"] = new() {
            ["clientes"] = ("READ_ONLY", "false"),
            ["produccion"] = ("RW", "RW"),
            ["formatos"] = ("Producción", "false"),
            ["documentos"] = ("false", "false"),
            ["contratos"] = ("false", "false"),
        },
        ["Creativo"] = new() {
            ["produccion"] = ("LIMITED", "false"),
            ["formatos"] = ("Creativo", "false"),
            ["documentos"] = ("false", "false"),
            ["contratos"] = ("false", "false"),
        },
        ["Tesorería Agencia"] = new() {
            ["finanzas"] = ("AGENCIA", "AGENCIA"),
            ["formatos"] = ("Finanzas", "false"),
            ["documentos"] = ("false", "false"),
            ["contratos"] = ("false", "false"),
        },
        ["Tesorería Academia"] = new() {
            ["finanzas"] = ("ACADEMIA", "ACADEMIA"),
            ["academia"] = ("READ_ONLY", "false"),
            ["formatos"] = ("Finanzas", "false"),
            ["documentos"] = ("false", "false"),
            ["contratos"] = ("false", "false"),
        },
        ["Administrativo"] = new() {
            ["modelos"] = ("READ_ONLY", "false"),
            ["clientes"] = ("READ_ONLY", "false"),
            ["produccion"] = ("READ_ONLY", "false"),
            ["finanzas"] = ("ALL", "false"),
            ["academia"] = ("RW", "RW"),
            ["rrhh"] = ("RW", "RW"),
            ["formatos"] = ("ALL", "false"),
            ["documentos"] = ("ALL", "false"),
            ["contratos"] = ("ALL", "false"),
            // Documentación de reclutamiento y copys: los administra, pero no el
            // flujo operativo de candidatos (spec §5: Aspirantes = No).
            ["reclutamiento"] = ("ALL", "ALL"),
        },
        ["Dueño"] = new() {
            ["aspirantes"] = ("ALL", "ALL"),
            ["modelos"] = ("ALL", "ALL"),
            ["clientes"] = ("ALL", "ALL"),
            ["produccion"] = ("ALL", "ALL"),
            ["finanzas"] = ("ALL", "ALL"),
            ["academia"] = ("ALL", "ALL"),
            ["rrhh"] = ("ALL", "ALL"),
            ["formatos"] = ("ALL", "false"),
            ["documentos"] = ("ALL", "ALL"),
            ["contratos"] = ("ALL", "ALL"),
            ["privado"] = ("EXCLUSIVE", "EXCLUSIVE"),
            // Departamento de Reclutamiento completo.
            ["entrevistas"] = ("ALL", "ALL"),
            ["castings"] = ("ALL", "ALL"),
            ["aliados"] = ("ALL", "ALL"),
            ["reclutamiento"] = ("ALL", "ALL"),
            ["envios"] = ("ALL", "ALL"),
        },
    };

    public bool CanAccess(string rol, string recurso, string accion)
    {
        if (rol == "Dueño" && recurso == "privado") return true;
        if (!Policies.ContainsKey(rol)) return false;
        if (!Policies[rol].ContainsKey(recurso)) return false;

        var (read, write) = Policies[rol][recurso];
        var value = accion == "read" ? read : write;

        if (value == "false") return false;
        if (value == "ALL" || value == "RW") return true;
        if (accion == "read") return value != "false";
        if (accion == "write" && (value == "READ_ONLY" || value == "LIMITED")) return false;

        return value != "false";
    }

    public bool CanAccessAny(IReadOnlyCollection<string> roles, string recurso, string accion)
    {
        if (roles == null || roles.Count == 0) return false;
        return roles.Any(r => !string.IsNullOrWhiteSpace(r) && CanAccess(r, recurso, accion));
    }

    public string ResolveScopeRole(IReadOnlyCollection<string> roles)
    {
        if (roles == null || roles.Count == 0) return "";

        foreach (var orden in ScopeOrder)
            if (roles.Contains(orden)) return orden;

        // Rol fuera del catálogo (dato heredado): se usa tal cual.
        return roles.First(r => !string.IsNullOrWhiteSpace(r));
    }

    public List<string> GetKnownRoles() => Policies.Keys.ToList();

    public List<string> GetAllowedResources(string rol)
    {
        if (!Policies.ContainsKey(rol)) return new List<string>();
        return Policies[rol].Where(p => p.Value.read != "false" || p.Value.write != "false")
                           .Select(p => p.Key).ToList();
    }
}

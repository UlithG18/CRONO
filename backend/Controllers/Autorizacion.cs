using System.Security.Claims;

namespace Crono.Api.Controllers;

// Utilidades de autorización compartidas por los controladores.
// Cada rol del trabajador se emite como un claim JWT independiente.
public static class Autorizacion
{
    // Todos los roles del token. Si el token no los incluye (emitido antes del
    // multi-rol) se recupera el rol principal como respaldo.
    public static List<string> Roles(ClaimsPrincipal user)
    {
        var roles = user.FindAll(ClaimTypes.Role)
            .Select(c => c.Value)
            .Where(v => !string.IsNullOrWhiteSpace(v))
            .Distinct()
            .ToList();

        if (roles.Count == 0)
        {
            var principal = user.FindFirst("rol_principal")?.Value;
            if (!string.IsNullOrWhiteSpace(principal)) roles.Add(principal!);
        }

        return roles;
    }

    public static int PersonaId(ClaimsPrincipal user)
        => int.TryParse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var id) ? id : 0;
}

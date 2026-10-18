using Crono.Api.Data;
using Crono.Api.Models;
using System.Security.Claims;

namespace Crono.Api.Middleware;

public class AuditMiddleware
{
    private readonly RequestDelegate _next;

    public AuditMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, CronoDbContext db)
    {
        var method = context.Request.Method;
        var userId = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var path = context.Request.Path;

        // Solo auditar mutaciones
        if (method is "POST" or "PUT" or "DELETE")
        {
            var tabla = path.Value.Split('/').LastOrDefault() ?? "unknown";

            db.Auditorias.Add(new Auditoria
            {
                Tabla = tabla,
                RegistroId = 0,
                Accion = method,
                PersonaId = int.TryParse(userId, out var id) ? id : 0,
                Fecha = DateTime.UtcNow.ToString("o"),
                Detalles = path.Value,
            });
            await db.SaveChangesAsync();
        }

        await _next(context);
    }
}

using Crono.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Crono.Api.Controllers;

// Revisión de los envíos de los formularios públicos.
// Solo se exponen los campos necesarios para revisar: nunca la IP ni el hash de
// origen, que son datos técnicos con información personal implícita.
[ApiController]
[Route("api/envios-publicos")]
[Authorize]
public class EnviosController : ControllerBase
{
    private readonly IEnviosService _envios;
    private readonly IRbacService _rbac;

    public EnviosController(IEnviosService envios, IRbacService rbac)
    {
        _envios = envios;
        _rbac = rbac;
    }

    private List<string> Roles => Autorizacion.Roles(User);
    private int UsuarioId => Autorizacion.PersonaId(User);

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? tipo, [FromQuery] string? estado)
    {
        if (!_rbac.CanAccessAny(Roles, "envios", "read")) return Forbid();
        return Ok(await _envios.ListAsync(tipo, estado));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        if (!_rbac.CanAccessAny(Roles, "envios", "read")) return Forbid();
        var envio = await _envios.GetAsync(id);
        return envio == null ? NotFound() : Ok(envio);
    }

    [HttpPost("{id:int}/aprobar")]
    public async Task<IActionResult> Aprobar(int id, [FromBody] RevisionInput input)
    {
        if (!_rbac.CanAccessAny(Roles, "envios", "write")) return Forbid();

        var (ok, error, data) = await _envios.AprobarAsync(id, input ?? new RevisionInput(), Roles, UsuarioId);
        if (!ok)
            return error == "Envío no encontrado."
                ? NotFound(new { error })
                : BadRequest(new { error });
        return Ok(data);
    }

    [HttpPost("{id:int}/rechazar")]
    public async Task<IActionResult> Rechazar(int id, [FromBody] RevisionInput input)
    {
        if (!_rbac.CanAccessAny(Roles, "envios", "write")) return Forbid();

        var (ok, error, data) = await _envios.RechazarAsync(id, input ?? new RevisionInput(), Roles, UsuarioId);
        if (!ok)
            return error == "Envío no encontrado."
                ? NotFound(new { error })
                : BadRequest(new { error });
        return Ok(data);
    }
}

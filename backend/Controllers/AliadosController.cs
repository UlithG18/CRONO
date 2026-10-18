using Crono.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Crono.Api.Controllers;

// Red de aliados creativos y locaciones ofrecidas por canje.
// Las locaciones de este controlador NO forman parte del catálogo comercial de
// Producción: no tienen costo ni tarifa y viven en su propia tabla.
[ApiController]
[Route("api/aliados")]
[Authorize]
public class AliadosController : ControllerBase
{
    private readonly IAliadosService _aliados;
    private readonly IRbacService _rbac;

    public AliadosController(IAliadosService aliados, IRbacService rbac)
    {
        _aliados = aliados;
        _rbac = rbac;
    }

    private List<string> Roles => Autorizacion.Roles(User);
    private int UsuarioId => Autorizacion.PersonaId(User);

    // ----------------------------------------------------------
    // Aliados creativos
    // ----------------------------------------------------------

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? estado, [FromQuery] string? busqueda)
    {
        if (!_rbac.CanAccessAny(Roles, "aliados", "read")) return Forbid();
        return Ok(await _aliados.ListAsync(estado, busqueda));
    }

    [HttpGet("catalogos")]
    public IActionResult GetCatalogos()
        => _rbac.CanAccessAny(Roles, "aliados", "read")
            ? Ok(new
            {
                rolesCreativos = _aliados.RolesCreativosAdmisibles,
                enfoques = _aliados.EnfoquesAdmisibles,
                modalidades = _aliados.ModalidadesAdmisibles,
                estadosLocacion = _aliados.EstadosLocacion,
            })
            : Forbid();

    [HttpGet("{personaId:int}")]
    public async Task<IActionResult> Get(int personaId)
    {
        if (!_rbac.CanAccessAny(Roles, "aliados", "read")) return Forbid();
        var aliado = await _aliados.GetAsync(personaId);
        return aliado == null ? NotFound() : Ok(aliado);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AliadoInput input)
    {
        if (!_rbac.CanAccessAny(Roles, "aliados", "write")) return Forbid();

        var result = await _aliados.CreateAsync(input, Roles, UsuarioId);
        if (!result.Ok) return BadRequest(new { error = result.Error });
        return CreatedAtAction(nameof(Get), new { personaId = result.Data!.PersonaId }, result.Data);
    }

    [HttpPut("{personaId:int}")]
    public async Task<IActionResult> Update(int personaId, [FromBody] AliadoInput input)
    {
        if (!_rbac.CanAccessAny(Roles, "aliados", "write")) return Forbid();

        var result = await _aliados.UpdateAsync(personaId, input, Roles, UsuarioId);
        if (!result.Ok)
            return result.Error == "Aliado no encontrado."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    [HttpDelete("{personaId:int}")]
    public async Task<IActionResult> Delete(int personaId)
    {
        if (!_rbac.CanAccessAny(Roles, "aliados", "write")) return Forbid();

        var result = await _aliados.DeleteAsync(personaId, Roles, UsuarioId);
        if (!result.Ok)
            return result.Error == "Aliado no encontrado."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    // ----------------------------------------------------------
    // Locaciones aliadas (canje / colaboración)
    // ----------------------------------------------------------

    [HttpGet("locaciones")]
    public async Task<IActionResult> GetLocaciones([FromQuery] string? estado, [FromQuery] string? busqueda)
    {
        if (!_rbac.CanAccessAny(Roles, "aliados", "read")) return Forbid();
        return Ok(await _aliados.ListLocacionesAsync(estado, busqueda));
    }

    [HttpGet("locaciones/{id:int}")]
    public async Task<IActionResult> GetLocacion(int id)
    {
        if (!_rbac.CanAccessAny(Roles, "aliados", "read")) return Forbid();
        var locacion = await _aliados.GetLocacionAsync(id);
        return locacion == null ? NotFound() : Ok(locacion);
    }

    [HttpPost("locaciones")]
    public async Task<IActionResult> CreateLocacion([FromBody] LocacionAliadaInput input)
    {
        if (!_rbac.CanAccessAny(Roles, "aliados", "write")) return Forbid();

        var result = await _aliados.CreateLocacionAsync(input, Roles, UsuarioId);
        if (!result.Ok) return BadRequest(new { error = result.Error });
        return CreatedAtAction(nameof(GetLocacion), new { id = result.Data!.Id }, result.Data);
    }

    [HttpPut("locaciones/{id:int}")]
    public async Task<IActionResult> UpdateLocacion(int id, [FromBody] LocacionAliadaInput input)
    {
        if (!_rbac.CanAccessAny(Roles, "aliados", "write")) return Forbid();

        var result = await _aliados.UpdateLocacionAsync(id, input, Roles, UsuarioId);
        if (!result.Ok)
            return result.Error == "Locación no encontrada."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    [HttpDelete("locaciones/{id:int}")]
    public async Task<IActionResult> DeleteLocacion(int id)
    {
        if (!_rbac.CanAccessAny(Roles, "aliados", "write")) return Forbid();

        var result = await _aliados.DeleteLocacionAsync(id, Roles, UsuarioId);
        if (!result.Ok)
            return result.Error == "Locación no encontrada."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        return NoContent();
    }
}

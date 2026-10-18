using Crono.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Crono.Api.Controllers;

// Recursos Humanos: ficha de trabajadores, sus roles de trabajo y su hoja de vida.
[ApiController]
[Route("api/rrhh")]
[Authorize]
public class RRHHController : ControllerBase
{
    private readonly IStaffService _staff;
    private readonly IRbacService _rbac;

    public RRHHController(IStaffService staff, IRbacService rbac)
    {
        _staff = staff;
        _rbac = rbac;
    }

    // Todos los roles del token (un claim por rol). La autorización evalúa la unión.
    private List<string> Roles => Autorizacion.Roles(User);

    [HttpGet("trabajadores")]
    public async Task<IActionResult> GetAll()
    {
        if (!_rbac.CanAccessAny(Roles, "rrhh", "read")) return Forbid();
        return Ok(await _staff.GetAllAsync());
    }

    // Catálogo único de roles de trabajo: la misma fuente que valida el backend.
    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles()
    {
        if (!_rbac.CanAccessAny(Roles, "rrhh", "read")) return Forbid();
        return Ok(await _staff.GetRolesCatalogAsync());
    }

    [HttpGet("trabajadores/{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        if (!_rbac.CanAccessAny(Roles, "rrhh", "read")) return Forbid();
        var item = await _staff.GetAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost("trabajadores")]
    public async Task<IActionResult> Create([FromBody] StaffInput input)
    {
        if (!_rbac.CanAccessAny(Roles, "rrhh", "write")) return Forbid();

        var result = await _staff.CreateAsync(input);
        if (!result.Ok) return BadRequest(new { error = result.Error });
        return CreatedAtAction(nameof(Get), new { id = result.Data!.PersonaId }, result.Data);
    }

    [HttpPut("trabajadores/{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] StaffInput input)
    {
        if (!_rbac.CanAccessAny(Roles, "rrhh", "write")) return Forbid();

        var result = await _staff.UpdateAsync(id, input);
        return Devolver(result, porBorrado: false);
    }

    [HttpDelete("trabajadores/{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        if (!_rbac.CanAccessAny(Roles, "rrhh", "write")) return Forbid();

        var result = await _staff.DeleteAsync(id);
        // Una baja rechazada por reglas de integridad se informa como conflicto.
        return Devolver(result, porBorrado: true);
    }

    private IActionResult Devolver(StaffResult result, bool porBorrado)
    {
        if (result.Ok) return Ok(result.Data);
        if (result.Error == "Trabajador no encontrado.") return NotFound(new { error = result.Error });
        return porBorrado ? Conflict(new { error = result.Error }) : BadRequest(new { error = result.Error });
    }
}

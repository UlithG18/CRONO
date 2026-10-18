using Crono.Api.Models;
using Crono.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Crono.Api.Controllers;

// Contratos firmados: registros asociados al modelo, tipo de contrato y fecha de
// firma. Respeta el filtrado propio de contratos (Booker solo ve sus asignaciones).
[ApiController]
[Route("api/contratos-firmados")]
[Authorize]
public class ContratosFirmadosController : ControllerBase
{
    private readonly IContratosService _contratos;
    private readonly IDataService _data;
    private readonly IRbacService _rbac;

    public ContratosFirmadosController(IContratosService contratos, IDataService data, IRbacService rbac)
    {
        _contratos = contratos;
        _data = data;
        _rbac = rbac;
    }

    private List<string> Roles => Autorizacion.Roles(User);
    private int PersonaId => Autorizacion.PersonaId(User);

    // El listado aplica el mismo filtrado que /api/data/contratos: la unión de
    // lo que cada rol del usuario permite ver (Booker solo sus asignaciones).
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        if (!_rbac.CanAccessAny(Roles, "contratos", "read")) return Forbid();
        return Ok(await _data.GetContratosAsync(Roles, PersonaId));
    }

    // Catálogo de tipos de contrato: única fuente del modelo de datos.
    [HttpGet("tipos")]
    public async Task<IActionResult> GetTipos()
    {
        if (!_rbac.CanAccessAny(Roles, "contratos", "read")) return Forbid();
        return Ok(await _contratos.GetTiposAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        if (!_rbac.CanAccessAny(Roles, "contratos", "read")) return Forbid();
        var contrato = await _contratos.GetAsync(id);
        return contrato == null ? NotFound() : Ok(contrato);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ContratoInput input)
    {
        if (!_rbac.CanAccessAny(Roles, "contratos", "write")) return Forbid();

        var result = await _contratos.CreateAsync(input);
        if (!result.Ok) return BadRequest(new { error = result.Error });
        return CreatedAtAction(nameof(Get), new { id = result.Data!.Id }, result.Data);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] ContratoInput input)
    {
        if (!_rbac.CanAccessAny(Roles, "contratos", "write")) return Forbid();

        var result = await _contratos.UpdateAsync(id, input);
        return Devolver(result);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        if (!_rbac.CanAccessAny(Roles, "contratos", "write")) return Forbid();

        var result = await _contratos.DeleteAsync(id);
        return Devolver(result);
    }

    // Un borrado o edición se traduce siempre igual: 404 si no existe y 400 con
    // el mensaje cuando la validación rechaza la operación.
    private IActionResult Devolver(CrudResult<Contrato> result)
    {
        if (result.Ok) return Ok(result.Data);
        return result.Error == "Contrato no encontrado."
            ? NotFound(new { error = result.Error })
            : BadRequest(new { error = result.Error });
    }
}

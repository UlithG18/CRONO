using Crono.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Crono.Api.Controllers;

// Convocatorias de casting y su tabla editable de participantes.
[ApiController]
[Route("api/castings")]
[Authorize]
public class CastingsController : ControllerBase
{
    private readonly ICastingsService _castings;
    private readonly IRbacService _rbac;

    public CastingsController(ICastingsService castings, IRbacService rbac)
    {
        _castings = castings;
        _rbac = rbac;
    }

    private List<string> Roles => Autorizacion.Roles(User);
    private int UsuarioId => Autorizacion.PersonaId(User);

    // ----------------------------------------------------------
    // Convocatorias
    // ----------------------------------------------------------

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? estado, [FromQuery] string? busqueda)
    {
        if (!_rbac.CanAccessAny(Roles, "castings", "read")) return Forbid();
        return Ok(await _castings.ListAsync(estado, busqueda));
    }

    [HttpGet("catalogos")]
    public IActionResult GetCatalogos()
        => _rbac.CanAccessAny(Roles, "castings", "read")
            ? Ok(new
            {
                estadosConvocatoria = _castings.EstadosConvocatoria,
                estadosParticipante = _castings.EstadosParticipante,
            })
            : Forbid();

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        if (!_rbac.CanAccessAny(Roles, "castings", "read")) return Forbid();
        var convocatoria = await _castings.GetAsync(id);
        return convocatoria == null ? NotFound() : Ok(convocatoria);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ConvocatoriaInput input)
    {
        if (!_rbac.CanAccessAny(Roles, "castings", "write")) return Forbid();

        var result = await _castings.CreateAsync(input, Roles, UsuarioId);
        if (!result.Ok) return BadRequest(new { error = result.Error });
        return CreatedAtAction(nameof(Get), new { id = result.Data!.Id }, result.Data);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] ConvocatoriaInput input)
    {
        if (!_rbac.CanAccessAny(Roles, "castings", "write")) return Forbid();

        var result = await _castings.UpdateAsync(id, input, Roles, UsuarioId);
        if (!result.Ok)
            return result.Error == "Convocatoria no encontrada."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    // Cerrar conserva filas e histórico; es la alternativa prevista a eliminar.
    [HttpPost("{id:int}/cerrar")]
    public async Task<IActionResult> Cerrar(int id)
    {
        if (!_rbac.CanAccessAny(Roles, "castings", "write")) return Forbid();

        var result = await _castings.CerrarAsync(id, Roles, UsuarioId);
        if (!result.Ok)
            return result.Error == "Convocatoria no encontrada."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        if (!_rbac.CanAccessAny(Roles, "castings", "write")) return Forbid();

        var result = await _castings.DeleteAsync(id, Roles, UsuarioId);
        if (!result.Ok)
            return result.Error == "Convocatoria no encontrada."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        return NoContent();
    }

    // ----------------------------------------------------------
    // Tabla editable de participantes
    // ----------------------------------------------------------

    [HttpGet("{id:int}/participantes")]
    public async Task<IActionResult> GetParticipantes(
        int id, [FromQuery] string? estado, [FromQuery] string? busqueda)
    {
        if (!_rbac.CanAccessAny(Roles, "castings", "read")) return Forbid();
        return Ok(await _castings.ListParticipantesAsync(id, estado, busqueda));
    }

    [HttpPost("{id:int}/participantes")]
    public async Task<IActionResult> AddParticipante(int id, [FromBody] ParticipanteInput input)
    {
        if (!_rbac.CanAccessAny(Roles, "castings", "write")) return Forbid();

        var result = await _castings.AddParticipanteAsync(id, input, UsuarioId);
        if (!result.Ok)
            return result.Error == "Convocatoria no encontrada."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    [HttpPut("{id:int}/participantes/{participanteId:int}")]
    public async Task<IActionResult> UpdateParticipante(int id, int participanteId, [FromBody] ParticipanteInput input)
    {
        if (!_rbac.CanAccessAny(Roles, "castings", "write")) return Forbid();

        var result = await _castings.UpdateParticipanteAsync(id, participanteId, input, UsuarioId);
        if (!result.Ok)
            return result.Error == "Registro no encontrado."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    [HttpDelete("{id:int}/participantes/{participanteId:int}")]
    public async Task<IActionResult> DeleteParticipante(int id, int participanteId)
    {
        if (!_rbac.CanAccessAny(Roles, "castings", "write")) return Forbid();

        var error = await _castings.DeleteParticipanteAsync(id, participanteId);
        if (error != null)
            return error == "Registro no encontrado."
                ? NotFound(new { error })
                : BadRequest(new { error });
        return NoContent();
    }

    // Crea la ficha de aspirante desde la fila y la vincula.
    [HttpPost("{id:int}/participantes/{participanteId:int}/ficha")]
    public async Task<IActionResult> CrearFicha(int id, int participanteId)
    {
        if (!_rbac.CanAccessAny(Roles, "castings", "write")) return Forbid();

        var result = await _castings.CrearFichaAsync(id, participanteId, UsuarioId);
        if (!result.Ok)
            return result.Error == "Registro no encontrado."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    // Reasigna la fila a una ficha de aspirante ya existente.
    [HttpPost("{id:int}/participantes/{participanteId:int}/vincular")]
    public async Task<IActionResult> VincularFicha(int id, int participanteId, [FromBody] VincularFichaInput input)
    {
        if (!_rbac.CanAccessAny(Roles, "castings", "write")) return Forbid();
        if (input.AspirantePersonaId is null or 0)
            return BadRequest(new { error = "Debes indicar la ficha de aspirante existente." });

        var result = await _castings.VincularFichaAsync(id, participanteId, input.AspirantePersonaId.Value);
        if (!result.Ok)
            return result.Error == "Registro no encontrado."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }
}

public class VincularFichaInput
{
    public int? AspirantePersonaId { get; set; }
}

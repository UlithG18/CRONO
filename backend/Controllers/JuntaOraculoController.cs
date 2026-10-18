using Crono.Api.Models;
using Crono.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Crono.Api.Controllers;

// Junta del Oráculo: planes, objetivos y tareas de Horizonte Crono, además del
// archivo de minutas de reunión.
// Ambos recursos son departamentos de la Junta: este controlador no puede tocar
// registros de otros módulos y el resto no puede tocar los suyos.
[ApiController]
[Route("api/junta-oraculo")]
[Authorize]
public class JuntaOraculoController : ControllerBase
{
    private static readonly string[] Departamentos = DocumentosService.DepartamentosJunta;

    private readonly IDocumentosService _documentos;
    private readonly IActasService _actas;
    private readonly IDataService _data;
    private readonly IRbacService _rbac;

    public JuntaOraculoController(
        IDocumentosService documentos,
        IActasService actas,
        IDataService data,
        IRbacService rbac)
    {
        _documentos = documentos;
        _actas = actas;
        _data = data;
        _rbac = rbac;
    }

    private List<string> Roles => Autorizacion.Roles(User);
    private int PersonaId => Autorizacion.PersonaId(User);

    // ---------------- Documentos de Horizonte Crono ----------------

    [HttpGet("documentos")]
    public async Task<IActionResult> GetDocumentos([FromQuery] string? categoria)
    {
        if (!_rbac.CanAccessAny(Roles, "documentos", "read")) return Forbid();
        return Ok(await _documentos.ListAsync(Departamentos, categoria));
    }

    [HttpGet("documentos/{id:int}")]
    public async Task<IActionResult> GetDocumento(int id)
    {
        if (!_rbac.CanAccessAny(Roles, "documentos", "read")) return Forbid();
        var documento = await _documentos.GetAsync(id, Departamentos);
        return documento == null ? NotFound() : Ok(documento);
    }

    [HttpPost("documentos")]
    public async Task<IActionResult> CreateDocumento([FromBody] DocumentoInput input)
    {
        if (!_rbac.CanAccessAny(Roles, "documentos", "write")) return Forbid();

        var result = await _documentos.CreateAsync(input, Departamentos);
        if (!result.Ok) return BadRequest(new { error = result.Error });
        return CreatedAtAction(nameof(GetDocumento), new { id = result.Data!.Id }, result.Data);
    }

    [HttpPut("documentos/{id:int}")]
    public async Task<IActionResult> UpdateDocumento(int id, [FromBody] DocumentoInput input)
    {
        if (!_rbac.CanAccessAny(Roles, "documentos", "write")) return Forbid();

        var result = await _documentos.UpdateAsync(id, input, Departamentos);
        return DevolverDocumento(result);
    }

    [HttpDelete("documentos/{id:int}")]
    public async Task<IActionResult> DeleteDocumento(int id)
    {
        if (!_rbac.CanAccessAny(Roles, "documentos", "write")) return Forbid();

        var result = await _documentos.DeleteAsync(id, Departamentos);
        return DevolverDocumento(result);
    }

    private IActionResult DevolverDocumento(CrudResult<Documento> result)
    {
        if (result.Ok) return Ok(result.Data);
        return result.Error == "Documento no encontrado."
            ? NotFound(new { error = result.Error })
            : BadRequest(new { error = result.Error });
    }

    // ---------------- Minutas de reunión ----------------

    [HttpGet("minutas")]
    public async Task<IActionResult> GetMinutas()
    {
        if (!_rbac.CanAccessAny(Roles, "documentos", "read")) return Forbid();
        // Mismo filtrado que /api/data/actas: solo visibilidad administrativa.
        return Ok(await _data.GetActasAsync(Roles));
    }

    [HttpGet("minutas/{id:int}")]
    public async Task<IActionResult> GetMinuta(int id)
    {
        if (!_rbac.CanAccessAny(Roles, "documentos", "read")) return Forbid();
        var acta = await _actas.GetAsync(id);
        return acta == null ? NotFound() : Ok(acta);
    }

    [HttpPost("minutas")]
    public async Task<IActionResult> CreateMinuta([FromBody] ActaInput input)
    {
        if (!_rbac.CanAccessAny(Roles, "documentos", "write")) return Forbid();

        var result = await _actas.CreateAsync(input, PersonaId);
        if (!result.Ok) return BadRequest(new { error = result.Error });
        return CreatedAtAction(nameof(GetMinuta), new { id = result.Data!.Id }, result.Data);
    }

    [HttpPut("minutas/{id:int}")]
    public async Task<IActionResult> UpdateMinuta(int id, [FromBody] ActaInput input)
    {
        if (!_rbac.CanAccessAny(Roles, "documentos", "write")) return Forbid();

        var result = await _actas.UpdateAsync(id, input);
        return DevolverMinuta(result);
    }

    [HttpDelete("minutas/{id:int}")]
    public async Task<IActionResult> DeleteMinuta(int id)
    {
        if (!_rbac.CanAccessAny(Roles, "documentos", "write")) return Forbid();

        var result = await _actas.DeleteAsync(id);
        return DevolverMinuta(result);
    }

    private IActionResult DevolverMinuta(CrudResult<ActaReunion> result)
    {
        if (result.Ok) return Ok(result.Data);
        return result.Error == "Minuta no encontrada."
            ? NotFound(new { error = result.Error })
            : BadRequest(new { error = result.Error });
    }
}

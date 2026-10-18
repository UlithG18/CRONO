using Crono.Api.Models;
using Crono.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Crono.Api.Controllers;

// Núcleo del departamento de Reclutamiento: candidatos, entrevistas,
// documentos de reclutamiento y copys.
// Cada apartado comprueba su propio recurso: pertenecer al departamento no da
// acceso automático al resto (§2 del encargo).
[ApiController]
[Route("api/reclutamiento")]
[Authorize]
public class ReclutamientoController : ControllerBase
{
    private static readonly string[] Departamento = DocumentosService.DepartamentosReclutamiento;

    private readonly IAspirantesService _aspirantes;
    private readonly ICopysService _copys;
    private readonly IDocumentosService _documentos;
    private readonly IRbacService _rbac;

    public ReclutamientoController(
        IAspirantesService aspirantes,
        ICopysService copys,
        IDocumentosService documentos,
        IRbacService rbac)
    {
        _aspirantes = aspirantes;
        _copys = copys;
        _documentos = documentos;
        _rbac = rbac;
    }

    private List<string> Roles => Autorizacion.Roles(User);
    private int UsuarioId => Autorizacion.PersonaId(User);

    // ----------------------------------------------------------
    // Candidatos (modelos en proceso de reclutamiento)
    // ----------------------------------------------------------

    [HttpGet("candidatos")]
    public async Task<IActionResult> GetCandidatos(
        [FromQuery] string? estado, [FromQuery] string? busqueda)
    {
        if (!_rbac.CanAccessAny(Roles, "aspirantes", "read")) return Forbid();
        return Ok(await _aspirantes.ListCandidatosAsync(Roles, UsuarioId, estado, busqueda));
    }

    [HttpGet("candidatos/estados")]
    public IActionResult GetEstadosCandidatos()
        => _rbac.CanAccessAny(Roles, "aspirantes", "read")
            ? Ok(_aspirantes.EstadosAdmisibles)
            : Forbid();

    [HttpGet("candidatos/{personaId:int}")]
    public async Task<IActionResult> GetCandidato(int personaId)
    {
        if (!_rbac.CanAccessAny(Roles, "aspirantes", "read")) return Forbid();
        var candidato = await _aspirantes.GetCandidatoAsync(personaId, Roles, UsuarioId);
        return candidato == null ? NotFound() : Ok(candidato);
    }

    [HttpPost("candidatos")]
    public async Task<IActionResult> CreateCandidato([FromBody] CandidatoInput input)
    {
        if (!_rbac.CanAccessAny(Roles, "aspirantes", "write")) return Forbid();

        var result = await _aspirantes.CreateCandidatoAsync(input, Roles, UsuarioId);
        if (!result.Ok) return BadRequest(new { error = result.Error });
        return CreatedAtAction(nameof(GetCandidato), new { personaId = result.Data!.PersonaId }, result.Data);
    }

    [HttpPut("candidatos/{personaId:int}")]
    public async Task<IActionResult> UpdateCandidato(int personaId, [FromBody] CandidatoInput input)
    {
        if (!_rbac.CanAccessAny(Roles, "aspirantes", "write")) return Forbid();
        return Devolver(await _aspirantes.UpdateCandidatoAsync(personaId, input, Roles, UsuarioId));
    }

    [HttpPut("candidatos/{personaId:int}/estado")]
    public async Task<IActionResult> CambiarEstadoCandidato(int personaId, [FromBody] CambioEstadoInput input)
    {
        if (!_rbac.CanAccessAny(Roles, "aspirantes", "write")) return Forbid();
        if (string.IsNullOrWhiteSpace(input.Estado))
            return BadRequest(new { error = "El estado es obligatorio." });
        return Devolver(await _aspirantes.CambiarEstadoAsync(personaId, input.Estado, Roles, UsuarioId));
    }

    [HttpDelete("candidatos/{personaId:int}")]
    public async Task<IActionResult> DeleteCandidato(int personaId)
    {
        if (!_rbac.CanAccessAny(Roles, "aspirantes", "write")) return Forbid();
        return Devolver(await _aspirantes.DeleteCandidatoAsync(personaId, Roles, UsuarioId));
    }

    // ----------------------------------------------------------
    // Entrevistas
    // ----------------------------------------------------------

    [HttpGet("entrevistas")]
    public async Task<IActionResult> GetEntrevistas(
        [FromQuery] string? estado, [FromQuery] string? desde, [FromQuery] string? hasta)
    {
        if (!_rbac.CanAccessAny(Roles, "entrevistas", "read")) return Forbid();
        return Ok(await _aspirantes.ListEntrevistasAsync(Roles, UsuarioId, estado, desde, hasta));
    }

    [HttpGet("entrevistas/estados")]
    public IActionResult GetEstadosEntrevistas()
        => _rbac.CanAccessAny(Roles, "entrevistas", "read")
            ? Ok(AspirantesService.EstadosEntrevista)
            : Forbid();

    [HttpGet("entrevistas/{id:int}")]
    public async Task<IActionResult> GetEntrevista(int id)
    {
        if (!_rbac.CanAccessAny(Roles, "entrevistas", "read")) return Forbid();
        var entrevista = await _aspirantes.GetEntrevistaAsync(id, Roles, UsuarioId);
        return entrevista == null ? NotFound() : Ok(entrevista);
    }

    [HttpPost("entrevistas")]
    public async Task<IActionResult> CreateEntrevista([FromBody] EntrevistaInput input)
    {
        if (!_rbac.CanAccessAny(Roles, "entrevistas", "write")) return Forbid();

        var result = await _aspirantes.CreateEntrevistaAsync(input, Roles, UsuarioId);
        if (!result.Ok) return BadRequest(new { error = result.Error });
        return CreatedAtAction(nameof(GetEntrevista), new { id = result.Data!.Id }, result.Data);
    }

    [HttpPut("entrevistas/{id:int}")]
    public async Task<IActionResult> UpdateEntrevista(int id, [FromBody] EntrevistaInput input)
    {
        if (!_rbac.CanAccessAny(Roles, "entrevistas", "write")) return Forbid();

        var result = await _aspirantes.UpdateEntrevistaAsync(id, input, Roles, UsuarioId);
        if (!result.Ok)
            return result.Error == "Entrevista no encontrada."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    [HttpDelete("entrevistas/{id:int}")]
    public async Task<IActionResult> DeleteEntrevista(int id)
    {
        if (!_rbac.CanAccessAny(Roles, "entrevistas", "write")) return Forbid();

        var result = await _aspirantes.DeleteEntrevistaAsync(id, Roles, UsuarioId);
        if (!result.Ok)
            return result.Error == "Entrevista no encontrada."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        return NoContent();
    }

    // ----------------------------------------------------------
    // Documentos de reclutamiento
    // ----------------------------------------------------------

    [HttpGet("documentos")]
    public async Task<IActionResult> GetDocumentos([FromQuery] string? categoria)
    {
        if (!_rbac.CanAccessAny(Roles, "reclutamiento", "read")) return Forbid();
        return Ok(await _documentos.ListAsync(Departamento, categoria));
    }

    [HttpPost("documentos")]
    public async Task<IActionResult> CreateDocumento([FromBody] DocumentoInput input)
    {
        if (!_rbac.CanAccessAny(Roles, "reclutamiento", "write")) return Forbid();

        var result = await _documentos.CreateAsync(input, Departamento);
        if (!result.Ok) return BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    [HttpPut("documentos/{id:int}")]
    public async Task<IActionResult> UpdateDocumento(int id, [FromBody] DocumentoInput input)
    {
        if (!_rbac.CanAccessAny(Roles, "reclutamiento", "write")) return Forbid();

        var result = await _documentos.UpdateAsync(id, input, Departamento);
        if (!result.Ok)
            return result.Error == "Documento no encontrado."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    [HttpDelete("documentos/{id:int}")]
    public async Task<IActionResult> DeleteDocumento(int id)
    {
        if (!_rbac.CanAccessAny(Roles, "reclutamiento", "write")) return Forbid();

        var result = await _documentos.DeleteAsync(id, Departamento);
        if (!result.Ok)
            return result.Error == "Documento no encontrado."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        return NoContent();
    }

    // ----------------------------------------------------------
    // Copys de comunicación
    // ----------------------------------------------------------

    [HttpGet("copys")]
    public async Task<IActionResult> GetCopys([FromQuery] string? categoria, [FromQuery] string? busqueda)
    {
        if (!_rbac.CanAccessAny(Roles, "reclutamiento", "read")) return Forbid();
        return Ok(await _copys.ListAsync(categoria, busqueda));
    }

    [HttpGet("copys/categorias")]
    public IActionResult GetCategoriasCopys()
        => _rbac.CanAccessAny(Roles, "reclutamiento", "read")
            ? Ok(_copys.CategoriasAdmisibles)
            : Forbid();

    [HttpPost("copys")]
    public async Task<IActionResult> CreateCopy([FromBody] CopyInput input)
    {
        if (!_rbac.CanAccessAny(Roles, "reclutamiento", "write")) return Forbid();

        var result = await _copys.CreateAsync(input, Roles, UsuarioId);
        if (!result.Ok) return BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    [HttpPut("copys/{id:int}")]
    public async Task<IActionResult> UpdateCopy(int id, [FromBody] CopyInput input)
    {
        if (!_rbac.CanAccessAny(Roles, "reclutamiento", "write")) return Forbid();

        var result = await _copys.UpdateAsync(id, input, Roles, UsuarioId);
        if (!result.Ok)
            return result.Error == "Copy no encontrado."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    [HttpDelete("copys/{id:int}")]
    public async Task<IActionResult> DeleteCopy(int id)
    {
        if (!_rbac.CanAccessAny(Roles, "reclutamiento", "write")) return Forbid();

        var result = await _copys.DeleteAsync(id, Roles, UsuarioId);
        if (!result.Ok)
            return result.Error == "Copy no encontrado."
                ? NotFound(new { error = result.Error })
                : BadRequest(new { error = result.Error });
        return NoContent();
    }

    // ----------------------------------------------------------
    // Textos legales configurables
    // ----------------------------------------------------------

    [HttpGet("textos-legales")]
    public async Task<IActionResult> GetTextosLegales()
    {
        if (!_rbac.CanAccessAny(Roles, "reclutamiento", "read")) return Forbid();
        return Ok(await _copys.ListTextosLegalesAsync());
    }

    [HttpPut("textos-legales/{clave}")]
    public async Task<IActionResult> UpsertTextoLegal(string clave, [FromBody] TextoLegalInput input)
    {
        if (!_rbac.CanAccessAny(Roles, "reclutamiento", "write")) return Forbid();

        var result = await _copys.UpsertTextoLegalAsync(clave, input, Roles, UsuarioId);
        if (!result.Ok) return BadRequest(new { error = result.Error });
        return Ok(result.Data);
    }

    // ----------------------------------------------------------
    // Utilidades
    // ----------------------------------------------------------

    private IActionResult Devolver<T>(CrudResult<T> result)
    {
        if (result.Ok) return Ok(result.Data);
        return result.Error != null && result.Error.Contains("no encontrado")
            ? NotFound(new { error = result.Error })
            : BadRequest(new { error = result.Error });
    }
}

public class CambioEstadoInput
{
    public string? Estado { get; set; }
}

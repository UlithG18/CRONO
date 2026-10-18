using Crono.Api.Models;
using Crono.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Crono.Api.Controllers;

// Documentación institucional de CEO y Dirección (legal e institucional) y de
// Formatos Oficiales (logos, papelería y plantillas).
// Este controlador no puede tocar registros de otros departamentos: el ámbito
// se impone en el servicio.
[ApiController]
[Route("api/documentos")]
[Authorize]
public class DocumentosController : ControllerBase
{
    private static readonly string[] Departamentos = DocumentosService.DepartamentosCeoyDireccion;

    private readonly IDocumentosService _documentos;
    private readonly IRbacService _rbac;

    public DocumentosController(IDocumentosService documentos, IRbacService rbac)
    {
        _documentos = documentos;
        _rbac = rbac;
    }

    private List<string> Roles => Autorizacion.Roles(User);

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? categoria)
    {
        if (!_rbac.CanAccessAny(Roles, "documentos", "read")) return Forbid();
        return Ok(await _documentos.ListAsync(Departamentos, categoria));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        if (!_rbac.CanAccessAny(Roles, "documentos", "read")) return Forbid();
        var documento = await _documentos.GetAsync(id, Departamentos);
        return documento == null ? NotFound() : Ok(documento);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] DocumentoInput input)
    {
        if (!_rbac.CanAccessAny(Roles, "documentos", "write")) return Forbid();

        var result = await _documentos.CreateAsync(input, Departamentos);
        if (!result.Ok) return BadRequest(new { error = result.Error });
        return CreatedAtAction(nameof(Get), new { id = result.Data!.Id }, result.Data);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] DocumentoInput input)
    {
        if (!_rbac.CanAccessAny(Roles, "documentos", "write")) return Forbid();

        var result = await _documentos.UpdateAsync(id, input, Departamentos);
        return Devolver(result);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        if (!_rbac.CanAccessAny(Roles, "documentos", "write")) return Forbid();

        var result = await _documentos.DeleteAsync(id, Departamentos);
        return Devolver(result);
    }

    // El resultado de escritura se traduce siempre igual: 404 si no existe en este
    // módulo y 400 con el mensaje cuando la validación rechaza la operación.
    private IActionResult Devolver(CrudResult<Documento> result)
    {
        if (result.Ok) return Ok(result.Data);
        return result.Error == "Documento no encontrado."
            ? NotFound(new { error = result.Error })
            : BadRequest(new { error = result.Error });
    }
}

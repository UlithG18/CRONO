using Crono.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Crono.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DataController : ControllerBase
{
    private readonly IDataService _data;
    private readonly IRbacService _rbac;

    public DataController(IDataService data, IRbacService rbac)
    {
        _data = data;
        _rbac = rbac;
    }

    // Todos los roles del trabajador: la autorización y el filtrado de datos
    // suman lo que cada uno de ellos permite ver.
    private List<string> Roles => Autorizacion.Roles(User);
    private int PersonaId => Autorizacion.PersonaId(User);

    [HttpGet("modelos")]
    public async Task<IActionResult> GetModelos()
    {
        if (!_rbac.CanAccessAny(Roles, "modelos", "read")) return Forbid();
        return Ok(await _data.GetModelosAsync(Roles, PersonaId));
    }

    [HttpGet("clientes")]
    public async Task<IActionResult> GetClientes()
    {
        if (!_rbac.CanAccessAny(Roles, "clientes", "read")) return Forbid();
        return Ok(await _data.GetClientesAsync(Roles, PersonaId));
    }

    [HttpGet("transacciones")]
    public async Task<IActionResult> GetTransacciones()
    {
        if (!_rbac.CanAccessAny(Roles, "finanzas", "read")) return Forbid();
        return Ok(await _data.GetTransaccionesAsync(Roles));
    }

    [HttpGet("aspirantes")]
    public async Task<IActionResult> GetAspirantes()
    {
        if (!_rbac.CanAccessAny(Roles, "aspirantes", "read")) return Forbid();
        return Ok(await _data.GetAspirantesAsync(Roles));
    }

    [HttpGet("notificaciones")]
    public async Task<IActionResult> GetNotificaciones()
    {
        if (!_rbac.CanAccessAny(Roles, "modelos", "read")) return Forbid();
        return Ok(await _data.GetNotificacionesNivelAsync(Roles));
    }

    [HttpGet("producciones")]
    public async Task<IActionResult> GetProducciones()
    {
        if (!_rbac.CanAccessAny(Roles, "produccion", "read")) return Forbid();
        return Ok(await _data.GetProduccionesAsync(Roles));
    }

    [HttpGet("personas")]
    public async Task<IActionResult> GetPersonas()
    {
        if (!_rbac.CanAccessAny(Roles, "rrhh", "read")) return Forbid();
        return Ok(await _data.GetPersonasAsync(Roles));
    }

    [HttpGet("cortes")]
    public async Task<IActionResult> GetCortes()
    {
        if (!_rbac.CanAccessAny(Roles, "modelos", "read")) return Forbid();
        return Ok(await _data.GetCortesAsync(Roles));
    }

    [HttpGet("corte-historial")]
    public async Task<IActionResult> GetCorteHistorial()
    {
        if (!_rbac.CanAccessAny(Roles, "modelos", "read")) return Forbid();
        return Ok(await _data.GetCorteHistorialAsync(Roles));
    }

    [HttpGet("habilidades")]
    public async Task<IActionResult> GetHabilidades()
    {
        if (!_rbac.CanAccessAny(Roles, "modelos", "read")) return Forbid();
        return Ok(await _data.GetHabilidadesAsync(Roles));
    }

    [HttpGet("entrevistas")]
    public async Task<IActionResult> GetEntrevistas()
    {
        if (!_rbac.CanAccessAny(Roles, "aspirantes", "read")) return Forbid();
        return Ok(await _data.GetEntrevistasAsync(Roles));
    }

    [HttpGet("formatos")]
    public async Task<IActionResult> GetFormatos()
    {
        return Ok(await _data.GetFormatosAsync(Roles));
    }

    [HttpGet("actas")]
    public async Task<IActionResult> GetActas()
    {
        if (!_rbac.CanAccessAny(Roles, "documentos", "read")) return Forbid();
        return Ok(await _data.GetActasAsync(Roles));
    }

    [HttpGet("colaboradores")]
    public async Task<IActionResult> GetColaboradores()
    {
        if (!_rbac.CanAccessAny(Roles, "produccion", "read")) return Forbid();
        return Ok(await _data.GetColaboradoresAsync(Roles));
    }

    [HttpGet("cursos")]
    public async Task<IActionResult> GetCursos()
    {
        return Ok(await _data.GetCursosAsync(Roles));
    }

    [HttpGet("matriculas")]
    public async Task<IActionResult> GetMatriculas()
    {
        if (!_rbac.CanAccessAny(Roles, "academia", "read")) return Forbid();
        return Ok(await _data.GetMatriculasAsync(Roles));
    }

    [HttpGet("asignaciones")]
    public async Task<IActionResult> GetAsignaciones()
    {
        if (!_rbac.CanAccessAny(Roles, "modelos", "read")) return Forbid();
        return Ok(await _data.GetAsignacionesAsync(Roles));
    }

    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles()
    {
        if (!_rbac.CanAccessAny(Roles, "rrhh", "read")) return Forbid();
        return Ok(await _data.GetRolesAsync(Roles));
    }

    [HttpGet("aspectos")]
    public async Task<IActionResult> GetAspectos()
    {
        return Ok(await _data.GetAspectosAsync(Roles));
    }

    [HttpGet("tipo-roles")]
    public async Task<IActionResult> GetTipoRoles()
    {
        return Ok(await _data.GetTipoRolesAsync(Roles));
    }

    [HttpGet("documentos")]
    public async Task<IActionResult> GetDocumentos()
    {
        if (!_rbac.CanAccessAny(Roles, "documentos", "read")) return Forbid();
        return Ok(await _data.GetDocumentosAsync(Roles));
    }

    [HttpGet("contratos")]
    public async Task<IActionResult> GetContratos()
    {
        if (!_rbac.CanAccessAny(Roles, "contratos", "read")) return Forbid();
        return Ok(await _data.GetContratosAsync(Roles, PersonaId));
    }

    [HttpGet("estadisticas")]
    public async Task<IActionResult> GetEstadisticas()
    {
        return Ok(await _data.GetEstadisticasAsync());
    }
}

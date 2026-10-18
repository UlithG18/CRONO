using System.Security.Cryptography;
using System.Text;
using Crono.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Crono.Api.Controllers;

// Formularios públicos. Sin autenticación: únicamente pueden enviar información.
// No devuelven registros, ni permiten consultar envíos, ni obtienen datos de
// terceros. La única respuesta posible es la confirmación de recepción.
[ApiController]
[Route("api/publico")]
public class FormulariosPublicosController : ControllerBase
{
    private readonly IEnviosService _envios;

    public FormulariosPublicosController(IEnviosService envios) => _envios = envios;

    // Formulario de Registro de Casting.
    [HttpPost("casting")]
    public async Task<IActionResult> EnviarCasting([FromBody] EnvioCastingInput input)
    {
        if (input == null) return BadRequest(new { error = "Solicitud vacía." });

        var (ok, error, id) = await _envios.RecibirCastingAsync(input, OrigenHash());
        if (!ok) return BadRequest(new { error });

        return Ok(new
        {
            recibido = true,
            mensaje = "Hemos recibido tu postulación. El equipo de Reclutamiento la revisará y se pondrá en contacto contigo.",
            referencia = id,
        });
    }

    // Formulario de Red Creativa.
    [HttpPost("red-creativa")]
    public async Task<IActionResult> EnviarRedCreativa([FromBody] EnvioRedCreativaInput input)
    {
        if (input == null) return BadRequest(new { error = "Solicitud vacía." });

        var (ok, error, id) = await _envios.RecibirRedCreativaAsync(input, OrigenHash());
        if (!ok) return BadRequest(new { error });

        return Ok(new
        {
            recibido = true,
            mensaje = "Hemos recibido tu registro. El equipo de Reclutamiento lo revisará y se pondrá en contacto contigo.",
            referencia = id,
        });
    }

    // Los textos legales y los catálogos que el formulario necesita mostrar se
    // sirven sin sesión: son públicos por definición y no contienen datos internos.
    [HttpGet("textos-legales")]
    public async Task<IActionResult> GetTextosLegales()
    {
        var copys = HttpContext.RequestServices.GetRequiredService<ICopysService>();
        var textos = await copys.ListTextosLegalesAsync();
        return Ok(textos.Select(t => new { t.Clave, t.Valor }));
    }

    // Identifica el origen para el control de frecuencia sin guardar la IP en
    // claro: se persiste solo el hash, nunca la dirección.
    private string OrigenHash()
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "desconocida";
        var datos = Encoding.UTF8.GetBytes(ip.ToLowerInvariant());
        return Convert.ToHexString(SHA256.HashData(datos));
    }
}

using Crono.Api.Data;
using Microsoft.AspNetCore.Mvc;

namespace Crono.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SeedController : ControllerBase
{
    private readonly CronoDbContext _db;

    public SeedController(CronoDbContext db)
    {
        _db = db;
    }

    [HttpPost]
    public async Task<IActionResult> Seed()
    {
        await Seeder.SeedAsync(_db);
        return Ok(new { message = "Datos semilla insertados correctamente" });
    }
}

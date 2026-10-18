using Crono.Api.Data;
using Crono.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Crono.Api.Services;

public class ActaInput
{
    public string? Fecha { get; set; }
    public string? Tema { get; set; }
    public string? Contenido { get; set; }
    // Relator de la reunión. Si no se informa se usa al usuario autenticado.
    public int? AutorPersonaId { get; set; }
}

public interface IActasService
{
    Task<List<ActaReunion>> ListAsync();
    Task<ActaReunion?> GetAsync(int id);
    Task<CrudResult<ActaReunion>> CreateAsync(ActaInput input, int usuarioPersonaId);
    Task<CrudResult<ActaReunion>> UpdateAsync(int id, ActaInput input);
    Task<CrudResult<ActaReunion>> DeleteAsync(int id);
}

public class ActasService : IActasService
{
    private readonly CronoDbContext _db;

    public ActasService(CronoDbContext db)
    {
        _db = db;
    }

    public async Task<List<ActaReunion>> ListAsync()
        => await _db.ActasReunion.OrderByDescending(a => a.Fecha).ToListAsync();

    public Task<ActaReunion?> GetAsync(int id)
        => _db.ActasReunion.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id);

    public async Task<CrudResult<ActaReunion>> CreateAsync(ActaInput input, int usuarioPersonaId)
    {
        var error = await Validar(input, usuarioPersonaId);
        if (error != null) return CrudResult<ActaReunion>.Fail(error);

        var acta = new ActaReunion
        {
            Fecha = Validaciones.Texto(input.Fecha),
            Tema = Validaciones.Texto(input.Tema),
            Contenido = Validaciones.Texto(input.Contenido),
            AutorPersonaId = input.AutorPersonaId is > 0 ? input.AutorPersonaId.Value : usuarioPersonaId,
        };

        _db.ActasReunion.Add(acta);
        await _db.SaveChangesAsync();

        return CrudResult<ActaReunion>.Success(acta);
    }

    public async Task<CrudResult<ActaReunion>> UpdateAsync(int id, ActaInput input)
    {
        var acta = await _db.ActasReunion.FirstOrDefaultAsync(a => a.Id == id);
        if (acta == null) return CrudResult<ActaReunion>.Fail("Minuta no encontrada.");

        var error = await Validar(input, acta.AutorPersonaId);
        if (error != null) return CrudResult<ActaReunion>.Fail(error);

        acta.Fecha = Validaciones.Texto(input.Fecha);
        acta.Tema = Validaciones.Texto(input.Tema);
        acta.Contenido = Validaciones.Texto(input.Contenido);
        acta.AutorPersonaId = input.AutorPersonaId is > 0 ? input.AutorPersonaId.Value : acta.AutorPersonaId;

        await _db.SaveChangesAsync();

        return CrudResult<ActaReunion>.Success(acta);
    }

    public async Task<CrudResult<ActaReunion>> DeleteAsync(int id)
    {
        var acta = await _db.ActasReunion.FirstOrDefaultAsync(a => a.Id == id);
        if (acta == null) return CrudResult<ActaReunion>.Fail("Minuta no encontrada.");

        // Un acta no tiene registros dependientes: se elimina solo el registro.
        _db.ActasReunion.Remove(acta);
        await _db.SaveChangesAsync();

        return CrudResult<ActaReunion>.Success(acta);
    }

    private async Task<string?> Validar(ActaInput input, int autorPorDefecto)
    {
        var fecha = Validaciones.Texto(input.Fecha);
        if (fecha.Length == 0) return "La fecha de la reunión es obligatoria.";
        if (!Validaciones.EsFecha(fecha)) return "La fecha debe tener el formato yyyy-MM-dd.";

        if (Validaciones.Texto(input.Tema).Length == 0) return "El tema de la reunión es obligatorio.";
        if (Validaciones.Texto(input.Contenido).Length == 0)
            return "El contenido de la minuta es obligatorio.";

        var autor = input.AutorPersonaId is > 0 ? input.AutorPersonaId!.Value : autorPorDefecto;
        if (autor > 0 && !await _db.Personas.AnyAsync(p => p.Id == autor))
            return "El relator indicado no existe.";

        return null;
    }
}

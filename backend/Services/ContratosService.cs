using Crono.Api.Data;
using Crono.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Crono.Api.Services;

public class ContratoInput
{
    public int ModeloPersonaId { get; set; }
    public string? Tipo { get; set; }
    public string? FechaFirma { get; set; }
    public string? Estado { get; set; }
    // Enlace al PDF firmado. Opcional: sin archivo real el registro queda sin enlace.
    public string? EnlaceDocumento { get; set; }
    public string? Observaciones { get; set; }
}

public interface IContratosService
{
    Task<List<Contrato>> ListAsync();
    Task<Contrato?> GetAsync(int id);
    Task<CrudResult<Contrato>> CreateAsync(ContratoInput input);
    Task<CrudResult<Contrato>> UpdateAsync(int id, ContratoInput input);
    Task<CrudResult<Contrato>> DeleteAsync(int id);
    Task<List<string>> GetTiposAsync();
}

public class ContratosService : IContratosService
{
    // Tipos y estados definidos en el modelo de datos (crono-schema.dbml).
    public static readonly string[] TiposAdmisibles =
        { "Colaboración", "Exclusividad", "Representación", "Vinculación" };

    public static readonly string[] EstadosAdmisibles = { "Vigente", "Vencido" };

    private readonly CronoDbContext _db;

    public ContratosService(CronoDbContext db)
    {
        _db = db;
    }

    public async Task<List<Contrato>> ListAsync()
        => await _db.Contratos.OrderByDescending(c => c.FechaFirma).ToListAsync();

    public Task<Contrato?> GetAsync(int id)
        => _db.Contratos.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);

    public Task<List<string>> GetTiposAsync() => Task.FromResult(TiposAdmisibles.ToList());

    public async Task<CrudResult<Contrato>> CreateAsync(ContratoInput input)
    {
        var error = await Validar(input);
        if (error != null) return CrudResult<Contrato>.Fail(error);

        var (enlace, enlaceError) = Validaciones.NormalizarEnlace(input.EnlaceDocumento);
        if (enlaceError != null) return CrudResult<Contrato>.Fail(enlaceError);

        var contrato = new Contrato
        {
            ModeloPersonaId = input.ModeloPersonaId,
            Tipo = Validaciones.Texto(input.Tipo),
            FechaFirma = Validaciones.Texto(input.FechaFirma),
            Estado = Validaciones.Texto(input.Estado),
            EnlaceDocumento = enlace,
            Observaciones = Validaciones.TextoOpcional(input.Observaciones),
        };

        _db.Contratos.Add(contrato);
        await _db.SaveChangesAsync();

        return CrudResult<Contrato>.Success(contrato);
    }

    public async Task<CrudResult<Contrato>> UpdateAsync(int id, ContratoInput input)
    {
        var contrato = await _db.Contratos.FirstOrDefaultAsync(c => c.Id == id);
        if (contrato == null) return CrudResult<Contrato>.Fail("Contrato no encontrado.");

        var error = await Validar(input);
        if (error != null) return CrudResult<Contrato>.Fail(error);

        var (enlace, enlaceError) = Validaciones.NormalizarEnlace(input.EnlaceDocumento);
        if (enlaceError != null) return CrudResult<Contrato>.Fail(enlaceError);

        contrato.ModeloPersonaId = input.ModeloPersonaId;
        contrato.Tipo = Validaciones.Texto(input.Tipo);
        contrato.FechaFirma = Validaciones.Texto(input.FechaFirma);
        contrato.Estado = Validaciones.Texto(input.Estado);
        contrato.EnlaceDocumento = enlace;
        contrato.Observaciones = Validaciones.TextoOpcional(input.Observaciones);

        await _db.SaveChangesAsync();

        return CrudResult<Contrato>.Success(contrato);
    }

    public async Task<CrudResult<Contrato>> DeleteAsync(int id)
    {
        var contrato = await _db.Contratos.FirstOrDefaultAsync(c => c.Id == id);
        if (contrato == null) return CrudResult<Contrato>.Fail("Contrato no encontrado.");

        // Un contrato no tiene registros dependientes: se elimina únicamente el
        // registro. El modelo asociado y su ficha no se ven afectados.
        _db.Contratos.Remove(contrato);
        await _db.SaveChangesAsync();

        return CrudResult<Contrato>.Success(contrato);
    }

    private async Task<string?> Validar(ContratoInput input)
    {
        if (input.ModeloPersonaId <= 0) return "Debe seleccionarse un modelo.";

        var esModelo = await _db.Modelos.AnyAsync(m => m.PersonaId == input.ModeloPersonaId);
        if (!esModelo)
            return "La persona seleccionada no tiene ficha de modelo: un contrato solo puede asociarse a un modelo.";

        var tipo = Validaciones.Texto(input.Tipo);
        if (!TiposAdmisibles.Contains(tipo))
            return $"Tipo de contrato no válido: {tipo}. Admitidos: {string.Join(", ", TiposAdmisibles)}.";

        var fecha = Validaciones.Texto(input.FechaFirma);
        if (fecha.Length == 0) return "La fecha de firma es obligatoria.";
        if (!Validaciones.EsFecha(fecha)) return "La fecha de firma debe tener el formato yyyy-MM-dd.";

        var estado = Validaciones.Texto(input.Estado);
        if (!EstadosAdmisibles.Contains(estado))
            return $"Estado no válido: {estado}. Admitidos: {string.Join(", ", EstadosAdmisibles)}.";

        return null;
    }
}

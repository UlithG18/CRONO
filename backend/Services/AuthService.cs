using Crono.Api.Data;
using Crono.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Crono.Api.Services;

public interface IAuthService
{
    Task<AuthResult?> LoginAsync(string email, string password);
    Task<Staff?> GetStaffByPersonaIdAsync(int personaId);
}

public class AuthResult
{
    public string Token { get; set; } = "";
    public Staff Staff { get; set; } = new();
}

public class AuthService : IAuthService
{
    private readonly CronoDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(CronoDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<AuthResult?> LoginAsync(string email, string password)
    {
        var staff = await _db.Staff
            .Include(s => s.Persona)
            .FirstOrDefaultAsync(s => s.Persona.Correo != null && s.Persona.Correo.ToLower() == email.ToLower());

        if (staff == null) return null;

        // En producción: validar hash de contraseña
        // Por ahora: contraseña fija "crono2026"
        if (password != "crono2026") return null;

        await LoadRolesAsync(staff);

        var token = GenerateJwtToken(staff);
        return new AuthResult { Token = token, Staff = staff };
    }

    public async Task<Staff?> GetStaffByPersonaIdAsync(int personaId)
    {
        var staff = await _db.Staff.FindAsync(personaId);
        if (staff != null) await LoadRolesAsync(staff);
        return staff;
    }

    private async Task LoadRolesAsync(Staff staff)
    {
        var roles = await _db.StaffRoles
            .Where(r => r.PersonaId == staff.PersonaId)
            .Select(r => r.Rol)
            .ToListAsync();

        staff.Roles = roles;
        // Si aún no hay filas en StaffRol (base anterior a la migración),
        // el rol principal sigue siendo el que se usa.
        if (staff.Roles.Count == 0 && !string.IsNullOrWhiteSpace(staff.Rol))
            staff.Roles = new List<string> { staff.Rol };
    }

    private string GenerateJwtToken(Staff staff)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? "crono-super-secret-key-2026"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // Un trabajador puede tener varios roles: se emite un claim por rol,
        // de modo que la autorización en servidor evalúa la unión de todos.
        var roles = staff.GetRolesList();
        if (roles.Count == 0 && !string.IsNullOrWhiteSpace(staff.Rol))
            roles.Add(staff.Rol);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, staff.PersonaId.ToString()),
            new(ClaimTypes.Name, staff.Nombre),
            // Rol principal: conserva el comportamiento anterior (filtrado de datos).
            new("rol_principal", staff.Rol),
        };
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "CronoApi",
            audience: _config["Jwt:Audience"] ?? "CronoClient",
            claims: claims,
            expires: DateTime.Now.AddHours(8),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

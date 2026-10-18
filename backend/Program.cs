using Crono.Api.Data;
using Crono.Api.Middleware;
using Crono.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// JWT
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "CronoApi",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "CronoClient",
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "crono-super-secret-key-2026")),
        };
    });

builder.Services.AddAuthorization();

// EF Core
builder.Services.AddDbContext<CronoDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection") ?? 
        "Server=localhost;Database=Crono;Trusted_Connection=True;TrustServerCertificate=True;"));

// Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IRbacService, RbacService>();
builder.Services.AddScoped<IDataService, DataService>();
builder.Services.AddScoped<IStaffService, StaffService>();
builder.Services.AddScoped<IDocumentosService, DocumentosService>();
builder.Services.AddScoped<IContratosService, ContratosService>();
builder.Services.AddScoped<IActasService, ActasService>();

// Departamento de Reclutamiento
builder.Services.AddScoped<IAspirantesService, AspirantesService>();
builder.Services.AddScoped<ICastingsService, CastingsService>();
builder.Services.AddScoped<IAliadosService, AliadosService>();
builder.Services.AddScoped<ICopysService, CopysService>();
builder.Services.AddScoped<IEnviosService, EnviosService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Sembrar datos iniciales
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<CronoDbContext>();
    await Seeder.SeedAsync(db);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<AuditMiddleware>();
app.MapControllers();

app.Run();

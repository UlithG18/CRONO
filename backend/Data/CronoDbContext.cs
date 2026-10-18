using Crono.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Crono.Api.Data;

public class CronoDbContext : DbContext
{
    public CronoDbContext(DbContextOptions<CronoDbContext> options) : base(options) { }

    public DbSet<Persona> Personas { get; set; }
    public DbSet<TipoRol> TipoRoles { get; set; }
    public DbSet<RolPersona> RolPersonas { get; set; }
    public DbSet<Modelo> Modelos { get; set; }
    public DbSet<Aspirante> Aspirantes { get; set; }
    public DbSet<Corte> Cortes { get; set; }
    public DbSet<CorteHistorial> CorteHistorial { get; set; }
    public DbSet<Cliente> Clientes { get; set; }
    public DbSet<Colaborador> Colaboradores { get; set; }
    public DbSet<Produccion> Producciones { get; set; }
    public DbSet<Transaccion> Transacciones { get; set; }
    public DbSet<Curso> Cursos { get; set; }
    public DbSet<Matricula> Matriculas { get; set; }
    public DbSet<AspectoEvaluable> AspectosEvaluables { get; set; }
    public DbSet<HabilidadActual> HabilidadActual { get; set; }
    public DbSet<NotificacionNivel> NotificacionesNivel { get; set; }
    public DbSet<AsignacionBooker> AsignacionesBooker { get; set; }
    public DbSet<Entrevista> Entrevistas { get; set; }
    public DbSet<FormatoOficial> FormatosOficiales { get; set; }
    public DbSet<ActaReunion> ActasReunion { get; set; }
    public DbSet<EspacioPrivado> EspacioPrivado { get; set; }
    public DbSet<Staff> Staff { get; set; }
    public DbSet<StaffRol> StaffRoles { get; set; }
    public DbSet<Auditoria> Auditorias { get; set; }
    public DbSet<Documento> Documentos { get; set; }
    public DbSet<Contrato> Contratos { get; set; }

    // Departamento de Reclutamiento
    public DbSet<CastingConvocatoria> CastingConvocatorias { get; set; }
    public DbSet<CastingParticipante> CastingParticipantes { get; set; }
    public DbSet<LocacionAliada> LocacionesAliadas { get; set; }
    public DbSet<Copy> Copys { get; set; }
    public DbSet<EnvioPublico> EnviosPublicos { get; set; }
    public DbSet<TextoLegal> TextosLegales { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Persona>().HasKey(p => p.Id);
        modelBuilder.Entity<TipoRol>().HasKey(t => t.Id);
        modelBuilder.Entity<RolPersona>().HasKey(r => r.Id);
        modelBuilder.Entity<Modelo>().HasKey(m => m.PersonaId);
        modelBuilder.Entity<Modelo>().Property(m => m.PersonaId).ValueGeneratedNever();
        modelBuilder.Entity<Aspirante>().HasKey(a => a.PersonaId);
        modelBuilder.Entity<Aspirante>().Property(a => a.PersonaId).ValueGeneratedNever();
        modelBuilder.Entity<Corte>().HasKey(c => c.Id);
        modelBuilder.Entity<CorteHistorial>().HasKey(c => c.Id);
        modelBuilder.Entity<Cliente>().HasKey(c => c.Id);
        modelBuilder.Entity<Colaborador>().HasKey(c => c.PersonaId);
        modelBuilder.Entity<Colaborador>().Property(c => c.PersonaId).ValueGeneratedNever();
        modelBuilder.Entity<Produccion>().HasKey(p => p.Id);
        modelBuilder.Entity<Transaccion>().HasKey(t => t.Id);
        modelBuilder.Entity<Curso>().HasKey(c => c.Id);
        modelBuilder.Entity<Matricula>().HasKey(m => m.Id);
        modelBuilder.Entity<AspectoEvaluable>().HasKey(a => a.Id);
        modelBuilder.Entity<HabilidadActual>().HasKey(h => h.Id);
        modelBuilder.Entity<NotificacionNivel>().HasKey(n => n.Id);
        modelBuilder.Entity<AsignacionBooker>().HasKey(a => a.Id);
        modelBuilder.Entity<Entrevista>().HasKey(e => e.Id);
        modelBuilder.Entity<FormatoOficial>().HasKey(f => f.Id);
        modelBuilder.Entity<ActaReunion>().HasKey(a => a.Id);
        modelBuilder.Entity<EspacioPrivado>().HasKey(e => e.Id);
        modelBuilder.Entity<Staff>().HasKey(s => s.PersonaId);
        modelBuilder.Entity<Auditoria>().HasKey(a => a.Id);
        modelBuilder.Entity<Documento>().HasKey(d => d.Id);
        modelBuilder.Entity<Contrato>().HasKey(c => c.Id);
        modelBuilder.Entity<StaffRol>().HasKey(r => r.Id);

        // Roles de trabajo: índice por trabajador y borrado en cascada desde Staff
        modelBuilder.Entity<StaffRol>()
            .HasIndex(r => r.PersonaId);
        modelBuilder.Entity<StaffRol>()
            .HasOne<Persona>()
            .WithMany()
            .HasForeignKey(r => r.PersonaId)
            .OnDelete(DeleteBehavior.Cascade);
        // Un mismo rol no debe repetirse dos veces para el mismo trabajador
        modelBuilder.Entity<StaffRol>()
            .HasIndex(r => new { r.PersonaId, r.Rol })
            .IsUnique();

        // RLS: EspacioPrivado solo Dueño
        modelBuilder.Entity<EspacioPrivado>().HasQueryFilter(e => true); // Se filtra en servicio

        // Relaciones
        modelBuilder.Entity<Staff>()
            .HasOne(s => s.Persona)
            .WithOne()
            .HasForeignKey<Staff>(s => s.PersonaId);
        modelBuilder.Entity<Staff>().Property(s => s.PersonaId).ValueGeneratedNever();

        // Indices
        modelBuilder.Entity<Persona>().HasIndex(p => p.Correo);
        modelBuilder.Entity<Transaccion>().HasIndex(t => t.Division);
        modelBuilder.Entity<NotificacionNivel>().HasIndex(n => n.Estado);
        modelBuilder.Entity<Documento>().HasIndex(d => d.Departamento);
        modelBuilder.Entity<Contrato>().HasIndex(c => c.Tipo);

        // ============================================================
        // DEPARTAMENTO DE RECLUTAMIENTO
        // ============================================================
        modelBuilder.Entity<CastingConvocatoria>().HasKey(c => c.Id);
        modelBuilder.Entity<CastingParticipante>().HasKey(c => c.Id);
        modelBuilder.Entity<LocacionAliada>().HasKey(l => l.Id);
        modelBuilder.Entity<Copy>().HasKey(c => c.Id);
        modelBuilder.Entity<EnvioPublico>().HasKey(e => e.Id);
        modelBuilder.Entity<TextoLegal>().HasKey(t => t.Id);

        modelBuilder.Entity<CastingConvocatoria>().HasIndex(c => c.Estado);

        // Las participaciones se agrupan por convocatoria; una misma ficha de
        // aspirante no puede repetirse dentro de la misma convocatoria (los envíos
        // sin ficha vinculada quedan en NULL, permitido por el índice único).
        modelBuilder.Entity<CastingParticipante>().HasIndex(c => c.ConvocatoriaId);
        modelBuilder.Entity<CastingParticipante>()
            .HasIndex(c => new { c.ConvocatoriaId, c.AspirantePersonaId })
            .IsUnique();

        modelBuilder.Entity<LocacionAliada>().HasIndex(l => l.Estado);

        // Los copys se consultan por categoría en el apartado correspondiente.
        modelBuilder.Entity<Copy>().HasIndex(c => c.Categoria);

        // Control de frecuencia de los formularios públicos y revisión por estado.
        modelBuilder.Entity<EnvioPublico>().HasIndex(e => e.Estado);
        modelBuilder.Entity<EnvioPublico>().HasIndex(e => new { e.OrigenHash, e.FechaEnvio });

        // Cada texto legal se identifica por su clave: no pueden duplicarse.
        modelBuilder.Entity<TextoLegal>().HasIndex(t => t.Clave).IsUnique();
    }
}

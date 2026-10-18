using Crono.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Crono.Api.Data;

public static class Seeder
{
    public static async Task SeedAsync(CronoDbContext db)
    {
        if (db.Personas.Any())
        {
            // La base ya tiene datos: solo completar el repositorio documental
            // y los roles de trabajo (tablas añadidas en migraciones posteriores).
            await SeedDocumentacionAsync(db);
            await SeedStaffRolesAsync(db);
            await SeedReclutamientoAsync(db);
            return;
        }

        // ===== PERSONAS =====
        db.Personas.AddRange(
            new Persona { NombreCompleto = "Valentina Ríos", FechaNacimiento = "2000-03-15", Telefono = "3001234567", Correo = "valentina@email.com", InstagramUsuario = "@valentina.rios", InstagramLink = "https://instagram.com/valentina.rios", FechaCreacion = "2023-05-01" },
            new Persona { NombreCompleto = "Camila Torres", FechaNacimiento = "2001-07-22", Telefono = "3015552222", Correo = "camila@email.com", InstagramUsuario = "@camila.torres", InstagramLink = "https://instagram.com/camila.torres", FechaCreacion = "2024-01-10" },
            new Persona { NombreCompleto = "Juliana Pardo", FechaNacimiento = "1999-11-08", Telefono = "3028881111", Correo = "juliana@email.com", InstagramLink = "https://instagram.com/juliana.pardo", FechaCreacion = "2023-03-20" },
            new Persona { NombreCompleto = "Mariana Gil", FechaNacimiento = "2002-01-30", Telefono = "3042229999", Correo = "mariana@email.com", InstagramLink = "https://instagram.com/mariana.gil", FechaCreacion = "2024-06-15" },
            new Persona { NombreCompleto = "Sofía Lara", FechaNacimiento = "2000-09-12", Telefono = "3064448888", Correo = "sofia@email.com", InstagramUsuario = "@sofia.lara", InstagramLink = "https://instagram.com/sofia.lara", FechaCreacion = "2025-01-05" },
            new Persona { NombreCompleto = "Nicol Vargas", FechaNacimiento = "2001-05-18", Telefono = "3071112233", Correo = "nicol@email.com", InstagramUsuario = "@nicol.vargas", InstagramLink = "https://instagram.com/nicol.vargas", FechaCreacion = "2025-03-10" },
            new Persona { NombreCompleto = "Isabella Moreno", FechaNacimiento = "1998-12-03", Telefono = "3103334444", Correo = "isabella@email.com", InstagramLink = "https://instagram.com/isabella.moreno", FechaCreacion = "2022-09-01" },
            new Persona { NombreCompleto = "Diego Hernández", FechaNacimiento = "1997-04-20", Telefono = "3114445555", Correo = "diego@email.com", InstagramUsuario = "@diego.h", InstagramLink = "https://instagram.com/diego.h", FechaCreacion = "2025-04-01" },
            new Persona { NombreCompleto = "Gabriela Castro", FechaNacimiento = "1999-08-15", Telefono = "3126667777", Correo = "gabriela@email.com", InstagramUsuario = "@gabi.castro", InstagramLink = "https://instagram.com/gabi.castro", FechaCreacion = "2025-05-01" },
            // Staff
            new Persona { NombreCompleto = "Jun Osorio", FechaNacimiento = "1990-01-10", Telefono = "3009998888", Correo = "jun@crono.com", FechaCreacion = "2021-01-10" },
            new Persona { NombreCompleto = "Carlos Ruiz", FechaNacimiento = "1993-03-04", Telefono = "3017776666", Correo = "carlos@crono.com", FechaCreacion = "2022-03-04" },
            new Persona { NombreCompleto = "Daniela Fonseca", FechaNacimiento = "1994-06-15", Telefono = "3025554444", Correo = "daniela@crono.com", FechaCreacion = "2023-06-15" },
            new Persona { NombreCompleto = "Laura Méndez", FechaNacimiento = "1996-02-20", Telefono = "3033332222", Correo = "laura@crono.com", FechaCreacion = "2024-02-20" },
            new Persona { NombreCompleto = "Felipe Rojas", FechaNacimiento = "1995-09-01", Telefono = "3041110000", Correo = "felipe@crono.com", FechaCreacion = "2023-09-01" },
            new Persona { NombreCompleto = "Sara Bonilla", FechaNacimiento = "1998-05-11", Telefono = "3059998888", Correo = "sara@crono.com", FechaCreacion = "2024-05-11" },
            new Persona { NombreCompleto = "Mateo Duarte", FechaNacimiento = "1994-11-07", Telefono = "3067776666", Correo = "mateo@crono.com", FechaCreacion = "2022-11-07" },
            new Persona { NombreCompleto = "Andrés Muñoz", FechaNacimiento = "1995-04-25", Telefono = "3115556666", Correo = "andres@crono.com", InstagramUsuario = "@andres.foto", FechaCreacion = "2023-02-14" },
            new Persona { NombreCompleto = "Camila Duque", FechaNacimiento = "1997-08-10", Telefono = "3127778888", Correo = "camila.d@crono.com", InstagramUsuario = "@camila.styling", FechaCreacion = "2023-06-20" },
            new Persona { NombreCompleto = "Julián Ortiz", FechaNacimiento = "1996-02-14", Telefono = "3139990000", Correo = "julian@crono.com", InstagramUsuario = "@julian.creativo", FechaCreacion = "2023-08-05" },
            new Persona { NombreCompleto = "Paola Rincón", FechaNacimiento = "1990-05-10", Telefono = "3001234560", Correo = "paola@crono.com", FechaCreacion = "2021-10-12" },
            // Clientes y colaboradores
            new Persona { NombreCompleto = "Studio Blanc", Telefono = "3001112222", Correo = "studio@email.com", FechaCreacion = "2024-03-01" },
            new Persona { NombreCompleto = "Aura Cosmetics", Telefono = "3013334444", Correo = "aura@email.com", FechaCreacion = "2024-05-10" },
            new Persona { NombreCompleto = "Nébula Studio", Telefono = "3025556666", Correo = "nebula@email.com", FechaCreacion = "2024-07-15" },
            new Persona { NombreCompleto = "Vogue Colombia", Telefono = "3004445555", Correo = "vogue@email.com", FechaCreacion = "2024-01-10" },
            new Persona { NombreCompleto = "Daniela Herrera", Telefono = "3006667777", Correo = "daniela.h@email.com", FechaCreacion = "2024-03-15" },
            new Persona { NombreCompleto = "Colaborador Fotografía", Telefono = "3000000000", Correo = "foto@crono.com", FechaCreacion = "2023-01-01" },
            new Persona { NombreCompleto = "Colaborador Estilismo", Telefono = "3000000001", Correo = "estilismo@crono.com", FechaCreacion = "2023-06-01" },
            new Persona { NombreCompleto = "Colaborador Dirección", Telefono = "3000000002", Correo = "direccion@crono.com", FechaCreacion = "2023-02-10" }
        );

        await db.SaveChangesAsync();

        var personas = await db.Personas.ToListAsync();
        var valentina = personas.First(p => p.NombreCompleto == "Valentina Ríos");
        var camila = personas.First(p => p.NombreCompleto == "Camila Torres");
        var juliana = personas.First(p => p.NombreCompleto == "Juliana Pardo");
        var mariana = personas.First(p => p.NombreCompleto == "Mariana Gil");
        var sofia = personas.First(p => p.NombreCompleto == "Sofía Lara");
        var nicol = personas.First(p => p.NombreCompleto == "Nicol Vargas");
        var isabella = personas.First(p => p.NombreCompleto == "Isabella Moreno");
        var diego = personas.First(p => p.NombreCompleto == "Diego Hernández");
        var gabriela = personas.First(p => p.NombreCompleto == "Gabriela Castro");
        var jun = personas.First(p => p.NombreCompleto == "Jun Osorio");
        var carlos = personas.First(p => p.NombreCompleto == "Carlos Ruiz");
        var daniela = personas.First(p => p.NombreCompleto == "Daniela Fonseca");
        var laura = personas.First(p => p.NombreCompleto == "Laura Méndez");
        var felipe = personas.First(p => p.NombreCompleto == "Felipe Rojas");
        var sara = personas.First(p => p.NombreCompleto == "Sara Bonilla");
        var mateo = personas.First(p => p.NombreCompleto == "Mateo Duarte");
        var andres = personas.First(p => p.NombreCompleto == "Andrés Muñoz");
        var camilaD = personas.First(p => p.NombreCompleto == "Camila Duque");
        var julian = personas.First(p => p.NombreCompleto == "Julián Ortiz");
        var paola = personas.First(p => p.NombreCompleto == "Paola Rincón");
        var studioBlanc = personas.First(p => p.NombreCompleto == "Studio Blanc");
        var aura = personas.First(p => p.NombreCompleto == "Aura Cosmetics");
        var nebula = personas.First(p => p.NombreCompleto == "Nébula Studio");
        var vogue = personas.First(p => p.NombreCompleto == "Vogue Colombia");
        var danielaH = personas.First(p => p.NombreCompleto == "Daniela Herrera");
        var foto = personas.First(p => p.NombreCompleto == "Colaborador Fotografía");
        var estilismo = personas.First(p => p.NombreCompleto == "Colaborador Estilismo");
        var direccion = personas.First(p => p.NombreCompleto == "Colaborador Dirección");

        // ===== STAFF =====
        db.Staff.AddRange(
            new Staff { PersonaId = jun.Id, Nombre = "Jun Osorio", Rol = "Dueño", FechaContratacion = "2021-01-10" },
            new Staff { PersonaId = carlos.Id, Nombre = "Carlos Ruiz", Rol = "Head Booker", FechaContratacion = "2022-03-04" },
            new Staff { PersonaId = daniela.Id, Nombre = "Daniela Fonseca", Rol = "Booker", FechaContratacion = "2023-06-15" },
            new Staff { PersonaId = laura.Id, Nombre = "Laura Méndez", Rol = "Booker", FechaContratacion = "2024-02-20" },
            new Staff { PersonaId = felipe.Id, Nombre = "Felipe Rojas", Rol = "Entrevistador", FechaContratacion = "2023-09-01" },
            new Staff { PersonaId = sara.Id, Nombre = "Sara Bonilla", Rol = "Scouter", FechaContratacion = "2024-05-11" },
            new Staff { PersonaId = mateo.Id, Nombre = "Mateo Duarte", Rol = "Producción", FechaContratacion = "2022-11-07" },
            new Staff { PersonaId = andres.Id, Nombre = "Andrés Muñoz", Rol = "Creativo", FechaContratacion = "2023-01-19" },
            new Staff { PersonaId = camilaD.Id, Nombre = "Camila Duque", Rol = "Tesorería Agencia", FechaContratacion = "2022-07-25" },
            new Staff { PersonaId = julian.Id, Nombre = "Julián Ortiz", Rol = "Tesorería Academia", FechaContratacion = "2024-08-03" },
            new Staff { PersonaId = paola.Id, Nombre = "Paola Rincón", Rol = "Administrativo", FechaContratacion = "2021-10-12" }
        );

        // ===== ROLES DE TRABAJO (1 por trabajador al inicio) =====
        db.StaffRoles.AddRange(
            new StaffRol { PersonaId = jun.Id, Rol = "Dueño" },
            new StaffRol { PersonaId = carlos.Id, Rol = "Head Booker" },
            new StaffRol { PersonaId = daniela.Id, Rol = "Booker" },
            new StaffRol { PersonaId = laura.Id, Rol = "Booker" },
            new StaffRol { PersonaId = felipe.Id, Rol = "Entrevistador" },
            new StaffRol { PersonaId = sara.Id, Rol = "Scouter" },
            new StaffRol { PersonaId = mateo.Id, Rol = "Producción" },
            new StaffRol { PersonaId = andres.Id, Rol = "Creativo" },
            new StaffRol { PersonaId = camilaD.Id, Rol = "Tesorería Agencia" },
            new StaffRol { PersonaId = julian.Id, Rol = "Tesorería Academia" },
            new StaffRol { PersonaId = paola.Id, Rol = "Administrativo" }
        );

        // ===== TIPO ROLES =====
        db.TipoRoles.AddRange(
            new TipoRol { Nombre = "Aspirante" },
            new TipoRol { Nombre = "Modelo" },
            new TipoRol { Nombre = "Colaborador" },
            new TipoRol { Nombre = "Estudiante" },
            new TipoRol { Nombre = "Cliente" }
        );

        // ===== ROL PERSONAS =====
        db.RolPersonas.AddRange(
            new RolPersona { PersonaId = valentina.Id, TipoRolId = 2, FechaInicio = "2024-02-10" },
            new RolPersona { PersonaId = camila.Id, TipoRolId = 1, FechaInicio = "2025-06-01" },
            new RolPersona { PersonaId = juliana.Id, TipoRolId = 2, FechaInicio = "2023-05-01" },
            new RolPersona { PersonaId = mariana.Id, TipoRolId = 4, FechaInicio = "2024-06-15" },
            new RolPersona { PersonaId = sofia.Id, TipoRolId = 1, FechaInicio = "2025-01-05" },
            new RolPersona { PersonaId = nicol.Id, TipoRolId = 1, FechaInicio = "2025-03-10" },
            new RolPersona { PersonaId = isabella.Id, TipoRolId = 2, FechaInicio = "2022-10-01" },
            new RolPersona { PersonaId = diego.Id, TipoRolId = 1, FechaInicio = "2025-04-01" },
            new RolPersona { PersonaId = gabriela.Id, TipoRolId = 2, FechaInicio = "2025-05-01" },
            new RolPersona { PersonaId = studioBlanc.Id, TipoRolId = 5, FechaInicio = "2024-03-01" },
            new RolPersona { PersonaId = aura.Id, TipoRolId = 5, FechaInicio = "2024-05-10" },
            new RolPersona { PersonaId = nebula.Id, TipoRolId = 5, FechaInicio = "2024-07-15" },
            new RolPersona { PersonaId = vogue.Id, TipoRolId = 5, FechaInicio = "2024-01-10" },
            new RolPersona { PersonaId = danielaH.Id, TipoRolId = 5, FechaInicio = "2024-03-15" },
            new RolPersona { PersonaId = foto.Id, TipoRolId = 3, FechaInicio = "2023-01-19" },
            new RolPersona { PersonaId = estilismo.Id, TipoRolId = 3, FechaInicio = "2022-07-25" },
            new RolPersona { PersonaId = direccion.Id, TipoRolId = 3, FechaInicio = "2023-02-10" }
        );

        // ===== MODELOS =====
        db.Modelos.AddRange(
            new Modelo { PersonaId = valentina.Id, NombreArtistico = "Valentina R.", Genero = "female", RasgoDistintivo = "Morena, ojos verdes", Enfoque = "moda", FechaInicioAgencia = "2024-02-10" },
            new Modelo { PersonaId = juliana.Id, NombreArtistico = "Juliana P.", Genero = "female", RasgoDistintivo = "Rubia, pecas", Enfoque = "comercial", FechaInicioAgencia = "2023-05-01" },
            new Modelo { PersonaId = isabella.Id, NombreArtistico = "Isabella M.", Genero = "female", RasgoDistintivo = "Asiática, estatura 1.78", Enfoque = "lifestyle", FechaInicioAgencia = "2022-10-01" },
            new Modelo { PersonaId = gabriela.Id, NombreArtistico = "Gabriela C.", Genero = "female", RasgoDistintivo = "Cabello rojizo, piel blanca", Enfoque = "editorial", FechaInicioAgencia = "2025-05-01" }
        );

        // ===== ASPIRANTES =====
        db.Aspirantes.AddRange(
            new Aspirante { PersonaId = camila.Id, MedioContacto = "Instagram", FechaContacto = "2025-06-01", ResponsablePersonaId = felipe.Id, Estado = "Entrevistado" },
            new Aspirante { PersonaId = sofia.Id, MedioContacto = "Referido", FechaContacto = "2025-01-05", ResponsablePersonaId = felipe.Id, Estado = "Pendiente" },
            new Aspirante { PersonaId = nicol.Id, MedioContacto = "Casting call", FechaContacto = "2025-03-10", ResponsablePersonaId = sara.Id, Estado = "Descartado" },
            new Aspirante { PersonaId = diego.Id, MedioContacto = "Instagram", FechaContacto = "2025-04-01", ResponsablePersonaId = felipe.Id, Estado = "Pendiente" }
        );

        // ===== CORTES =====
        db.Cortes.AddRange(
            new Corte { Nombre = "Delta", OrdenJerarquico = 1, CriterioAscenso = 6.0 },
            new Corte { Nombre = "Gamma III", OrdenJerarquico = 2, CriterioAscenso = 6.5 },
            new Corte { Nombre = "Gamma II", OrdenJerarquico = 3, CriterioAscenso = 7.0 },
            new Corte { Nombre = "Gamma I", OrdenJerarquico = 4, CriterioAscenso = 7.2 },
            new Corte { Nombre = "Beta III", OrdenJerarquico = 5, CriterioAscenso = 7.4 },
            new Corte { Nombre = "Beta II", OrdenJerarquico = 6, CriterioAscenso = 7.6 },
            new Corte { Nombre = "Beta I", OrdenJerarquico = 7, CriterioAscenso = 7.8 },
            new Corte { Nombre = "Centinela Alpha", OrdenJerarquico = 8, CriterioAscenso = 8.0 },
            new Corte { Nombre = "Centinela Omega", OrdenJerarquico = 9, CriterioAscenso = 8.5 },
            new Corte { Nombre = "Musa/Muso", OrdenJerarquico = 10, CriterioAscenso = 9.0 }
        );

        await db.SaveChangesAsync();

        var cortes = await db.Cortes.ToListAsync();
        var delta = cortes.First(c => c.Nombre == "Delta");
        var gamma3 = cortes.First(c => c.Nombre == "Gamma III");
        var gamma2 = cortes.First(c => c.Nombre == "Gamma II");
        var gamma1 = cortes.First(c => c.Nombre == "Gamma I");
        var beta3 = cortes.First(c => c.Nombre == "Beta III");
        var beta2 = cortes.First(c => c.Nombre == "Beta II");
        var beta1 = cortes.First(c => c.Nombre == "Beta I");
        var centinelaA = cortes.First(c => c.Nombre == "Centinela Alpha");
        var centinelaO = cortes.First(c => c.Nombre == "Centinela Omega");

        // ===== HISTORIAL DE CORTES =====
        db.CorteHistorial.AddRange(
            new CorteHistorial { ModeloPersonaId = valentina.Id, CorteId = gamma1.Id, FechaAsignacion = "2024-02-10" },
            new CorteHistorial { ModeloPersonaId = valentina.Id, CorteId = beta2.Id, FechaAsignacion = "2024-11-02" },
            new CorteHistorial { ModeloPersonaId = valentina.Id, CorteId = beta2.Id, FechaAsignacion = "2025-08-15" },
            new CorteHistorial { ModeloPersonaId = valentina.Id, CorteId = centinelaA.Id, FechaAsignacion = "2025-10-01" },
            new CorteHistorial { ModeloPersonaId = juliana.Id, CorteId = delta.Id, FechaAsignacion = "2023-05-01" },
            new CorteHistorial { ModeloPersonaId = juliana.Id, CorteId = gamma2.Id, FechaAsignacion = "2024-03-15" },
            new CorteHistorial { ModeloPersonaId = juliana.Id, CorteId = beta1.Id, FechaAsignacion = "2025-01-20" },
            new CorteHistorial { ModeloPersonaId = isabella.Id, CorteId = beta1.Id, FechaAsignacion = "2023-01-15" },
            new CorteHistorial { ModeloPersonaId = isabella.Id, CorteId = centinelaA.Id, FechaAsignacion = "2024-06-01" },
            new CorteHistorial { ModeloPersonaId = isabella.Id, CorteId = centinelaO.Id, FechaAsignacion = "2025-03-10" },
            new CorteHistorial { ModeloPersonaId = gabriela.Id, CorteId = delta.Id, FechaAsignacion = "2025-05-01" },
            new CorteHistorial { ModeloPersonaId = gabriela.Id, CorteId = gamma3.Id, FechaAsignacion = "2025-08-01" }
        );

        // ===== CLIENTES =====
        db.Clientes.AddRange(
            new Cliente { PersonaId = studioBlanc.Id, RazonSocial = "Studio Blanc", TipoRelacion = "Cliente", Categoria = "Marca", EstadoRelacion = "Activo", BookerPersonaId = daniela.Id },
            new Cliente { PersonaId = aura.Id, RazonSocial = "Aura Cosmetics", TipoRelacion = "Cliente", Categoria = "Marca", EstadoRelacion = "Activo", BookerPersonaId = laura.Id },
            new Cliente { PersonaId = nebula.Id, RazonSocial = "Nébula Studio", TipoRelacion = "Aliado", Categoria = "Marca", EstadoRelacion = "Activo" },
            new Cliente { PersonaId = vogue.Id, RazonSocial = "Vogue Colombia", TipoRelacion = "Cliente", Categoria = "Medio", EstadoRelacion = "Activo", BookerPersonaId = carlos.Id },
            new Cliente { PersonaId = danielaH.Id, RazonSocial = "Daniela Herrera", TipoRelacion = "Cliente", Categoria = "Diseñador", EstadoRelacion = "Activo", BookerPersonaId = daniela.Id }
        );

        // ===== COLABORADORES =====
        db.Colaboradores.AddRange(
            new Colaborador { PersonaId = foto.Id, Categoria = "Fotografía", EsRecluta = true, EsAliado = true },
            new Colaborador { PersonaId = estilismo.Id, Categoria = "Estilismo", EsRecluta = true, EsAliado = false },
            new Colaborador { PersonaId = direccion.Id, Categoria = "Dirección creativa", EsRecluta = false, EsAliado = true }
        );

        // ===== PRODUCCIONES =====
        db.Producciones.AddRange(
            new Produccion { Fecha = "2026-09-10", ClienteId = studioBlanc.Id, LocacionId = 1, TipoEvento = "Book", Estado = "Completado" },
            new Produccion { Fecha = "2026-08-20", ClienteId = aura.Id, LocacionId = 2, TipoEvento = "Sesión de fotos", Estado = "En curso" },
            new Produccion { Fecha = "2026-10-05", ClienteId = vogue.Id, LocacionId = 1, TipoEvento = "Editorial", Estado = "Programado" },
            new Produccion { Fecha = "2026-10-15", ClienteId = danielaH.Id, LocacionId = 2, TipoEvento = "Campaña", Estado = "Programado" },
            new Produccion { Fecha = "2026-11-01", ClienteId = nebula.Id, LocacionId = 1, TipoEvento = "Lookbook", Estado = "Pendiente" }
        );

        // ===== TRANSACCIONES =====
        db.Transacciones.AddRange(
            new Transaccion { Tipo = "Ingreso", Division = "Agencia", Fecha = "2026-09-01", ContrapartePersonaId = valentina.Id, Concepto = "Book — Valentina Ríos", Valor = 850000 },
            new Transaccion { Tipo = "Egreso", Division = "Agencia", Fecha = "2026-09-03", Concepto = "Alquiler locación Estudio Norte", Valor = 300000 },
            new Transaccion { Tipo = "Ingreso", Division = "Academia", Fecha = "2026-09-05", ContrapartePersonaId = mariana.Id, Concepto = "Matrícula Fundamentos de Pasarela", Valor = 200000 },
            new Transaccion { Tipo = "Inversión", Division = "Agencia", Fecha = "2026-08-20", Concepto = "Set fotográfico portatelón", Valor = 450000 },
            new Transaccion { Tipo = "Egreso", Division = "Academia", Fecha = "2026-09-08", ContrapartePersonaId = foto.Id, Concepto = "Pago colaborador clases", Valor = 180000 },
            new Transaccion { Tipo = "Ingreso", Division = "Agencia", Fecha = "2026-09-10", ContrapartePersonaId = isabella.Id, Concepto = "Sesión editorial Isabella M.", Valor = 1200000 },
            new Transaccion { Tipo = "Egreso", Division = "Agencia", Fecha = "2026-09-12", Concepto = "Insumos maquillaje", Valor = 150000 },
            new Transaccion { Tipo = "Ingreso", Division = "Academia", Fecha = "2026-09-15", ContrapartePersonaId = juliana.Id, Concepto = "Curso Book & Portafolio", Valor = 450000 },
            new Transaccion { Tipo = "Egreso", Division = "Agencia", Fecha = "2026-10-01", Concepto = "Transporte rodaje", Valor = 75000 },
            new Transaccion { Tipo = "Ingreso", Division = "Agencia", Fecha = "2026-10-05", ContrapartePersonaId = studioBlanc.Id, Concepto = "Campaña Studio Blanc", Valor = 2500000 },
            new Transaccion { Tipo = "Egreso", Division = "Academia", Fecha = "2026-10-08", Concepto = "Material didáctico", Valor = 45000 },
            new Transaccion { Tipo = "Ingreso", Division = "Agencia", Fecha = "2026-10-12", ContrapartePersonaId = nebula.Id, Concepto = "Lookbook Nébula", Valor = 1800000 }
        );

        // ===== CURSOS =====
        db.Cursos.AddRange(
            new Curso { Nombre = "Fundamentos de Pasarela", Modalidad = "Cohorte", Descripcion = "Desarrollo de técnica y presencia en pasarela" },
            new Curso { Nombre = "Book & Portafolio", Modalidad = "Continuo", Descripcion = "Sesiones fotográficas para portafolio" },
            new Curso { Nombre = "El Oráculo del Modelo", Modalidad = "Cohorte", Descripcion = "Gestión de carrera e imagen personal" },
            new Curso { Nombre = "Fotografía Editorial", Modalidad = "Continuo", Descripcion = "Técnicas de fotografía para medios" }
        );

        await db.SaveChangesAsync();

        var cursos = await db.Cursos.ToListAsync();
        var cursoPasarela = cursos.First(c => c.Nombre == "Fundamentos de Pasarela");
        var cursoBook = cursos.First(c => c.Nombre == "Book & Portafolio");
        var cursoOraculo = cursos.First(c => c.Nombre == "El Oráculo del Modelo");
        var cursoFoto = cursos.First(c => c.Nombre == "Fotografía Editorial");

        // ===== MATRICULAS =====
        db.Matriculas.AddRange(
            new Matricula { EstudiantePersonaId = mariana.Id, CursoId = cursoPasarela.Id, ValorAcordado = 600000, Estado = "Activo" },
            new Matricula { EstudiantePersonaId = juliana.Id, CursoId = cursoBook.Id, ValorAcordado = 450000, Estado = "Activo" },
            new Matricula { EstudiantePersonaId = sofia.Id, CursoId = cursoOraculo.Id, ValorAcordado = 800000, Estado = "Activo" },
            new Matricula { EstudiantePersonaId = nicol.Id, CursoId = cursoFoto.Id, ValorAcordado = 550000, Estado = "Inactivo" },
            new Matricula { EstudiantePersonaId = diego.Id, CursoId = cursoPasarela.Id, ValorAcordado = 600000, Estado = "Activo" }
        );

        // ===== ASPECTOS EVALUABLES =====
        db.AspectosEvaluables.AddRange(
            new AspectoEvaluable { Nombre = "Foto pose" },
            new AspectoEvaluable { Nombre = "Pasarela" },
            new AspectoEvaluable { Nombre = "Manejo de cuerpo" },
            new AspectoEvaluable { Nombre = "Expresión" },
            new AspectoEvaluable { Nombre = "Personalidad/Actitud" }
        );

        // ===== HABILIDAD ACTUAL =====
        db.HabilidadActual.AddRange(
            new HabilidadActual { PersonaId = valentina.Id, Aspecto = "Foto pose", Nota = 8.9, Fecha = "2026-08-15" },
            new HabilidadActual { PersonaId = valentina.Id, Aspecto = "Pasarela", Nota = 9.1, Fecha = "2026-08-15" },
            new HabilidadActual { PersonaId = valentina.Id, Aspecto = "Manejo de cuerpo", Nota = 8.5, Fecha = "2026-09-01" },
            new HabilidadActual { PersonaId = valentina.Id, Aspecto = "Expresión", Nota = 9.0, Fecha = "2026-09-01" },
            new HabilidadActual { PersonaId = juliana.Id, Aspecto = "Foto pose", Nota = 6.8, Fecha = "2025-08-10" },
            new HabilidadActual { PersonaId = juliana.Id, Aspecto = "Pasarela", Nota = 5.5, Fecha = "2025-01-20" },
            new HabilidadActual { PersonaId = juliana.Id, Aspecto = "Manejo de cuerpo", Nota = 7.2, Fecha = "2026-02-15" },
            new HabilidadActual { PersonaId = camila.Id, Aspecto = "Personalidad/Actitud", Nota = 7.8, Fecha = "2026-09-01" },
            new HabilidadActual { PersonaId = camila.Id, Aspecto = "Foto pose", Nota = 6.5, Fecha = "2026-09-10" },
            new HabilidadActual { PersonaId = mariana.Id, Aspecto = "Pasarela", Nota = 7.2, Fecha = "2026-09-02" },
            new HabilidadActual { PersonaId = mariana.Id, Aspecto = "Manejo de cuerpo", Nota = 6.5, Fecha = "2026-09-02" },
            new HabilidadActual { PersonaId = mariana.Id, Aspecto = "Foto pose", Nota = 5.8, Fecha = "2026-08-20" },
            new HabilidadActual { PersonaId = isabella.Id, Aspecto = "Foto pose", Nota = 9.0, Fecha = "2026-07-10" },
            new HabilidadActual { PersonaId = isabella.Id, Aspecto = "Expresión", Nota = 9.3, Fecha = "2026-07-10" },
            new HabilidadActual { PersonaId = isabella.Id, Aspecto = "Pasarela", Nota = 8.8, Fecha = "2026-06-15" },
            new HabilidadActual { PersonaId = gabriela.Id, Aspecto = "Foto pose", Nota = 7.5, Fecha = "2025-08-15" },
            new HabilidadActual { PersonaId = gabriela.Id, Aspecto = "Pasarela", Nota = 6.9, Fecha = "2025-08-15" },
            new HabilidadActual { PersonaId = diego.Id, Aspecto = "Personalidad/Actitud", Nota = 7.0, Fecha = "2026-09-05" }
        );

        // ===== NOTIFICACIONES NIVEL =====
        db.NotificacionesNivel.AddRange(
            new NotificacionNivel { PersonaId = valentina.Id, CorteObjetivoId = centinelaA.Id, ScoreAlcanzado = 9.0, Estado = "Pendiente", FechaGenerada = "2026-10-01" },
            new NotificacionNivel { PersonaId = juliana.Id, CorteObjetivoId = centinelaA.Id, ScoreAlcanzado = 8.2, Estado = "Pendiente", FechaGenerada = "2026-10-02" },
            new NotificacionNivel { PersonaId = isabella.Id, CorteObjetivoId = centinelaO.Id, ScoreAlcanzado = 9.3, Estado = "Atendida", FechaGenerada = "2026-09-01", FechaAtencion = "2026-09-05" },
            new NotificacionNivel { PersonaId = gabriela.Id, CorteObjetivoId = beta3.Id, ScoreAlcanzado = 7.6, Estado = "Pendiente", FechaGenerada = "2026-10-03" }
        );

        // ===== ASIGNACIONES BOOKER =====
        db.AsignacionesBooker.AddRange(
            new AsignacionBooker { ModeloPersonaId = valentina.Id, BookerPersonaId = daniela.Id, FechaAsignacion = "2024-02-10", Activo = true },
            new AsignacionBooker { ModeloPersonaId = juliana.Id, BookerPersonaId = laura.Id, FechaAsignacion = "2023-05-01", Activo = true },
            new AsignacionBooker { ModeloPersonaId = isabella.Id, BookerPersonaId = daniela.Id, FechaAsignacion = "2022-10-01", Activo = true },
            new AsignacionBooker { ModeloPersonaId = gabriela.Id, BookerPersonaId = carlos.Id, FechaAsignacion = "2025-05-01", Activo = true }
        );

        // ===== ENTREVISTAS =====
        db.Entrevistas.AddRange(
            new Entrevista { AspirantePersonaId = camila.Id, FechaHora = "2026-09-01T15:00:00", ResponsablePersonaId = felipe.Id, EstadoAsistencia = "Realizada" },
            new Entrevista { AspirantePersonaId = sofia.Id, FechaHora = "2026-09-15T12:00:00", ResponsablePersonaId = felipe.Id, EstadoAsistencia = "Pendiente" },
            new Entrevista { AspirantePersonaId = diego.Id, FechaHora = "2026-10-08T14:00:00", ResponsablePersonaId = felipe.Id, EstadoAsistencia = "Pendiente" },
            new Entrevista { AspirantePersonaId = nicol.Id, FechaHora = "2026-08-20T10:00:00", ResponsablePersonaId = sara.Id, EstadoAsistencia = "Cancelada" }
        );

        // ===== FORMATOS OFICIALES =====
        db.FormatosOficiales.AddRange(
            new FormatoOficial { Nombre = "Contrato de exclusividad", Categoria = "Contratos", Roles = new List<string> { "Administrativo", "Head Booker", "Dueño" } },
            new FormatoOficial { Nombre = "Ficha técnica de modelo", Categoria = "Booking", Roles = new List<string> { "Booker", "Head Booker", "Dueño" } },
            new FormatoOficial { Nombre = "Formulario de casting", Categoria = "Reclutamiento", Roles = new List<string> { "Entrevistador", "Scouter", "Dueño" } },
            new FormatoOficial { Nombre = "Cesión de derechos de imagen", Categoria = "Producción", Roles = new List<string> { "Producción", "Creativo", "Administrativo", "Dueño" } },
            new FormatoOficial { Nombre = "Plantilla de acta de junta", Categoria = "Administrativo", Roles = new List<string> { "Administrativo", "Dueño" } },
            new FormatoOficial { Nombre = "Acuerdo de vinculación", Categoria = "Vinculación", Roles = new List<string> { "Administrativo", "Head Booker", "Dueño" } },
            new FormatoOficial { Nombre = "Formato de polaroids", Categoria = "Booking", Roles = new List<string> { "Booker", "Head Booker", "Dueño" } },
            new FormatoOficial { Nombre = "Lineamientos Red Creativa", Categoria = "Producción", Roles = new List<string> { "Producción", "Creativo", "Dueño" } },
            new FormatoOficial { Nombre = "Reporte de gastos", Categoria = "Finanzas", Roles = new List<string> { "Tesorería Agencia", "Tesorería Academia", "Administrativo", "Dueño" } }
        );

        // ===== ACTAS DE REUNIÓN =====
        db.ActasReunion.AddRange(
            new ActaReunion { Fecha = "2026-08-28", Tema = "Revisión de tarifario 2026-II", Contenido = "Se aprueba el ajuste de tarifas para Beta II en adelante.", AutorPersonaId = jun.Id },
            new ActaReunion { Fecha = "2026-09-15", Tema = "Nueva cohorte de pasarela", Contenido = "Se define fecha de inicio para octubre con mínimo de 8 inscritos.", AutorPersonaId = jun.Id },
            new ActaReunion { Fecha = "2026-10-01", Tema = "Balance Q3 2026", Contenido = "Revisión de ingresos y egresos del trimestre. Balance positivo en ambas divisiones.", AutorPersonaId = paola.Id }
        );

        // ===== ESPACIO PRIVADO =====
        db.EspacioPrivado.AddRange(
            new EspacioPrivado { Fecha = "2026-09-05", Titulo = "Decisión: nueva cohorte de pasarela", Contenido = "Evaluar apertura de cohorte extra en octubre si hay 8+ inscritos." },
            new EspacioPrivado { Fecha = "2026-10-01", Titulo = "Alerta de ascenso Valentina", Contenido = "Valentina alcanzó 9.0 en Centinela Alpha. Programar cambio de corte." }
        );

        // ===== DOCUMENTOS ADMINISTRATIVOS (metadatos; los archivos viven en Drive) =====
        await SeedDocumentacionAsync(db);

        // ===== DEPARTAMENTO DE RECLUTAMIENTO =====
        await SeedReclutamientoAsync(db);

        await db.SaveChangesAsync();
    }

    // Sembrado de los roles de trabajo.
    // Tiene guard propio porque la tabla se añadió en una migración posterior
    // al seed inicial: puede ejecutarse sobre una base ya poblada.
    // Deriva el rol desde Staff.Rol para no perder los roles ya configurados.
    public static async Task SeedStaffRolesAsync(CronoDbContext db)
    {
        if (await db.StaffRoles.AnyAsync()) return;

        var staff = await db.Staff.ToListAsync();
        if (staff.Count == 0) return;

        db.StaffRoles.AddRange(staff.Select(s => new StaffRol
        {
            PersonaId = s.PersonaId,
            Rol = s.Rol,
        }));

        await db.SaveChangesAsync();
    }

    // Sembrado del repositorio documental y de contratos.
    // Tiene guard propio porque las tablas se añadieron en una migración posterior
    // al seed inicial: puede ejecutarse sobre una base ya poblada.
    // Los registros se crean sin enlace: hasta que no exista la integración con el
    // repositorio de archivos no se debe mostrar como si el archivo ya estuviera
    // cargado. El enlace se completa desde la gestión del módulo administrativo.
    public static async Task SeedDocumentacionAsync(CronoDbContext db)
    {
        if (db.Documentos.Any()) return;

        var personas = await db.Personas.ToListAsync();
        Persona P(string nombre) => personas.First(p => p.NombreCompleto == nombre);

        var valentina = P("Valentina Ríos");
        var juliana = P("Juliana Pardo");
        var isabella = P("Isabella Moreno");
        var gabriela = P("Gabriela Castro");

        db.Documentos.AddRange(
            // CEO y Dirección — Legal
            new Documento { Departamento = "ceo-direccion", Categoria = "legal", Nombre = "Cámara de Comercio — Matrícula mercantil", Tipo = "Documento", Fecha = "2021-02-15", Roles = new List<string> { "Dueño", "Administrativo" } },
            new Documento { Departamento = "ceo-direccion", Categoria = "legal", Nombre = "RUT y registro tributario", Tipo = "Documento", Fecha = "2021-02-20", Roles = new List<string> { "Dueño", "Administrativo" } },
            new Documento { Departamento = "ceo-direccion", Categoria = "legal", Nombre = "Certificado de existencia y representación legal", Tipo = "Documento", Fecha = "2025-03-10", Roles = new List<string> { "Dueño", "Administrativo" } },
            new Documento { Departamento = "ceo-direccion", Categoria = "legal", Nombre = "Póliza de responsabilidad civil extracontractual", Tipo = "Documento", Fecha = "2026-01-12", Roles = new List<string> { "Dueño", "Administrativo" } },

            // CEO y Dirección — Documentación institucional
            new Documento { Departamento = "ceo-direccion", Categoria = "institucional", Nombre = "Núcleo operativo Crono", Tipo = "Documento", Fecha = "2024-06-01", Roles = new List<string> { "Dueño", "Administrativo", "Head Booker" } },
            new Documento { Departamento = "ceo-direccion", Categoria = "institucional", Nombre = "Libro del regente de Crono", Tipo = "Documento", Fecha = "2024-08-20", Roles = new List<string> { "Dueño" } },
            new Documento { Departamento = "ceo-direccion", Categoria = "institucional", Nombre = "Manual de procesos internos", Tipo = "Documento", Fecha = "2025-04-18", Roles = new List<string> { "Dueño", "Administrativo" } },
            new Documento { Departamento = "ceo-direccion", Categoria = "institucional", Nombre = "Organigrama y áreas funcionales", Tipo = "Documento", Fecha = "2025-09-02", Roles = new List<string> { "Dueño", "Administrativo" } },

            // Formatos oficiales — Logotipos
            new Documento { Departamento = "formatos", Categoria = "logos", Nombre = "Logo principal — horizontal", Tipo = "Logo", Fecha = "2023-01-15", Roles = new List<string> { "Dueño", "Administrativo" } },
            new Documento { Departamento = "formatos", Categoria = "logos", Nombre = "Logo principal — isotipo", Tipo = "Logo", Fecha = "2023-01-15", Roles = new List<string> { "Dueño", "Administrativo" } },
            new Documento { Departamento = "formatos", Categoria = "logos", Nombre = "Logo monocromo — positivo", Tipo = "Logo", Fecha = "2023-01-15", Roles = new List<string> { "Dueño", "Administrativo" } },
            new Documento { Departamento = "formatos", Categoria = "logos", Nombre = "Logo monocromo — negativo", Tipo = "Logo", Fecha = "2023-01-15", Roles = new List<string> { "Dueño", "Administrativo" } },

            // Formatos oficiales — Papelería corporativa
            new Documento { Departamento = "formatos", Categoria = "papeleria", Nombre = "Papelería — encabezado cartas", Tipo = "Documento", Fecha = "2023-02-01", Roles = new List<string> { "Dueño", "Administrativo" } },
            new Documento { Departamento = "formatos", Categoria = "papeleria", Nombre = "Tarjetas de presentación", Tipo = "Documento", Fecha = "2023-02-01", Roles = new List<string> { "Dueño", "Administrativo" } },
            new Documento { Departamento = "formatos", Categoria = "papeleria", Nombre = "Identidad corporativa — guía de uso", Tipo = "Documento", Fecha = "2023-03-10", Roles = new List<string> { "Dueño", "Administrativo" } },

            // Formatos oficiales — Plantillas
            new Documento { Departamento = "formatos", Categoria = "plantillas", Nombre = "Plantilla de acuerdo", Tipo = "Plantilla", Fecha = "2023-04-05", Roles = new List<string> { "Dueño", "Administrativo" } },
            new Documento { Departamento = "formatos", Categoria = "plantillas", Nombre = "Plantilla de contrato", Tipo = "Plantilla", Fecha = "2023-04-05", Roles = new List<string> { "Dueño", "Administrativo" } },
            new Documento { Departamento = "formatos", Categoria = "plantillas", Nombre = "Plantilla de cuenta de cobro", Tipo = "Plantilla", Fecha = "2023-04-05", Roles = new List<string> { "Dueño", "Administrativo", "Tesorería Agencia" } },
            new Documento { Departamento = "formatos", Categoria = "plantillas", Nombre = "Plantilla de factura", Tipo = "Plantilla", Fecha = "2023-04-05", Roles = new List<string> { "Dueño", "Administrativo", "Tesorería Agencia" } },
            new Documento { Departamento = "formatos", Categoria = "plantillas", Nombre = "Plantilla de cotización", Tipo = "Plantilla", Fecha = "2023-04-05", Roles = new List<string> { "Dueño", "Administrativo", "Head Booker" } },

            // Junta del Oráculo — Horizonte Crono
            new Documento { Departamento = "junta-oraculo", Categoria = "horizonte", Nombre = "Plan anual 2026", Tipo = "Documento", Fecha = "2026-01-08", Roles = new List<string> { "Dueño", "Administrativo" } },
            new Documento { Departamento = "junta-oraculo", Categoria = "horizonte", Nombre = "Objetivos estratégicos 2026 — OKR", Tipo = "Documento", Fecha = "2026-01-15", Roles = new List<string> { "Dueño", "Administrativo" } },
            new Documento { Departamento = "junta-oraculo", Categoria = "horizonte", Nombre = "Tareas pendientes — Q4 2026", Tipo = "Documento", Fecha = "2026-10-01", Roles = new List<string> { "Dueño", "Administrativo" } },

            // Junta del Oráculo — Minutas
            new Documento { Departamento = "junta-oraculo", Categoria = "minutas", Nombre = "Plantilla oficial de minuta", Tipo = "Plantilla", Fecha = "2024-02-01", Roles = new List<string> { "Dueño", "Administrativo" } }
        );

        // ===== CONTRATOS FIRMADOS =====
        db.Contratos.AddRange(
            new Contrato { ModeloPersonaId = valentina.Id, Tipo = "Exclusividad", FechaFirma = "2024-02-10", Estado = "Vigente", Observaciones = "Exclusividad regional, 12 meses renovables." },
            new Contrato { ModeloPersonaId = valentina.Id, Tipo = "Representación", FechaFirma = "2024-02-10", Estado = "Vigente" },
            new Contrato { ModeloPersonaId = juliana.Id, Tipo = "Colaboración", FechaFirma = "2023-05-01", Estado = "Vigente", Observaciones = "Proyectos puntuales, sin exclusividad." },
            new Contrato { ModeloPersonaId = isabella.Id, Tipo = "Exclusividad", FechaFirma = "2022-10-01", Estado = "Vigente" },
            new Contrato { ModeloPersonaId = isabella.Id, Tipo = "Vinculación", FechaFirma = "2023-01-15", Estado = "Vigente" },
            new Contrato { ModeloPersonaId = gabriela.Id, Tipo = "Representación", FechaFirma = "2025-05-01", Estado = "Vigente" },
            new Contrato { ModeloPersonaId = gabriela.Id, Tipo = "Colaboración", FechaFirma = "2025-05-01", Estado = "Vencido", Observaciones = "Finalizó con la campaña de lanzamiento." }
        );

        await db.SaveChangesAsync();
    }

    // Sembrado del departamento de Reclutamiento. Tiene guard propio porque las
    // tablas y los permisos se añadieron en una migración posterior al seed
    // inicial: puede ejecutarse sobre una base ya poblada.
    public static async Task SeedReclutamientoAsync(CronoDbContext db)
    {
        // Trabajadora con el rol Scouter de Aliados: permite comprobar que el rol
        // nuevo no obtiene acceso a los recursos del resto del departamento.
        if (!await db.Staff.AnyAsync(s => s.Rol == "Scouter de Aliados"))
        {
            var ana = new Persona
            {
                NombreCompleto = "Ana Salazar",
                FechaNacimiento = "1996-07-19",
                Telefono = "3146667777",
                Correo = "ana@crono.com",
                FechaCreacion = "2024-04-18",
            };
            db.Personas.Add(ana);
            await db.SaveChangesAsync();

            db.Staff.Add(new Staff
            {
                PersonaId = ana.Id,
                Nombre = "Ana Salazar",
                Rol = "Scouter de Aliados",
                FechaContratacion = "2024-04-18",
            });
            db.StaffRoles.Add(new StaffRol { PersonaId = ana.Id, Rol = "Scouter de Aliados" });
            await db.SaveChangesAsync();
        }

        // Los dos documentos de Reclutamiento se conocen por su denominación pero
        // no se ha facilitado ningún enlace: se crea la entrada vacía para que el
        // equipo registre la referencia real. No se inventa ninguna URL.
        if (!await db.Documentos.AnyAsync(d => d.Departamento == "reclutamiento"))
        {
            db.Documentos.AddRange(
                new Documento
                {
                    Departamento = "reclutamiento",
                    Categoria = "contactos",
                    Nombre = "Reclutamiento de Contactos",
                    Tipo = "Documento",
                    Enlace = null,
                    Roles = new List<string>
                    {
                        "Dueño", "Administrativo", "Entrevistador", "Scouter", "Scouter de Aliados",
                    },
                },
                new Documento
                {
                    Departamento = "reclutamiento",
                    Categoria = "ruta-modelos",
                    Nombre = "Ruta de Modelos Crono",
                    Tipo = "Documento",
                    Enlace = null,
                    Roles = new List<string>
                    {
                        "Dueño", "Administrativo", "Entrevistador", "Scouter", "Scouter de Aliados",
                    },
                }
            );
            await db.SaveChangesAsync();
        }
    }
}

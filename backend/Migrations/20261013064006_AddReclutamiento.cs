using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Crono.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddReclutamiento : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FechaActualizacion",
                table: "Entrevistas",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "FechaCreacion",
                table: "Entrevistas",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "FechaSeguimiento",
                table: "Entrevistas",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Observaciones",
                table: "Entrevistas",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProximosPasos",
                table: "Entrevistas",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Resultado",
                table: "Entrevistas",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Descripcion",
                table: "Colaboradores",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Enfoque",
                table: "Colaboradores",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FechaAceptacionLineamientos",
                table: "Colaboradores",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FechaActualizacion",
                table: "Colaboradores",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FechaRegistro",
                table: "Colaboradores",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ModalidadVinculacion",
                table: "Colaboradores",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NombreProfesional",
                table: "Colaboradores",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Observaciones",
                table: "Colaboradores",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OtrosContactos",
                table: "Colaboradores",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ResponsablePersonaId",
                table: "Colaboradores",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RolesCreativos",
                table: "Colaboradores",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TikTok",
                table: "Colaboradores",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Estatura",
                table: "Aspirantes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FechaEstado",
                table: "Aspirantes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FechaRegistro",
                table: "Aspirantes",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "FechaSeguimiento",
                table: "Aspirantes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NombreSocial",
                table: "Aspirantes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Notas",
                table: "Aspirantes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Pronombres",
                table: "Aspirantes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProximasAcciones",
                table: "Aspirantes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CastingConvocatorias",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FechaHora = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Lugar = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Estado = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Observaciones = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ResponsablePersonaId = table.Column<int>(type: "int", nullable: true),
                    FechaCreacion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FechaActualizacion = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CastingConvocatorias", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CastingParticipantes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ConvocatoriaId = table.Column<int>(type: "int", nullable: false),
                    Numero = table.Column<int>(type: "int", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Contacto = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Instagram = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Perfil = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Estado = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Opcion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Seguimiento = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Anotaciones = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AspirantePersonaId = table.Column<int>(type: "int", nullable: true),
                    FechaCreacion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FechaActualizacion = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CastingParticipantes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Copys",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Titulo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Contenido = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Categoria = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FechaCreacion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FechaActualizacion = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Copys", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EnviosPublicos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Tipo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FechaEnvio = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    OrigenHash = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Trampa = table.Column<bool>(type: "bit", nullable: false),
                    NombreCompleto = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NombreSocial = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Pronombres = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Edad = table.Column<int>(type: "int", nullable: true),
                    WhatsApp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Instagram = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Estatura = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TikTok = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RolesCreativos = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Enfoque = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModalidadVinculacion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OtrosContactos = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LocacionNombre = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LocacionDireccion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LocacionNotas = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AutorizaDatos = table.Column<bool>(type: "bit", nullable: false),
                    RevisionPersonaId = table.Column<int>(type: "int", nullable: true),
                    FechaRevision = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ObservacionesRevision = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RegistroPersonaId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EnviosPublicos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LocacionesAliadas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Direccion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ContactoNombre = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ContactoTelefono = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ContactoRedes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CondicionesCanje = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Disponibilidad = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Observaciones = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Estado = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ColaboradorPersonaId = table.Column<int>(type: "int", nullable: true),
                    ResponsablePersonaId = table.Column<int>(type: "int", nullable: true),
                    FechaRegistro = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FechaActualizacion = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LocacionesAliadas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TextosLegales",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Clave = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Valor = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FechaActualizacion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ActualizadoPorPersonaId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TextosLegales", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CastingConvocatorias_Estado",
                table: "CastingConvocatorias",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_CastingParticipantes_ConvocatoriaId",
                table: "CastingParticipantes",
                column: "ConvocatoriaId");

            migrationBuilder.CreateIndex(
                name: "IX_CastingParticipantes_ConvocatoriaId_AspirantePersonaId",
                table: "CastingParticipantes",
                columns: new[] { "ConvocatoriaId", "AspirantePersonaId" },
                unique: true,
                filter: "[AspirantePersonaId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Copys_Categoria",
                table: "Copys",
                column: "Categoria");

            migrationBuilder.CreateIndex(
                name: "IX_EnviosPublicos_Estado",
                table: "EnviosPublicos",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_EnviosPublicos_OrigenHash_FechaEnvio",
                table: "EnviosPublicos",
                columns: new[] { "OrigenHash", "FechaEnvio" });

            migrationBuilder.CreateIndex(
                name: "IX_LocacionesAliadas_Estado",
                table: "LocacionesAliadas",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_TextosLegales_Clave",
                table: "TextosLegales",
                column: "Clave",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CastingConvocatorias");

            migrationBuilder.DropTable(
                name: "CastingParticipantes");

            migrationBuilder.DropTable(
                name: "Copys");

            migrationBuilder.DropTable(
                name: "EnviosPublicos");

            migrationBuilder.DropTable(
                name: "LocacionesAliadas");

            migrationBuilder.DropTable(
                name: "TextosLegales");

            migrationBuilder.DropColumn(
                name: "FechaActualizacion",
                table: "Entrevistas");

            migrationBuilder.DropColumn(
                name: "FechaCreacion",
                table: "Entrevistas");

            migrationBuilder.DropColumn(
                name: "FechaSeguimiento",
                table: "Entrevistas");

            migrationBuilder.DropColumn(
                name: "Observaciones",
                table: "Entrevistas");

            migrationBuilder.DropColumn(
                name: "ProximosPasos",
                table: "Entrevistas");

            migrationBuilder.DropColumn(
                name: "Resultado",
                table: "Entrevistas");

            migrationBuilder.DropColumn(
                name: "Descripcion",
                table: "Colaboradores");

            migrationBuilder.DropColumn(
                name: "Enfoque",
                table: "Colaboradores");

            migrationBuilder.DropColumn(
                name: "FechaAceptacionLineamientos",
                table: "Colaboradores");

            migrationBuilder.DropColumn(
                name: "FechaActualizacion",
                table: "Colaboradores");

            migrationBuilder.DropColumn(
                name: "FechaRegistro",
                table: "Colaboradores");

            migrationBuilder.DropColumn(
                name: "ModalidadVinculacion",
                table: "Colaboradores");

            migrationBuilder.DropColumn(
                name: "NombreProfesional",
                table: "Colaboradores");

            migrationBuilder.DropColumn(
                name: "Observaciones",
                table: "Colaboradores");

            migrationBuilder.DropColumn(
                name: "OtrosContactos",
                table: "Colaboradores");

            migrationBuilder.DropColumn(
                name: "ResponsablePersonaId",
                table: "Colaboradores");

            migrationBuilder.DropColumn(
                name: "RolesCreativos",
                table: "Colaboradores");

            migrationBuilder.DropColumn(
                name: "TikTok",
                table: "Colaboradores");

            migrationBuilder.DropColumn(
                name: "Estatura",
                table: "Aspirantes");

            migrationBuilder.DropColumn(
                name: "FechaEstado",
                table: "Aspirantes");

            migrationBuilder.DropColumn(
                name: "FechaRegistro",
                table: "Aspirantes");

            migrationBuilder.DropColumn(
                name: "FechaSeguimiento",
                table: "Aspirantes");

            migrationBuilder.DropColumn(
                name: "NombreSocial",
                table: "Aspirantes");

            migrationBuilder.DropColumn(
                name: "Notas",
                table: "Aspirantes");

            migrationBuilder.DropColumn(
                name: "Pronombres",
                table: "Aspirantes");

            migrationBuilder.DropColumn(
                name: "ProximasAcciones",
                table: "Aspirantes");
        }
    }
}

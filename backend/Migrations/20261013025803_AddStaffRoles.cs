using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Crono.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddStaffRoles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "StaffRoles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PersonaId = table.Column<int>(type: "int", nullable: false),
                    Rol = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaffRoles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StaffRoles_Personas_PersonaId",
                        column: x => x.PersonaId,
                        principalTable: "Personas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StaffRoles_PersonaId",
                table: "StaffRoles",
                column: "PersonaId");

            migrationBuilder.CreateIndex(
                name: "IX_StaffRoles_PersonaId_Rol",
                table: "StaffRoles",
                columns: new[] { "PersonaId", "Rol" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StaffRoles");
        }
    }
}

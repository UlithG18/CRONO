using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Crono.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEnvioPublicoTelefono : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Telefono",
                table: "EnviosPublicos",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Telefono",
                table: "EnviosPublicos");
        }
    }
}

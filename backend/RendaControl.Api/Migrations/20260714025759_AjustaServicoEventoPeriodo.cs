using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RendaControl.Api.Migrations
{
    /// <inheritdoc />
    public partial class AjustaServicoEventoPeriodo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "MateriaisUtilizados",
                table: "Servicos",
                newName: "Evento");

            migrationBuilder.RenameColumn(
                name: "DataRealizacao",
                table: "Servicos",
                newName: "DataInicio");

            migrationBuilder.AddColumn<DateTime>(
                name: "DataFim",
                table: "Servicos",
                type: "timestamp without time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DataFim",
                table: "Servicos");

            migrationBuilder.RenameColumn(
                name: "Evento",
                table: "Servicos",
                newName: "MateriaisUtilizados");

            migrationBuilder.RenameColumn(
                name: "DataInicio",
                table: "Servicos",
                newName: "DataRealizacao");
        }
    }
}

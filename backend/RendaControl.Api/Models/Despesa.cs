using System.ComponentModel.DataAnnotations.Schema;

namespace RendaControl.Api.Models;

[Table("Despesas")]
public class Despesa
{
    public Guid Id { get; set; }
    public int UsuarioId { get; set; }

    public string Descricao { get; set; } = string.Empty;

    public decimal Valor { get; set; }

    public DateOnly Data { get; set; }

    public string Categoria { get; set; } = "outros";
}

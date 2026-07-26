using System.ComponentModel.DataAnnotations.Schema;

namespace RendaControl.Api.Models;

[Table("Despesas")]
public class Despesa
{
    public Guid Id { get; set; }

    // Mesmo padrão usado em Cliente/Servico: Id do Usuario dono do registro.
    public int UsuarioId { get; set; }

    public string Descricao { get; set; } = string.Empty;

    public decimal Valor { get; set; }

    public DateOnly Data { get; set; }

    // materiais, software, transporte, marketing, alimentacao, outros
    public string Categoria { get; set; } = "outros";
}

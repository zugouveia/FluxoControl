using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RendaControl.Api.Models;

[Table("Clientes")]
public class Cliente
{
    [Key]
    public int Id { get; set; }

    // Dono do registro (Id do Usuario). Garante que cada usuária só veja os próprios clientes.
    public int UsuarioId { get; set; }

    [Required(ErrorMessage = "Informe o nome")]
    public string Nome { get; set; } = string.Empty;

    public string? Telefone { get; set; }

    public string? Email { get; set; }

    public string? Endereco { get; set; }

    public string? Status { get; set; }
}

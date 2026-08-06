using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RendaControl.Api.Models;

[Table("Clientes")]
public class Cliente
{
    [Key]
    public int Id { get; set; }
    public int UsuarioId { get; set; }

    [Required(ErrorMessage = "Informe o nome")]
    public string Nome { get; set; } = string.Empty;

    public string? Telefone { get; set; }

    public string? Email { get; set; }

    public string? Endereco { get; set; }

    public string? Status { get; set; }
}

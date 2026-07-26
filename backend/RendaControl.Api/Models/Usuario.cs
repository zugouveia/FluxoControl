using System.ComponentModel.DataAnnotations;

namespace RendaControl.Api.Models;

// Conta de usuária/usuário do sistema (login).
// Os nomes das propriedades ficam em inglês (Name/Email/Password)
// porque é o que o front-end (script.js) já envia no JSON de login/cadastro.
public class Usuario
{
    public int Id { get; set; }

    public string? Name { get; set; }

    [Required]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

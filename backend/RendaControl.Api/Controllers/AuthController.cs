using Microsoft.AspNetCore.Mvc;
using RendaControl.Api.Data;
using RendaControl.Api.Models;

namespace RendaControl.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;

    public AuthController(AppDbContext context)
    {
        _context = context;
    }

    // CADASTRO
    [HttpPost("register")]
    public IActionResult Register(Usuario usuario)
    {
        if (_context.Usuarios.Any(u => u.Email == usuario.Email))
        {
            return BadRequest("Email já cadastrado");
        }

        _context.Usuarios.Add(usuario);
        _context.SaveChanges();

        return Ok("Usuário criado com sucesso");
    }

    // LOGIN
    [HttpPost("login")]
    public IActionResult Login(Usuario usuario)
    {
        var existente = _context.Usuarios
            .FirstOrDefault(u =>
                u.Email == usuario.Email &&
                u.Password == usuario.Password);

        if (existente == null)
        {
            return Unauthorized("Email ou senha inválidos");
        }

        return Ok(new
        {
            message = "Login realizado com sucesso",
            user = existente
        });
    }

    // RECUPERAR SENHA
    [HttpPost("recuperar-senha")]
    public IActionResult RecuperarSenha([FromBody] RecuperarSenhaRequest request)
    {
        var usuario = _context.Usuarios.FirstOrDefault(u => u.Email == request.Email);

        if (usuario == null)
        {
            return NotFound("E-mail não encontrado.");
        }

        usuario.Password = request.NovaSenha;
        _context.SaveChanges();

        return Ok("Senha atualizada com sucesso.");
    }

    public class RecuperarSenhaRequest
    {
        public string Email { get; set; } = string.Empty;
        public string NovaSenha { get; set; } = string.Empty;
    }
}

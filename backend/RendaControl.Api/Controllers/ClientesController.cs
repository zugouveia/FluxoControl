using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RendaControl.Api.Data;
using RendaControl.Api.Models;

namespace RendaControl.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClientesController : ApiControllerBase
{
    private readonly AppDbContext _context;

    public ClientesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var usuarioId = ObterUsuarioId();
        var clientes = await _context.Clientes
            .Where(c => c.UsuarioId == usuarioId)
            .ToListAsync();
        return Ok(clientes);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var usuarioId = ObterUsuarioId();
        var cliente = await _context.Clientes
            .FirstOrDefaultAsync(c => c.Id == id && c.UsuarioId == usuarioId);
        if (cliente == null) return NotFound();
        return Ok(cliente);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Cliente cliente)
    {
        cliente.UsuarioId = ObterUsuarioId();
        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = cliente.Id }, cliente);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Cliente cliente)
    {
        if (id != cliente.Id) return BadRequest();
        cliente.UsuarioId = ObterUsuarioId();
        _context.Entry(cliente).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var usuarioId = ObterUsuarioId();
        var cliente = await _context.Clientes
            .FirstOrDefaultAsync(c => c.Id == id && c.UsuarioId == usuarioId);
        if (cliente == null) return NotFound();
        _context.Clientes.Remove(cliente);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

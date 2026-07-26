using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RendaControl.Api.Data;
using RendaControl.Api.Models;

namespace RendaControl.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServicosController : ApiControllerBase
{
    private readonly AppDbContext _context;

    public ServicosController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var usuarioId = ObterUsuarioId();
        var servicos = await _context.Servicos
            .Include(s => s.Cliente)
            .Where(s => s.UsuarioId == usuarioId)
            .ToListAsync();
        return Ok(servicos);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var usuarioId = ObterUsuarioId();
        var servico = await _context.Servicos
            .Include(s => s.Cliente)
            .FirstOrDefaultAsync(s => s.Id == id && s.UsuarioId == usuarioId);
        if (servico == null) return NotFound();
        return Ok(servico);
    }

    [HttpGet("cliente/{clienteId}")]
    public async Task<IActionResult> GetByCliente(int clienteId)
    {
        var usuarioId = ObterUsuarioId();
        var servicos = await _context.Servicos
            .Include(s => s.Cliente)
            .Where(s => s.ClienteId == clienteId && s.UsuarioId == usuarioId)
            .ToListAsync();
        return Ok(servicos);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Servico servico)
    {
        servico.UsuarioId = ObterUsuarioId();
        NormalizarDatas(servico);
        _context.Servicos.Add(servico);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = servico.Id }, servico);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Servico servico)
    {
        if (id != servico.Id) return BadRequest();
        servico.UsuarioId = ObterUsuarioId();
        NormalizarDatas(servico);
        _context.Entry(servico).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // Garante Kind=Utc (exigido pelo Npgsql) e preenche DataFim com
    // DataInicio quando o serviço é de um dia só.
    private static void NormalizarDatas(Servico servico)
    {
        if (servico.DataInicio.HasValue)
            servico.DataInicio = DateTime.SpecifyKind(servico.DataInicio.Value, DateTimeKind.Utc);

        if (servico.DataFim.HasValue)
            servico.DataFim = DateTime.SpecifyKind(servico.DataFim.Value, DateTimeKind.Utc);
        else
            servico.DataFim = servico.DataInicio;
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var usuarioId = ObterUsuarioId();
        var servico = await _context.Servicos
            .FirstOrDefaultAsync(s => s.Id == id && s.UsuarioId == usuarioId);
        if (servico == null) return NotFound();
        _context.Servicos.Remove(servico);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

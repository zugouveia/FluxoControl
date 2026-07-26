using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RendaControl.Api.Data;
using RendaControl.Api.Models;

namespace RendaControl.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FinanceiroController : ApiControllerBase
{
    private readonly AppDbContext _context;

    public FinanceiroController(AppDbContext context)
    {
        _context = context;
    }

    // Resumo do mês: receita, despesas, lucro e o que ainda está pendente.
    [HttpGet]
    public async Task<IActionResult> Obter([FromQuery] int? ano, [FromQuery] int? mes)
    {
        try
        {
            var usuarioId = ObterUsuarioId();
            var agora = DateTime.UtcNow;
            var anoFiltro = ano ?? agora.Year;
            var mesFiltro = mes ?? agora.Month;

            var servicos = await _context.Servicos
                .Include(s => s.Cliente)
                .Where(s => s.UsuarioId == usuarioId
                    && s.DataInicio != null
                    && s.DataInicio.Value.Year == anoFiltro
                    && s.DataInicio.Value.Month == mesFiltro)
                .OrderByDescending(s => s.DataInicio)
                .ToListAsync();

            var despesas = await _context.Despesas
                .Where(d => d.UsuarioId == usuarioId && d.Data.Year == anoFiltro && d.Data.Month == mesFiltro)
                .OrderByDescending(d => d.Data)
                .ToListAsync();

            decimal receita = 0;
            decimal pendente = 0;
            foreach (var s in servicos)
            {
                if ((s.Status ?? string.Empty).ToLower() == "pago")
                    receita += s.Valor;
                else
                    pendente += s.Valor;
            }

            decimal totalDespesas = despesas.Sum(d => d.Valor);
            var lucro = receita - totalDespesas;

            return Ok(new
            {
                receita,
                totalDespesas,
                lucro,
                pendente,
                servicos,
                despesas
            });
        }
        catch (Exception)
        {
            return StatusCode(500, "erro servidor");
        }
    }

    [HttpPost("despesas")]
    public async Task<IActionResult> NovaDespesa([FromBody] NovaDespesaEntrada entrada)
    {
        var usuarioId = ObterUsuarioId();

        if (entrada == null || string.IsNullOrWhiteSpace(entrada.descricao))
            return BadRequest("descricao obrigatoria");

        if (entrada.valor <= 0)
            return BadRequest("valor invalido");

        var categoria = string.IsNullOrWhiteSpace(entrada.categoria) ? "outros" : entrada.categoria.Trim();

        var despesa = new Despesa
        {
            Id = Guid.NewGuid(),
            UsuarioId = usuarioId,
            Descricao = entrada.descricao.Trim(),
            Valor = entrada.valor,
            Data = entrada.data,
            Categoria = categoria.Trim()
        };

        _context.Despesas.Add(despesa);
        await _context.SaveChangesAsync();

        return Created(string.Empty, despesa);
    }

    [HttpPut("despesas/{id}")]
    public async Task<IActionResult> EditarDespesa(Guid id, [FromBody] NovaDespesaEntrada entrada)
    {
        var usuarioId = ObterUsuarioId();
        var despesa = await _context.Despesas.FirstOrDefaultAsync(d => d.Id == id && d.UsuarioId == usuarioId);
        if (despesa == null) return NotFound();

        if (entrada == null || string.IsNullOrWhiteSpace(entrada.descricao))
            return BadRequest("descricao obrigatoria");

        if (entrada.valor <= 0)
            return BadRequest("valor invalido");

        despesa.Descricao = entrada.descricao.Trim();
        despesa.Valor = entrada.valor;
        despesa.Data = entrada.data;
        despesa.Categoria = string.IsNullOrWhiteSpace(entrada.categoria) ? "outros" : entrada.categoria.Trim();

        await _context.SaveChangesAsync();
        return Ok(despesa);
    }

    [HttpDelete("despesas/{id}")]
    public async Task<IActionResult> ApagarDespesa(Guid id)
    {
        var usuarioId = ObterUsuarioId();
        var despesa = await _context.Despesas.FirstOrDefaultAsync(d => d.Id == id && d.UsuarioId == usuarioId);
        if (despesa != null)
        {
            _context.Despesas.Remove(despesa);
            await _context.SaveChangesAsync();
        }

        return NoContent();
    }

    public class NovaDespesaEntrada
    {
        public string descricao { get; set; } = string.Empty;
        public decimal valor { get; set; }
        public DateOnly data { get; set; }
        public string? categoria { get; set; }
    }
}

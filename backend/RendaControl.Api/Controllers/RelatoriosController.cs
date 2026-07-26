using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RendaControl.Api.Data;

namespace RendaControl.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RelatoriosController : ApiControllerBase
{
    private readonly AppDbContext _context;

    public RelatoriosController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> Obter([FromQuery] int? ano)
    {
        try
        {
            var usuarioId = ObterUsuarioId();
            var anoFiltro = ano ?? DateTime.UtcNow.Year;

            var servicosDoAno = await _context.Servicos
                .Include(s => s.Cliente)
                .Where(s => s.UsuarioId == usuarioId
                    && s.DataInicio != null
                    && s.DataInicio.Value.Year == anoFiltro)
                .ToListAsync();

            var despesasDoAno = await _context.Despesas
                .Where(d => d.UsuarioId == usuarioId && d.Data.Year == anoFiltro)
                .ToListAsync();

            var meses = new List<object>();
            for (var mm = 1; mm <= 12; mm++)
            {
                var chave = $"{anoFiltro}-{mm:00}";

                var servicosDoMes = servicosDoAno
                    .Where(s => s.DataInicio!.Value.Month == mm)
                    .ToList();

                var receita = servicosDoMes
                    .Where(s => (s.Status ?? string.Empty).ToLower() == "pago")
                    .Sum(s => s.Valor);

                var despesasMes = despesasDoAno
                    .Where(d => d.Data.Month == mm)
                    .Sum(d => d.Valor);

                meses.Add(new
                {
                    mes = chave,
                    receita,
                    despesas = despesasMes,
                    lucro = receita - despesasMes,
                    servicos = servicosDoMes.Count
                });
            }

            var clientes = servicosDoAno
                .Where(s => s.Cliente != null)
                .GroupBy(s => s.Cliente!.Nome)
                .Select(g => new
                {
                    nome = g.Key,
                    total = g.Where(s => (s.Status ?? string.Empty).ToLower() == "pago").Sum(s => s.Valor),
                    servicos = g.Count()
                })
                .OrderByDescending(c => c.total)
                .Take(10)
                .ToList();

            return Ok(new { ano = anoFiltro, meses, clientes });
        }
        catch (Exception)
        {
            return StatusCode(500, "erro servidor");
        }
    }
}

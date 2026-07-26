using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RendaControl.Api.Models;

[Table("Servicos")]
public class Servico
{
    [Key]
    public int Id { get; set; }

    public int UsuarioId { get; set; }

    [Required(ErrorMessage = "Informe a descrição")]
    public string Descricao { get; set; } = string.Empty;

    [Required(ErrorMessage = "Informe o valor")]
    public decimal Valor { get; set; }

    // Data em que o serviço/evento começa. Se for um evento de um dia só,
    // DataFim fica igual a DataInicio (ou nula).
    public DateTime? DataInicio { get; set; }

    // Só é preenchida quando o serviço dura mais de um dia.
    public DateTime? DataFim { get; set; }

    public string? FormaPagamento { get; set; }

    // Pago, Pendente, Atrasado
    public string? Status { get; set; }

    // Nome/tipo do evento (ex: "Casamento Ana e João")
    public string? Evento { get; set; }

    [Required(ErrorMessage = "Informe o cliente")]
    public int ClienteId { get; set; }

    [ForeignKey("ClienteId")]
    public Cliente? Cliente { get; set; }
}

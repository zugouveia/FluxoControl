using Microsoft.AspNetCore.Mvc;

namespace RendaControl.Api.Controllers;

// Controller base: todo controller que precisa saber "de quem" são os dados
// (Clientes, Servicos, Despesas, Financeiro, Relatorios) herda daqui.
public abstract class ApiControllerBase : ControllerBase
{
    protected int ObterUsuarioId()
    {
        if (int.TryParse(Request.Headers["x-usuario-id"].FirstOrDefault(), out int id))
            return id;
        return 0;
    }
}

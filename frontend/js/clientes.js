if (!localStorage.getItem("usuarioId")) {
  window.location.href = "index.html";
}
document.querySelector(".botao-logout").addEventListener("click", function () {
  localStorage.clear();
  window.location.href = "index.html";
});

const CAMINHO_CLIENTES = "/api/clientes";
const CAMINHO_SERVICOS = "/api/servicos";

const erroEl = document.getElementById("erro");
const campoBusca = document.getElementById("campo-busca-clientes");
const tabelaBody = document.querySelector(".tabela-clientes tbody");
const tituloHistorico = document.querySelector(".painel-historico h2");
const historicoLista = document.querySelector(".historico-lista");
const btnCancelar = document.querySelector(".btn-cancelar");
const formulario = document.querySelector(".form-cadastro");
const tituloCadastro = document.querySelector(".coluna-acoes .painel-title");
const btnSalvar = document.querySelector(".btn-primary");

let todosClientes = [];
let clienteEditandoId = null;

function mostrarErro(erro) {
  erroEl.textContent = erro.message || "Erro ao carregar.";
  erroEl.classList.remove("hidden");
}

function limparErro() {
  erroEl.textContent = "";
  erroEl.classList.add("hidden");
}

//CARREGAR CLIENTES
async function carregarClientes() {
  limparErro();
  try {
    const [clientes, todosServicos] = await Promise.all([
      chamarApi(CAMINHO_CLIENTES),
      chamarApi(CAMINHO_SERVICOS),
    ]);

    todosClientes = clientes;

    atualizarCards(todosClientes, todosServicos);
    renderizarClientes(todosClientes, todosServicos);
  } catch (e) {
    mostrarErro(e);
  }
}

//ATUALIZAR CARDS
function atualizarCards(clientes, todosServicos) {
  const total = clientes.length;

  const ativos = clientes.filter(function (c) {
    return c.status === "Ativo";
  }).length;

  let percentAtivos;
  if (total > 0) {
    percentAtivos = Math.round((ativos / total) * 100);
  } else {
    percentAtivos = 0;
  }

  document.querySelector(
    ".resumo-grade .resumo-cartao:nth-child(1) .resumo-valor",
  ).textContent = total;
  document.querySelector(
    ".resumo-grade .resumo-cartao:nth-child(1) .resumo-detalhe",
  ).textContent = "+" + total + " cadastrados";
  document.querySelector(
    ".resumo-grade .resumo-cartao:nth-child(2) .resumo-valor",
  ).textContent = ativos;
  document.querySelector(
    ".resumo-grade .resumo-cartao:nth-child(2) .resumo-detalhe",
  ).textContent = percentAtivos + "% da base";

  // Card 3 - Receita por Cliente
  const servicosPagos = todosServicos.filter(function (s) {
    return s.status === "Pago";
  });

  const totalReceita = servicosPagos.reduce(function (acc, s) {
    return acc + s.valor;
  }, 0);

  let mediaPorCliente;
  if (total > 0) {
    mediaPorCliente = totalReceita / total;
  } else {
    mediaPorCliente = 0;
  }

  document.querySelector(
    ".resumo-grade .resumo-cartao:nth-child(3) .resumo-valor",
  ).textContent = formatarMoeda(mediaPorCliente);

  document.querySelector(
    ".resumo-grade .resumo-cartao:nth-child(3) .resumo-detalhe",
  ).textContent = "Por cliente / mês";

  const inadimplentes = clientes.filter(function (c) {
    return c.status === "Inadimplente";
  }).length;

  document.getElementById("total-inadimplentes").textContent = inadimplentes;
}

//FILTRAR TABELA POR STATUS (usado pelo card de Inadimplentes)
function filtrarPorStatus(status) {
  document
    .querySelectorAll(".tabela-clientes tbody tr")
    .forEach(function (linha) {
      const selectStatus = linha.querySelector(".status-cliente");
      if (!selectStatus) return;

      if (!status || selectStatus.classList.contains(status.toLowerCase())) {
        linha.style.display = "";
      } else {
        linha.style.display = "none";
      }
    });
}

document
  .getElementById("card-inadimplentes")
  .addEventListener("click", function () {
    campoBusca.value = "";
    filtrarPorStatus("inadimplente");
    document
      .querySelector(".tabela-container")
      .scrollIntoView({ behavior: "smooth", block: "start" });
  });

//RENDERIZAR TABELA
function renderizarClientes(clientes, todosServicos) {
  tabelaBody.innerHTML = "";

  clientes.forEach(function (cliente) {
    const linha = document.createElement("tr");

    // Contar quantos servicos pertencem a este cliente
    let totalServicos = 0;
    for (let i = 0; i < todosServicos.length; i++) {
      if (todosServicos[i].clienteId === cliente.id) {
        totalServicos = totalServicos + 1;
      }
    }

    let statusAtivo = "";
    let statusInadimplente = "";
    let statusNovo = "";

    if (cliente.status === "Novo") {
      statusNovo = "selected";
    } else if (cliente.status === "Ativo") {
      statusAtivo = "selected";
    } else if (cliente.status === "Inadimplente") {
      statusInadimplente = "selected";
    }

    let classeStatus = "";
    if (cliente.status) {
      classeStatus = cliente.status.toLowerCase();
    }

    let telefoneExibido;
    if (cliente.telefone) {
      telefoneExibido = cliente.telefone;
    } else {
      telefoneExibido = "-";
    }

    linha.innerHTML =
      "<td><strong>" +
      cliente.nome +
      "</strong></td>" +
      "<td>" +
      telefoneExibido +
      "</td>" +
      "<td>" +
      totalServicos +
      "</td>" +
      "<td>" +
      "<select class='status-cliente " +
      classeStatus +
      "' data-id='" +
      cliente.id +
      "'>" +
      "<option value='Novo' " +
      statusNovo +
      ">Novo</option>" +
      "<option value='Ativo' " +
      statusAtivo +
      ">Ativo</option>" +
      "<option value='Inadimplente' " +
      statusInadimplente +
      ">Inadimplente</option>" +
      "</select>" +
      "</td>" +
      "<td>" +
      "<div class='row-actions'>" +
      "<button class='btn-editar-cliente' data-id='" +
      cliente.id +
      "' title='Editar'><i class='fa-solid fa-pen-to-square'></i></button>" +
      "<button class='btn-deletar-cliente' data-id='" +
      cliente.id +
      "' title='Deletar'><i class='fa-solid fa-trash-can'></i></button>" +
      "</div>" +
      "</td>";

    //Carrega historico quando clica no cliente
    linha.addEventListener("click", function (e) {
      if (e.target.closest("select") || e.target.closest("button")) return;

      document
        .querySelectorAll(".tabela-clientes tbody tr")
        .forEach(function (l) {
          l.classList.remove("linha-selecionada");
        });

      linha.classList.add("linha-selecionada");
      carregarHistorico(cliente.id, cliente.nome);
    });

    tabelaBody.appendChild(linha);
  });

  //Status
  document.querySelectorAll(".status-cliente").forEach(function (select) {
    select.addEventListener("change", async function () {
      const id = select.dataset.id;
      const novoStatus = select.value;
      select.className = "status-cliente " + novoStatus.toLowerCase();
      await atualizarStatus(id, novoStatus);
      await carregarClientes();
    });
  });

  //Editar
  document.querySelectorAll(".btn-editar-cliente").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const id = parseInt(btn.dataset.id);
      const cliente = todosClientes.find(function (c) {
        return c.id === id;
      });
      preencherFormulario(cliente);
    });
  });

  //Deletar
  document.querySelectorAll(".btn-deletar-cliente").forEach(function (btn) {
    btn.addEventListener("click", async function () {
      const id = btn.dataset.id;
      if (!confirm("Tem certeza que deseja excluir este cliente?")) return;

      try {
        await chamarApi(CAMINHO_CLIENTES + "/" + id, { method: "DELETE" });
        carregarClientes();
      } catch (e) {
        mostrarErro(e);
      }
    });
  });
}

//PREENCHER FORMULARIO PARA EDITAR
function preencherFormulario(cliente) {
  clienteEditandoId = cliente.id;
  tituloCadastro.textContent = "EDITAR CLIENTE";
  btnSalvar.textContent = "Atualizar";

  if (cliente.nome) {
    document.querySelector('input[placeholder="Nome do cliente"]').value =
      cliente.nome;
  } else {
    document.querySelector('input[placeholder="Nome do cliente"]').value = "";
  }

  if (cliente.telefone) {
    document.querySelector('input[placeholder="(11) 99999-0000"]').value =
      cliente.telefone;
  } else {
    document.querySelector('input[placeholder="(11) 99999-0000"]').value = "";
  }

  if (cliente.email) {
    document.querySelector('input[placeholder="email@exemplo.com"]').value =
      cliente.email;
  } else {
    document.querySelector('input[placeholder="email@exemplo.com"]').value = "";
  }

  if (cliente.endereco) {
    document.querySelector('input[placeholder="Rua, número, cidade"]').value =
      cliente.endereco;
  } else {
    document.querySelector('input[placeholder="Rua, número, cidade"]').value =
      "";
  }

  formulario.scrollIntoView({ behavior: "smooth" });
}

//RESETAR FORMULARIO
function resetarFormulario() {
  clienteEditandoId = null;
  tituloCadastro.textContent = "CADASTRAR NOVO CLIENTE";
  btnSalvar.textContent = "Salvar";
  formulario.reset();
}

//SALVAR / ATUALIZAR CLIENTE
formulario.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  limparErro();

  let statusDoCliente;
  if (clienteEditandoId) {
    const clienteAtual = todosClientes.find(function (c) {
      return c.id === clienteEditandoId;
    });
    if (clienteAtual && clienteAtual.status) {
      statusDoCliente = clienteAtual.status;
    } else {
      statusDoCliente = "Novo";
    }
  } else {
    statusDoCliente = "Novo";
  }

  const dadosCliente = {
    nome: document.querySelector('input[placeholder="Nome do cliente"]').value,
    telefone: document.querySelector('input[placeholder="(11) 99999-0000"]')
      .value,
    email: document.querySelector('input[placeholder="email@exemplo.com"]')
      .value,
    endereco: document.querySelector('input[placeholder="Rua, número, cidade"]')
      .value,
    status: statusDoCliente,
  };

  try {
    if (clienteEditandoId) {
      dadosCliente.id = clienteEditandoId;
      await chamarApi(CAMINHO_CLIENTES + "/" + clienteEditandoId, {
        method: "PUT",
        body: JSON.stringify(dadosCliente),
      });
    } else {
      await chamarApi(CAMINHO_CLIENTES, {
        method: "POST",
        body: JSON.stringify(dadosCliente),
      });
    }

    resetarFormulario();
    carregarClientes();
  } catch (e) {
    mostrarErro(e);
  }
});

//HISTORICO
async function carregarHistorico(clienteId, nomeCliente) {
  tituloHistorico.textContent = "Histórico — " + nomeCliente;
  historicoLista.innerHTML = "<p class='muted'>Carregando...</p>";

  let servicos;
  try {
    servicos = await chamarApi(CAMINHO_SERVICOS + "/cliente/" + clienteId);
  } catch (e) {
    mostrarErro(e);
    historicoLista.innerHTML =
      "<p class='muted'>Não foi possível carregar o histórico.</p>";
    return;
  }

  if (servicos.length === 0) {
    historicoLista.innerHTML =
      "<p class='muted'>Nenhum serviço encontrado.</p>";
    return;
  }

  historicoLista.innerHTML = "";

  servicos.forEach(function (servico) {
    let data;
    if (servico.dataInicio) {
      const inicio = new Date(servico.dataInicio).toLocaleDateString("pt-BR", {
        timeZone: "UTC",
      });
      if (servico.dataFim && servico.dataFim !== servico.dataInicio) {
        const fim = new Date(servico.dataFim).toLocaleDateString("pt-BR", {
          timeZone: "UTC",
        });
        data = fim !== inicio ? inicio + " – " + fim : inicio;
      } else {
        data = inicio;
      }
    } else {
      data = "—";
    }

    let statusClass;
    if (servico.status === "Pago") {
      statusClass = "status-pago";
    } else if (servico.status === "Pendente") {
      statusClass = "status-pendente";
    } else {
      statusClass = "status-atrasado";
    }

    const valorFormatado = formatarMoeda(servico.valor);

    const item = document.createElement("article");
    item.classList.add("historico-item");

    item.innerHTML =
      "<div class='historico-info'>" +
      "<h3>" +
      servico.descricao +
      "</h3>" +
      "<time>" +
      data +
      "</time>" +
      "</div>" +
      "<div class='historico-valores'>" +
      "<strong>" +
      valorFormatado +
      "</strong>" +
      "<span class='" +
      statusClass +
      "'>" +
      servico.status +
      "</span>" +
      "</div>";

    historicoLista.appendChild(item);
  });
}

//ATUALIZAR STATUS
async function atualizarStatus(id, novoStatus) {
  try {
    const cliente = await chamarApi(CAMINHO_CLIENTES + "/" + id);
    cliente.status = novoStatus;
    await chamarApi(CAMINHO_CLIENTES + "/" + id, {
      method: "PUT",
      body: JSON.stringify(cliente),
    });
  } catch (e) {
    mostrarErro(e);
  }
}

//BUSCAR
campoBusca.addEventListener("input", function () {
  const termo = campoBusca.value.toLowerCase();

  document
    .querySelectorAll(".tabela-clientes tbody tr")
    .forEach(function (linha) {
      const nome = linha.querySelector("strong").innerText.toLowerCase();

      if (nome.includes(termo)) {
        linha.style.display = "";
      } else {
        linha.style.display = "none";
      }
    });
});

//CANCELAR
btnCancelar.addEventListener("click", function () {
  resetarFormulario();
});

//INICIAR
carregarClientes();

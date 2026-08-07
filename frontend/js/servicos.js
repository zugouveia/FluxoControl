if (!localStorage.getItem("usuarioId")) {
  window.location.href = "index.html";
}
document.querySelector(".botao-logout").addEventListener("click", function () {
  localStorage.clear();
  window.location.href = "index.html";
});

const CAMINHO_SERVICOS = "/api/servicos";
const CAMINHO_CLIENTES = "/api/clientes";

const erroEl = document.getElementById("erro");
const formServico = document.getElementById("form-servico");
const tabelaServicosBody = document.getElementById("tabela-servicos-body");
const selectCliente = document.getElementById("select-cliente");
const filtroStatus = document.getElementById("filtro-status");
const btnLimpar = document.getElementById("btn-limpar");
const tituloForm = document.getElementById("titulo-form-servico");
const btnRegistrar = document.getElementById("btn-registrar");

let todosServicos = [];
let servicoEditandoId = null;

function mostrarErro(erro) {
  erroEl.textContent = erro.message || "Erro ao carregar.";
  erroEl.classList.remove("hidden");
}

function limparErro() {
  erroEl.textContent = "";
  erroEl.classList.add("hidden");
}

// Formata a data (ou periodo) do serviço pra exibir na tabela
function formatarPeriodoServico(servico) {
  if (!servico.dataInicio) return "—";

  const inicio = new Date(servico.dataInicio).toLocaleDateString("pt-BR", {
    timeZone: "UTC",
  });

  if (!servico.dataFim || servico.dataFim === servico.dataInicio) {
    return inicio;
  }

  const fim = new Date(servico.dataFim).toLocaleDateString("pt-BR", {
    timeZone: "UTC",
  });
  if (fim === inicio) return inicio;

  return inicio + " – " + fim;
}

//CARREGAR CLIENTES NO SELECT
async function carregarClientesSelect() {
  try {
    const clientes = await chamarApi(CAMINHO_CLIENTES);
    selectCliente.innerHTML = '<option value="">Selecione um cliente</option>';

    clientes.forEach(function (cliente) {
      const option = document.createElement("option");
      option.value = cliente.id;
      option.textContent = cliente.nome;
      selectCliente.appendChild(option);
    });
  } catch (e) {
    mostrarErro(e);
  }
}

//CARREGAR SERVIÇOS
async function carregarServicos() {
  limparErro();
  try {
    todosServicos = await chamarApi(CAMINHO_SERVICOS);
    atualizarCards(todosServicos);
    renderizarServicos(todosServicos);
  } catch (e) {
    mostrarErro(e);
  }
}

//CARDS
function atualizarCards(servicos) {
  const total = servicos.length;

  const receita = servicos.reduce(function (acc, s) {
    return acc + s.valor;
  }, 0);

  const pagos = servicos.filter(function (s) {
    return s.status === "Pago";
  }).length;

  const atrasados = servicos.filter(function (s) {
    return s.status === "Atrasado";
  }).length;

  let taxa;
  if (total > 0) {
    taxa = Math.round((pagos / total) * 100);
  } else {
    taxa = 0;
  }

  document.getElementById("total-servicos").textContent = total;
  document.getElementById("total-receita").textContent = formatarMoeda(receita);

  if (total > 0) {
    document.getElementById("ticket-medio").textContent = formatarMoeda(
      receita / total,
    );
  } else {
    document.getElementById("ticket-medio").textContent = formatarMoeda(0);
  }

  document.getElementById("taxa-pagamento").textContent = taxa + "%";
  document.getElementById("detalhe-pagamento").textContent =
    pagos + " de " + total + " pagos";

  document.getElementById("total-atrasados").textContent = atrasados;
}

//RENDERIZAR TABELA
function renderizarServicos(servicos) {
  tabelaServicosBody.innerHTML = "";

  servicos.forEach(function (servico) {
    const linha = document.createElement("tr");

    let nomeCliente;
    if (servico.cliente && servico.cliente.nome) {
      nomeCliente = servico.cliente.nome;
    } else {
      nomeCliente = "-";
    }

    let classeStatus;
    if (servico.status) {
      classeStatus = servico.status.toLowerCase();
    } else {
      classeStatus = "";
    }

    let selecionadoPendente = "";
    let selecionadoPago = "";
    let selecionadoAtrasado = "";

    if (servico.status === "Pendente") {
      selecionadoPendente = "selected";
    } else if (servico.status === "Pago") {
      selecionadoPago = "selected";
    } else if (servico.status === "Atrasado") {
      selecionadoAtrasado = "selected";
    }

    const valorFormatado = formatarMoeda(servico.valor);
    const evento = servico.evento ? servico.evento : "—";
    const periodo = formatarPeriodoServico(servico);

    linha.innerHTML =
      "<td>" +
      servico.descricao +
      "</td>" +
      "<td>" +
      evento +
      "</td>" +
      "<td>" +
      nomeCliente +
      "</td>" +
      "<td>" +
      periodo +
      "</td>" +
      "<td>" +
      valorFormatado +
      "</td>" +
      "<td>" +
      "<select class='status-servico-select " +
      classeStatus +
      "' data-id='" +
      servico.id +
      "'>" +
      "<option value='Pendente' " +
      selecionadoPendente +
      ">Pendente</option>" +
      "<option value='Pago' " +
      selecionadoPago +
      ">Pago</option>" +
      "<option value='Atrasado' " +
      selecionadoAtrasado +
      ">Atrasado</option>" +
      "</select>" +
      "</td>" +
      "<td>" +
      "<div class='row-actions'>" +
      "<button class='btn-editar-servico' data-id='" +
      servico.id +
      "' title='Editar'><i class='fa-solid fa-pen-to-square'></i></button>" +
      "<button class='btn-deletar-servico' data-id='" +
      servico.id +
      "' title='Deletar'><i class='fa-solid fa-trash-can'></i></button>" +
      "</div>" +
      "</td>";

    tabelaServicosBody.appendChild(linha);
  });

  //Status
  document
    .querySelectorAll(".status-servico-select")
    .forEach(function (select) {
      select.addEventListener("change", async function () {
        const id = select.dataset.id;
        const novoStatus = select.value;
        select.className = "status-servico-select " + novoStatus.toLowerCase();
        await atualizarStatusServico(id, novoStatus);
        await carregarServicos();
      });
    });

  //Editar
  document.querySelectorAll(".btn-editar-servico").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const id = parseInt(btn.dataset.id);
      const servico = todosServicos.find(function (s) {
        return s.id === id;
      });
      preencherFormServico(servico);
    });
  });

  //Deletar
  document.querySelectorAll(".btn-deletar-servico").forEach(function (btn) {
    btn.addEventListener("click", async function () {
      if (!confirm("Tem certeza que deseja excluir este serviço?")) return;

      try {
        await chamarApi(CAMINHO_SERVICOS + "/" + btn.dataset.id, {
          method: "DELETE",
        });
        carregarServicos();
      } catch (e) {
        mostrarErro(e);
      }
    });
  });
}

//PREENCHER FORMULARIO PARA EDITAR
function preencherFormServico(servico) {
  servicoEditandoId = servico.id;
  tituloForm.textContent = "EDITAR SERVIÇO";
  btnRegistrar.textContent = "Atualizar";

  selectCliente.value = servico.clienteId;

  if (servico.descricao) {
    document.getElementById("input-descricao").value = servico.descricao;
  } else {
    document.getElementById("input-descricao").value = "";
  }

  if (servico.dataInicio) {
    document.getElementById("input-data-inicio").value =
      servico.dataInicio.split("T")[0];
  } else {
    document.getElementById("input-data-inicio").value = "";
  }

  if (servico.dataFim && servico.dataFim !== servico.dataInicio) {
    document.getElementById("input-data-fim").value =
      servico.dataFim.split("T")[0];
  } else {
    document.getElementById("input-data-fim").value = "";
  }

  if (servico.valor) {
    document.getElementById("input-valor").value = servico.valor;
  } else {
    document.getElementById("input-valor").value = "";
  }

  if (servico.formaPagamento) {
    document.getElementById("select-pagamento").value = servico.formaPagamento;
  } else {
    document.getElementById("select-pagamento").value = "PIX";
  }

  if (servico.evento) {
    document.getElementById("input-evento").value = servico.evento;
  } else {
    document.getElementById("input-evento").value = "";
  }

  if (servico.status) {
    document.getElementById("select-status").value = servico.status;
  } else {
    document.getElementById("select-status").value = "Pendente";
  }

  formServico.scrollIntoView({ behavior: "smooth" });
}

//RESETAR FORMULARIO
function resetarFormServico() {
  servicoEditandoId = null;
  tituloForm.textContent = "REGISTRAR NOVO SERVIÇO";
  btnRegistrar.textContent = "Registrar";
  formServico.reset();
}

//SALVAR / ATUALIZAR SERVIÇO
formServico.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  limparErro();

  const dataInicio = document.getElementById("input-data-inicio").value || null;
  const dataFim = document.getElementById("input-data-fim").value || null;

  const dados = {
    clienteId: parseInt(selectCliente.value),
    descricao: document.getElementById("input-descricao").value,
    dataInicio: dataInicio,
    dataFim: dataFim,
    valor: parseFloat(document.getElementById("input-valor").value),
    formaPagamento: document.getElementById("select-pagamento").value,
    evento: document.getElementById("input-evento").value,
    status: document.getElementById("select-status").value,
  };

  try {
    if (servicoEditandoId) {
      dados.id = servicoEditandoId;
      await chamarApi(CAMINHO_SERVICOS + "/" + servicoEditandoId, {
        method: "PUT",
        body: JSON.stringify(dados),
      });
    } else {
      await chamarApi(CAMINHO_SERVICOS, {
        method: "POST",
        body: JSON.stringify(dados),
      });
    }

    resetarFormServico();
    carregarServicos();
  } catch (e) {
    mostrarErro(e);
  }
});

//ATUALIZAR STATUS
async function atualizarStatusServico(id, novoStatus) {
  try {
    const servico = await chamarApi(CAMINHO_SERVICOS + "/" + id);
    servico.status = novoStatus;
    await chamarApi(CAMINHO_SERVICOS + "/" + id, {
      method: "PUT",
      body: JSON.stringify(servico),
    });
  } catch (e) {
    mostrarErro(e);
  }
}

//FILTRO
document
  .getElementById("card-atrasados")
  .addEventListener("click", function () {
    filtroStatus.value = "Atrasado";
    filtroStatus.dispatchEvent(new Event("change"));
    document
      .querySelector(".tabela-container")
      .scrollIntoView({ behavior: "smooth", block: "start" });
  });

filtroStatus.addEventListener("change", function () {
  const filtro = filtroStatus.value;

  let filtrados;
  if (filtro) {
    filtrados = todosServicos.filter(function (s) {
      return s.status === filtro;
    });
  } else {
    filtrados = todosServicos;
  }

  renderizarServicos(filtrados);
});

//LIMPAR
btnLimpar.addEventListener("click", function () {
  resetarFormServico();
});

// Função para verificar se veio algum status pela URL e aplicar o filtro
function aplicarFiltroUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const statusUrl = urlParams.get("status");

  if (statusUrl) {
    const statusFormatado =
      statusUrl.charAt(0).toUpperCase() + statusUrl.slice(1).toLowerCase();

    filtroStatus.value = statusFormatado;

    filtroStatus.dispatchEvent(new Event("change"));

    const tabelaContainer = document.querySelector(".tabela-container");
    if (tabelaContainer) {
      tabelaContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
}

// INICIAR (Atualizado)
async function inicializarPagina() {
  await carregarClientesSelect();
  await carregarServicos();
  aplicarFiltroUrl();
}

inicializarPagina();
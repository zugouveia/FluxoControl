if (!localStorage.getItem("usuarioId")) {
  window.location.href = "index.html";
}
document.querySelector(".botao-logout").addEventListener("click", function () {
  localStorage.clear();
  window.location.href = "index.html";
});

//DIA/TARDE/NOITE
function definirSaudacao() {
  const hora = new Date().getHours();

  let saudacao;
  if (hora < 12) {
    saudacao = "Bom dia";
  } else if (hora < 18) {
    saudacao = "Boa tarde";
  } else {
    saudacao = "Boa noite";
  }

  const nome = (localStorage.getItem("usuarioNome") || "").trim();
  const primeiroNome = nome ? nome.split(" ")[0] : "";

  if (primeiroNome) {
    saudacao += ", " + primeiroNome;
  }

  document.getElementById("saudacao").textContent = saudacao + "!";

  const agora = new Date();
  const mes = agora.toLocaleString("pt-BR", { month: "long" });
  const ano = agora.getFullYear();

  const mesMaiusculo = mes.charAt(0).toUpperCase() + mes.slice(1);

  document.getElementById("subtitulo-data").textContent =
    "Resumo financeiro — " + mesMaiusculo + "/" + ano;
}

//CARREGAR DADOS
async function carregarDados() {
  try {
    const [servicos, clientes, dadosFinanceiro] = await Promise.all([
      chamarApi("/api/servicos"),
      chamarApi("/api/clientes"),
      chamarApi("/api/financeiro"),
    ]);

    atualizarCards(dadosFinanceiro);
    renderizarGraficoDespesas(dadosFinanceiro.despesas || []);
    renderizarProximosServicos(servicos);
    renderizarServicosRecentes(servicos);
    renderizarAtividade(servicos, clientes, dadosFinanceiro.despesas || []);
  } catch (e) {
    console.error("Erro ao carregar o dashboard:", e);
  }
}

let graficoDespesas = null;

//GRÁFICO — despesas do mês por categoria
function renderizarGraficoDespesas(despesas) {
  const porCategoria = {};
  despesas.forEach(function (d) {
    const cat = d.categoria || "outros";
    porCategoria[cat] = (porCategoria[cat] || 0) + Number(d.valor);
  });

  const categorias = Object.keys(porCategoria);
  const canvas = document.getElementById("grafico-despesas-categoria");
  const semDados = document.getElementById("sem-despesas-cat");

  if (categorias.length === 0) {
    canvas.classList.add("hidden");
    semDados.classList.remove("hidden");
    return;
  }
  canvas.classList.remove("hidden");
  semDados.classList.add("hidden");

  const cores = [
    "#3aa66a",
    "#eda100",
    "#e87ba4",
    "#2a78d6",
    "#9085e9",
    "#e24b4a",
    "#1baf7a",
  ];
  const valores = categorias.map(function (c) {
    return porCategoria[c];
  });
  const rotulos = categorias.map(function (c) {
    return c.charAt(0).toUpperCase() + c.slice(1);
  });

  if (graficoDespesas) {
    graficoDespesas.destroy();
  }
  graficoDespesas = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: rotulos,
      datasets: [
        {
          data: valores,
          backgroundColor: cores,
          borderColor: "#fff",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: { boxWidth: 10, font: { size: 11 } },
        },
      },
    },
  });
}

//PRÓXIMOS SERVIÇOS — a partir de hoje, pela Data Início
function renderizarProximosServicos(servicos) {
  const container = document.getElementById("proximos-servicos");
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const proximos = servicos
    .filter(function (s) {
      return s.dataInicio && new Date(s.dataInicio) >= hoje;
    })
    .sort(function (a, b) {
      return new Date(a.dataInicio) - new Date(b.dataInicio);
    })
    .slice(0, 5);

  if (proximos.length === 0) {
    container.innerHTML =
      '<p class="cell-empty block-pad">Nenhum serviço agendado.</p>';
    return;
  }

  container.innerHTML = proximos
    .map(function (s) {
      const inicio = new Date(s.dataInicio).toLocaleDateString("pt-BR", {
        timeZone: "UTC",
      });
      let periodo = inicio;
      if (s.dataFim && s.dataFim !== s.dataInicio) {
        const fim = new Date(s.dataFim).toLocaleDateString("pt-BR", {
          timeZone: "UTC",
        });
        if (fim !== inicio) periodo = inicio + " a " + fim;
      }
      const nomeCliente = s.cliente && s.cliente.nome ? s.cliente.nome : "-";
      return (
        '<div class="atividade-item">' +
        '<span class="atividade-icone"><i class="fa-solid fa-calendar"></i></span>' +
        "<span>" +
        nomeCliente +
        " — " +
        s.descricao +
        "<br><small class='muted'>" +
        periodo +
        "</small></span>" +
        "</div>"
      );
    })
    .join("");
}

//CARDS — tudo vem já calculado pro mês atual pela API de financeiro
function atualizarCards(dadosFinanceiro) {
  const totalDespesas = dadosFinanceiro.totalDespesas || 0;
  const receita = dadosFinanceiro.receita || 0;
  const lucro = dadosFinanceiro.lucro || 0;
  const pendente = dadosFinanceiro.pendente || 0;
  const servicosDoMes = dadosFinanceiro.servicos || [];

  let margem = 0;
  if (receita > 0) {
    margem = Math.round((lucro / receita) * 100);
  }

  const pendentes = servicosDoMes.filter(function (s) {
    return s.status === "Pendente" || s.status === "Atrasado";
  });

  const idsVistos = [];
  for (let i = 0; i < pendentes.length; i++) {
    const id = pendentes[i].clienteId;
    if (idsVistos.indexOf(id) === -1) {
      idsVistos.push(id);
    }
  }
  const clientesPendentes = idsVistos.length;

  document.getElementById("card-despesas").textContent =
    formatarMoeda(totalDespesas);
  document.getElementById("card-despesas-detalhe").textContent =
    (dadosFinanceiro.despesas ? dadosFinanceiro.despesas.length : 0) +
    " lançamentos";

  document.getElementById("card-lucro").textContent = formatarMoeda(lucro);
  document.getElementById("card-lucro").className =
    "resumo-valor " + (lucro >= 0 ? "valor-positivo" : "valor-negativo");
  document.getElementById("card-lucro-detalhe").textContent =
    "Margem " + margem + "%";

  document.getElementById("card-pendentes").textContent =
    formatarMoeda(pendente);
  document.getElementById("card-pendentes-detalhe").textContent =
    clientesPendentes + " cliente(s) em atraso";
}

//SERVICOS RECENTES
function renderizarServicosRecentes(servicos) {
  const tbody = document.getElementById("tabela-servicos-recentes");
  const recentes = servicos.slice(-5).reverse();

  tbody.innerHTML = "";

  recentes.forEach(function (servico) {
    let statusClass;
    if (servico.status === "Pago") {
      statusClass = "status-pago";
    } else if (servico.status === "Pendente") {
      statusClass = "status-pendente";
    } else {
      statusClass = "status-atrasado";
    }

    let nomeCliente;
    if (servico.cliente && servico.cliente.nome) {
      nomeCliente = servico.cliente.nome;
    } else {
      nomeCliente = "-";
    }

    const valorFormatado = formatarMoeda(servico.valor);

    const linha = document.createElement("tr");

    linha.innerHTML =
      "<td>" +
      nomeCliente +
      "</td>" +
      "<td>" +
      servico.descricao +
      "</td>" +
      "<td>" +
      valorFormatado +
      "</td>" +
      "<td><span class='status-servico " +
      statusClass +
      "'>" +
      servico.status +
      "</span></td>";

    tbody.appendChild(linha);
  });
}

//ATIVIDADE RECENTE
function renderizarAtividade(servicos, clientes, despesas) {
  const container = document.getElementById("atividade-recente");
  const atividades = [];

  const servicosRecentes = servicos.slice(-5).reverse();
  servicosRecentes.forEach(function (s) {
    let icone;
    if (s.status === "Pago") {
      icone = "<i class='fa-solid fa-sack-dollar'></i>";
    } else {
      icone = "<i class='fa-solid fa-clipboard-check'></i>";
    }

    let nomeCliente;
    if (s.cliente && s.cliente.nome) {
      nomeCliente = s.cliente.nome;
    } else {
      nomeCliente = "cliente";
    }

    let texto;
    if (s.status === "Pago") {
      texto =
        "Pagamento recebido de " + nomeCliente + " — " + formatarMoeda(s.valor);
    } else {
      texto = "Novo serviço registrado para " + nomeCliente;
    }

    atividades.push({ icone: icone, texto: texto });
  });

  const clientesRecentes = clientes.slice(-5).reverse();
  clientesRecentes.forEach(function (c) {
    atividades.push({
      icone: "<i class='fa-solid fa-user-plus'></i>",
      texto: "Novo cliente cadastrado: " + c.nome,
    });
  });

  const despesasRecentes = despesas.slice(-3).reverse();
  despesasRecentes.forEach(function (d) {
    atividades.push({
      icone: "<i class='fa-solid fa-angles-down'></i>",
      texto:
        "Nova despesa registrada: " +
        d.descricao +
        " — " +
        formatarMoeda(Number(d.valor)),
    });
  });

  container.innerHTML = "";
  atividades.forEach(function (a) {
    const item = document.createElement("div");
    item.classList.add("atividade-item");
    item.innerHTML =
      "<span class='atividade-icone'>" +
      a.icone +
      "</span>" +
      "<span class='atividade-texto'>" +
      a.texto +
      "</span>";
    container.appendChild(item);
  });
}

//INICIAR
definirSaudacao();
carregarDados();

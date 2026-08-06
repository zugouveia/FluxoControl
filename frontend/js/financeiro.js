if (!localStorage.getItem("usuarioId")) {
  window.location.href = "index.html";
}
document.querySelector(".botao-logout").addEventListener("click", function () {
  localStorage.clear();
  window.location.href = "index.html";
});

(function () {
  const filtroMes = document.getElementById("filtro-mes");
  const erroEl = document.getElementById("erro");
  const btnNovaDespesa = document.getElementById("btn-nova-despesa");
  const painel = document.getElementById("painel-despesa");
  const painelTitulo = document.getElementById("painel-titulo");
  const btnFecharPainel = document.getElementById("btn-fechar-painel");
  const btnCancelarDespesa = document.getElementById("btn-cancelar-despesa");
  const formDespesa = document.getElementById("form-despesa");
  const corpoTabelaServicos = document.querySelector("#tbl-servicos tbody");
  const corpoTabelaDespesas = document.querySelector("#tbl-despesas tbody");
  const selectCategoria = document.getElementById("d-cat");
  const inputNovaCategoria = document.getElementById("d-cat-nova");
  let despesaEditandoId = null;
  document.getElementById("d-data").value = new Date()
    .toISOString()
    .split("T")[0];

  // CATEGORIAS PERSONALIZADAS — guardadas no navegador, alem das padrao
  const CHAVE_CATEGORIAS = "despesaCategoriasCustom";

  function carregarCategoriasSalvas() {
    try {
      const salvas = JSON.parse(localStorage.getItem(CHAVE_CATEGORIAS) || "[]");
      const jaExistentes = Array.from(selectCategoria.options).map(
        function (o) {
          return o.value;
        },
      );
      salvas.forEach(function (cat) {
        if (jaExistentes.indexOf(cat) === -1) {
          const opt = document.createElement("option");
          opt.value = cat;
          opt.textContent = cat;
          selectCategoria.insertBefore(
            opt,
            selectCategoria.querySelector('option[value="__nova__"]'),
          );
        }
      });
    } catch (e) {
      // localStorage indisponivel — segue so com as categorias padrao
    }
  }

  function salvarCategoriaNova(nome) {
    try {
      const salvas = JSON.parse(localStorage.getItem(CHAVE_CATEGORIAS) || "[]");
      if (salvas.indexOf(nome) === -1) {
        salvas.push(nome);
        localStorage.setItem(CHAVE_CATEGORIAS, JSON.stringify(salvas));
      }
    } catch (e) {
      // sem localStorage - a categoria so vale pra essa despesa
    }
  }

  // Garante que uma categoria (ex: vinda de uma despesa já existente, criada em outro navegador) apareça como opção mesmo sem estar salva.
  function garantirOpcaoCategoria(nome) {
    if (!nome) return;
    const jaExiste = Array.from(selectCategoria.options).some(function (o) {
      return o.value.toLowerCase() === nome.toLowerCase();
    });
    if (!jaExiste) {
      const opt = document.createElement("option");
      opt.value = nome;
      opt.textContent = nome;
      selectCategoria.insertBefore(
        opt,
        selectCategoria.querySelector('option[value="__nova__"]'),
      );
    }
  }

  carregarCategoriasSalvas();

  selectCategoria.addEventListener("change", function () {
    if (selectCategoria.value === "__nova__") {
      inputNovaCategoria.classList.remove("hidden");
      inputNovaCategoria.focus();
    } else {
      inputNovaCategoria.classList.add("hidden");
    }
  });

  // MESES DO FILTRO — todos os meses do ano corrente + qualquer mês (passado ou futuro, de qualquer ano) que já tenha serviço cadastrado
  async function gerarOpcoesMes() {
    const anoAtual = new Date().getFullYear();
    const meses = new Set();

    for (let m = 1; m <= 12; m++) {
      meses.add(anoAtual + "-" + String(m).padStart(2, "0"));
    }

    try {
      const servicos = await chamarApi("/api/servicos");
      servicos.forEach(function (s) {
        if (s.dataInicio) meses.add(String(s.dataInicio).slice(0, 7));
        if (s.dataFim) meses.add(String(s.dataFim).slice(0, 7));
      });
    } catch (e) {
      // se a busca falhar, segue so com os meses do ano corrente
    }

    const ordenados = Array.from(meses).sort().reverse();
    filtroMes.innerHTML = "";
    ordenados.forEach(function (v) {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = new Date(v + "-15").toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      });
      filtroMes.appendChild(opt);
    });

    const mesAtual = new Date().toISOString().slice(0, 7);
    if (ordenados.indexOf(mesAtual) !== -1) {
      filtroMes.value = mesAtual;
    }
  }

  function limparErro() {
    erroEl.textContent = "";
    erroEl.classList.add("hidden");
  }

  function mostrarErro(erro) {
    erroEl.textContent = erro.message || "Erro ao carregar.";
    erroEl.classList.remove("hidden");
  }

  function carregarDados() {
    limparErro();
    const partes = filtroMes.value.split("-");
    const ano = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10);

    chamarApi("/api/financeiro?ano=" + ano + "&mes=" + mes)
      .then(function (dados) {
        const servicos = dados.servicos || [];
        const despesas = dados.despesas || [];

        let receita = 0;
        let pendente = 0;
        let pagos = 0;
        let pendentes = 0;
        for (let j = 0; j < servicos.length; j++) {
          const s = servicos[j];
          if ((s.status || "").toLowerCase() == "pago") {
            receita += Number(s.valor);
            pagos++;
          } else {
            pendente += Number(s.valor);
            pendentes++;
          }
        }

        let totalDespesas = 0;
        for (let k = 0; k < despesas.length; k++) {
          totalDespesas += Number(despesas[k].valor);
        }
        const lucro = receita - totalDespesas;
        const margem = receita > 0 ? Math.round((lucro / receita) * 100) : 0;

        document.getElementById("kpi-receita").textContent =
          formatarMoeda(receita);
        document.getElementById("kpi-receita-sub").textContent =
          pagos + " serviços pagos";
        document.getElementById("kpi-despesas").textContent =
          formatarMoeda(totalDespesas);
        document.getElementById("kpi-despesas-sub").textContent =
          despesas.length + " lançamentos";
        document.getElementById("kpi-lucro").textContent = formatarMoeda(lucro);
        document.getElementById("kpi-lucro").className =
          "resumo-valor " + (lucro >= 0 ? "valor-positivo" : "valor-negativo");
        document.getElementById("kpi-lucro-sub").textContent =
          "margem " + margem + "%";
        document.getElementById("kpi-pendente").textContent =
          formatarMoeda(pendente);
        document.getElementById("kpi-pendente-sub").textContent =
          pendentes + " pendentes";

        corpoTabelaServicos.innerHTML = "";
        if (servicos.length === 0) {
          corpoTabelaServicos.innerHTML =
            '<tr><td colspan="5" class="cell-empty">Sem serviços neste período.</td></tr>';
        } else {
          servicos.forEach(function (s) {
            const tr = document.createElement("tr");
            tr.innerHTML =
              '<td class="muted">' +
              ((s.cliente && s.cliente.nome) || "—") +
              "</td><td>" +
              (s.descricao || "") +
              '</td><td class="muted">' +
              (s.evento || "—") +
              '</td><td class="td-right">' +
              formatarMoeda(Number(s.valor)) +
              '</td><td class="td-center">' +
              montarSituacao(s.status) +
              "</td>";
            corpoTabelaServicos.appendChild(tr);
          });
        }

        corpoTabelaDespesas.innerHTML = "";
        if (despesas.length === 0) {
          corpoTabelaDespesas.innerHTML =
            '<tr><td colspan="5" class="cell-empty">Sem despesas neste período.</td></tr>';
        } else {
          despesas.forEach(function (d) {
            garantirOpcaoCategoria(d.categoria);
            const tr = document.createElement("tr");
            tr.innerHTML =
              "<td>" +
              (d.descricao || "") +
              '</td><td class="muted">' +
              formatarData(String(d.data).slice(0, 10)) +
              '</td><td class="muted capitalize">' +
              (d.categoria || "") +
              '</td><td class="td-right valor-negativo">' +
              formatarMoeda(Number(d.valor)) +
              "</td><td>" +
              "<div class='row-actions'>" +
              "<button class='btn-editar-despesa' data-id='" +
              d.id +
              "' title='Editar'><i class='fa-solid fa-pen-to-square'></i></button>" +
              "<button class='btn-deletar-despesa' data-id='" +
              d.id +
              "' title='Deletar'><i class='fa-solid fa-trash-can'></i></button>" +
              "</div></td>";
            corpoTabelaDespesas.appendChild(tr);
          });
          corpoTabelaDespesas
            .querySelectorAll(".btn-deletar-despesa")
            .forEach(function (btn) {
              btn.onclick = function () {
                const id = btn.getAttribute("data-id");
                if (!confirm("Excluir esta despesa?")) return;
                chamarApi("/api/financeiro/despesas/" + id, {
                  method: "DELETE",
                })
                  .then(carregarDados)
                  .catch(mostrarErro);
              };
            });
          corpoTabelaDespesas
            .querySelectorAll(".btn-editar-despesa")
            .forEach(function (btn) {
              btn.onclick = function () {
                const id = btn.getAttribute("data-id");
                const despesa = despesas.filter(function (d) {
                  return String(d.id) === id;
                })[0];
                if (!despesa) return;
                abrirParaEditar(despesa);
              };
            });
        }
      })
      .catch(mostrarErro);
  }

  function fecharPainel() {
    painel.classList.add("hidden");
    despesaEditandoId = null;
    painelTitulo.textContent = "Nova despesa";
    formDespesa.reset();
    document.getElementById("d-data").value = new Date()
      .toISOString()
      .split("T")[0];
    document.getElementById("d-cat").value = "outros";
    inputNovaCategoria.classList.add("hidden");
    inputNovaCategoria.value = "";
  }

  function abrirParaEditar(despesa) {
    despesaEditandoId = despesa.id;
    painelTitulo.textContent = "Editar despesa";
    document.getElementById("d-desc").value = despesa.descricao || "";
    document.getElementById("d-valor").value = despesa.valor;
    document.getElementById("d-data").value = String(despesa.data).slice(0, 10);
    garantirOpcaoCategoria(despesa.categoria);
    document.getElementById("d-cat").value = despesa.categoria || "outros";
    inputNovaCategoria.classList.add("hidden");
    painel.classList.remove("hidden");
    painel.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  filtroMes.onchange = carregarDados;

  btnNovaDespesa.onclick = function () {
    despesaEditandoId = null;
    painelTitulo.textContent = "Nova despesa";
    inputNovaCategoria.classList.add("hidden");
    painel.classList.remove("hidden");
  };
  btnFecharPainel.onclick = fecharPainel;
  btnCancelarDespesa.onclick = fecharPainel;

  formDespesa.onsubmit = function (e) {
    e.preventDefault();
    limparErro();

    let categoria = document.getElementById("d-cat").value;
    if (categoria === "__nova__") {
      categoria = inputNovaCategoria.value.trim();
      if (!categoria) {
        mostrarErro({ message: "Digite o nome da nova categoria." });
        return;
      }
      salvarCategoriaNova(categoria);
      garantirOpcaoCategoria(categoria);
    }

    const dadosDespesa = JSON.stringify({
      descricao: document.getElementById("d-desc").value.trim(),
      valor: parseFloat(document.getElementById("d-valor").value),
      data: document.getElementById("d-data").value,
      categoria: categoria,
    });

    const caminho = despesaEditandoId
      ? "/api/financeiro/despesas/" + despesaEditandoId
      : "/api/financeiro/despesas";
    const metodo = despesaEditandoId ? "PUT" : "POST";

    chamarApi(caminho, { method: metodo, body: dadosDespesa })
      .then(function () {
        fecharPainel();
        carregarDados();
      })
      .catch(mostrarErro);
  };

  gerarOpcoesMes().then(carregarDados);
})();

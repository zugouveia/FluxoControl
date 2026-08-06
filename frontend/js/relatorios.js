if (!localStorage.getItem("usuarioId")) {
  window.location.href = "index.html";
}
document.querySelector(".botao-logout").addEventListener("click", function () {
  localStorage.clear();
  window.location.href = "index.html";
});

;(function () {
  const anoSel = document.getElementById('filtro-ano')
  const mesSel = document.getElementById('filtro-mes')
  const erroEl = document.getElementById('erro')
  const btnBaixarPdf = document.getElementById('btn-baixar-pdf')
  const carregandoEl = document.getElementById('loading-chart')
  const graficoEl = document.getElementById('chart-bars')
  const painelGrafico = document.getElementById('painel-grafico')
  const gridAno = document.getElementById('grid-ano')
  const secaoAno = document.getElementById('secao-ano')
  const secaoCliente = document.getElementById('secao-cliente')
  const painelServicosCliente = document.getElementById('painel-servicos-cliente')
  const corpoTabelaMeses = document.querySelector('#tbl-meses tbody')
  const listaClientesEl = document.getElementById('lista-clientes')
  const corpoTabelaServicosCliente = document.querySelector('#tbl-servicos-cliente tbody')
  const chipCliente = document.getElementById('chip-cliente')
  const chipClienteNome = document.getElementById('chip-cliente-nome')
  const btnLimparCliente = document.getElementById('btn-limpar-cliente')
  const tituloResumoMensal = document.getElementById('titulo-resumo-mensal')

  const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const nomesMesesCompletos = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

  let todosServicos = []
  let despesasPorMes = {}
  let clienteSelecionadoId = null
  let clienteSelecionadoNome = ''

  const y = new Date().getFullYear()
  for (let i = 0; i < 5; i++) {
    const opt = document.createElement('option')
    opt.value = String(y - i)
    opt.textContent = String(y - i)
    anoSel.appendChild(opt)
  }

  function mostrarErro(msg) {
    erroEl.textContent = msg
    erroEl.classList.remove('hidden')
  }

  function limparErro() {
    erroEl.textContent = ''
    erroEl.classList.add('hidden')
  }

  // Busca despesas por mes daquele ano (via /api/relatorios, que ja soma isso no backend — evita recalcular despesa no front)
  async function carregarDespesasDoAno(ano) {
    despesasPorMes = {}
    try {
      const dados = await chamarApi('/api/relatorios?ano=' + ano)
      const meses = dados.meses || []
      meses.forEach(function (mm) {
        const mesNum = parseInt(mm.mes.split('-')[1], 10)
        despesasPorMes[mesNum] = Number(mm.despesas) || 0
      })
    } catch (e) {
      // sem despesas disponíveis, segue com tudo zerado
    }
  }

  function servicosFiltrados(ano, mes) {
    return todosServicos.filter(function (s) {
      if (!s.dataInicio) return false
      const data = new Date(s.dataInicio)
      if (data.getUTCFullYear() !== ano) return false
      if (mes && data.getUTCMonth() + 1 !== mes) return false
      return true
    })
  }

  function renderizar() {
    const ano = parseInt(anoSel.value, 10)
    const mes = mesSel.value ? parseInt(mesSel.value, 10) : null

    if (clienteSelecionadoId) {
      renderizarModoCliente(ano, mes)
    } else if (mes) {
      renderizarModoMes(ano, mes)
    } else {
      renderizarModoAno(ano)
    }
  }

  // MODO 1 — ano inteiro (visao padrao)
  function renderizarModoAno(ano) {
    secaoAno.classList.remove('hidden')
    secaoCliente.classList.add('hidden')
    painelGrafico.classList.remove('hidden')
    gridAno.classList.remove('hidden')
    painelServicosCliente.classList.add('hidden')
    tituloResumoMensal.textContent = 'Resumo mensal'

    const servicosDoAno = servicosFiltrados(ano, null)

    const mesesDados = []
    let totalReceita = 0
    let totalDespesas = 0

    for (let m = 1; m <= 12; m++) {
      const doMes = servicosDoAno.filter(function (s) {
        return new Date(s.dataInicio).getUTCMonth() + 1 === m
      })
      const receita = doMes
        .filter(function (s) { return s.status === 'Pago' })
        .reduce(function (acc, s) { return acc + Number(s.valor) }, 0)
      const despesas = despesasPorMes[m] || 0
      mesesDados.push({ mes: m, receita: receita, despesas: despesas, lucro: receita - despesas })
      totalReceita += receita
      totalDespesas += despesas
    }

    const totalLucro = totalReceita - totalDespesas
    const margem = totalReceita > 0 ? Math.round((totalLucro / totalReceita) * 100) : 0

    document.getElementById('sum-rec').textContent = formatarMoeda(totalReceita)
    document.getElementById('sum-des').textContent = formatarMoeda(totalDespesas)
    document.getElementById('sum-luc').textContent = formatarMoeda(totalLucro)
    document.getElementById('sum-luc').className = 'resumo-valor ' + (totalLucro >= 0 ? 'valor-positivo' : 'valor-negativo')
    document.getElementById('sum-mar').textContent = margem + '%'

    desenharGrafico(mesesDados)
    desenharTabelaMeses(mesesDados, ano)
    desenharTopClientes(servicosDoAno)
  }

  // MODO 2 — ano + mes especifico
  function renderizarModoMes(ano, mes) {
    secaoAno.classList.remove('hidden')
    secaoCliente.classList.add('hidden')
    painelGrafico.classList.add('hidden')
    gridAno.classList.remove('hidden')
    painelServicosCliente.classList.add('hidden')
    tituloResumoMensal.textContent = nomesMesesCompletos[mes - 1] + ' de ' + ano

    const servicosDoMes = servicosFiltrados(ano, mes)
    const receita = servicosDoMes
      .filter(function (s) { return s.status === 'Pago' })
      .reduce(function (acc, s) { return acc + Number(s.valor) }, 0)
    const despesas = despesasPorMes[mes] || 0
    const lucro = receita - despesas
    const margem = receita > 0 ? Math.round((lucro / receita) * 100) : 0

    document.getElementById('sum-rec').textContent = formatarMoeda(receita)
    document.getElementById('sum-des').textContent = formatarMoeda(despesas)
    document.getElementById('sum-luc').textContent = formatarMoeda(lucro)
    document.getElementById('sum-luc').className = 'resumo-valor ' + (lucro >= 0 ? 'valor-positivo' : 'valor-negativo')
    document.getElementById('sum-mar').textContent = margem + '%'

    desenharTabelaMeses([{ mes: mes, receita: receita, despesas: despesas, lucro: lucro }], ano)
    desenharTopClientes(servicosDoMes)
  }

  // MODO 3 — cliente especifico (clicado em Seus Clientes)
  function renderizarModoCliente(ano, mes) {
    secaoAno.classList.add('hidden')
    secaoCliente.classList.remove('hidden')
    painelGrafico.classList.add('hidden')
    gridAno.classList.add('hidden')
    painelServicosCliente.classList.remove('hidden')

    chipCliente.classList.remove('hidden')
    chipClienteNome.textContent = clienteSelecionadoNome
    document.getElementById('titulo-cliente-servicos').textContent = clienteSelecionadoNome

    let servicosDoCliente = servicosFiltrados(ano, mes).filter(function (s) {
      return s.clienteId === clienteSelecionadoId
    })

    const recebido = servicosDoCliente
      .filter(function (s) { return s.status === 'Pago' })
      .reduce(function (acc, s) { return acc + Number(s.valor) }, 0)
    const pendente = servicosDoCliente
      .filter(function (s) { return s.status !== 'Pago' })
      .reduce(function (acc, s) { return acc + Number(s.valor) }, 0)
    const total = servicosDoCliente.length
    const ticketMedio = total > 0 ? (recebido + pendente) / total : 0

    document.getElementById('cli-total-recebido').textContent = formatarMoeda(recebido)
    document.getElementById('cli-total-servicos').textContent = total
    document.getElementById('cli-ticket-medio').textContent = formatarMoeda(ticketMedio)
    document.getElementById('cli-pendente').textContent = formatarMoeda(pendente)

    corpoTabelaServicosCliente.innerHTML = ''
    if (servicosDoCliente.length === 0) {
      corpoTabelaServicosCliente.innerHTML =
        '<tr><td colspan="5" class="cell-empty">Nenhum serviço nesse período.</td></tr>'
      return
    }

    servicosDoCliente
      .slice()
      .sort(function (a, b) { return new Date(b.dataInicio) - new Date(a.dataInicio) })
      .forEach(function (s) {
        const data = new Date(s.dataInicio).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
        const tr = document.createElement('tr')
        tr.innerHTML =
          '<td>' + (s.descricao || '') + '</td>' +
          '<td class="muted">' + (s.evento || '—') + '</td>' +
          '<td class="muted">' + data + '</td>' +
          '<td class="td-right">' + formatarMoeda(Number(s.valor)) + '</td>' +
          '<td class="td-center">' + montarSituacao(s.status) + '</td>'
        corpoTabelaServicosCliente.appendChild(tr)
      })
  }

  function desenharGrafico(mesesDados) {
    let maxValor = 1
    mesesDados.forEach(function (mm) {
      if (mm.receita > maxValor) maxValor = mm.receita
      if (mm.despesas > maxValor) maxValor = mm.despesas
    })

    carregandoEl.classList.add('hidden')
    graficoEl.classList.remove('hidden')
    graficoEl.innerHTML = ''

    mesesDados.forEach(function (mm) {
      const col = document.createElement('div')
      col.className = 'bar-col'

      const pctReceita = maxValor > 0 ? (mm.receita / maxValor) * 100 : 0
      const hReceita = Math.max(pctReceita, mm.receita > 0 ? 4 : 0)
      const labelReceita = mm.receita > 0 ? formatarMoeda(mm.receita) : ''

      const pctDespesa = maxValor > 0 ? (mm.despesas / maxValor) * 100 : 0
      const hDespesa = Math.max(pctDespesa, mm.despesas > 0 ? 4 : 0)
      const labelDespesa = mm.despesas > 0 ? formatarMoeda(mm.despesas) : ''

      col.innerHTML =
        '<span class="bar-tip">' + labelReceita + '</span>' +
        '<div class="bar-track-cima"><div class="bar-fill bar-cima ' +
        (mm.receita > 0 ? 'bar-verde' : '') + '" style="height:' + hReceita + '%"></div></div>' +
        '<div class="bar-zero"></div>' +
        '<div class="bar-track-baixo"><div class="bar-fill bar-baixo ' +
        (mm.despesas > 0 ? 'bar-vermelha' : '') + '" style="height:' + hDespesa + '%"></div></div>' +
        '<span class="bar-tip">' + labelDespesa + '</span>' +
        '<span class="bar-m">' + nomesMeses[mm.mes - 1] + '</span>'
      graficoEl.appendChild(col)
    })
  }

  function desenharTabelaMeses(mesesDados, ano) {
    corpoTabelaMeses.innerHTML = ''
    const comDados = mesesDados.filter(function (mm) { return mm.receita > 0 || mm.despesas > 0 })

    if (comDados.length === 0) {
      corpoTabelaMeses.innerHTML =
        '<tr><td colspan="4" class="cell-empty">Nenhum dado para ' + ano + '.</td></tr>'
      return
    }

    mesesDados.forEach(function (mm) {
      if (mm.receita <= 0 && mm.despesas <= 0) return
      const tr = document.createElement('tr')
      tr.innerHTML =
        '<td class="font-medium">' + nomesMeses[mm.mes - 1] + '</td>' +
        '<td class="td-right valor-positivo">' + formatarMoeda(mm.receita) + '</td>' +
        '<td class="td-right valor-negativo">' + formatarMoeda(mm.despesas) + '</td>' +
        '<td class="td-right font-bold ' + (mm.lucro >= 0 ? 'valor-positivo' : 'valor-negativo') + '">' +
        formatarMoeda(mm.lucro) + '</td>'
      corpoTabelaMeses.appendChild(tr)
    })
  }

  function desenharTopClientes(servicos) {
    const porCliente = {}
    servicos.forEach(function (s) {
      if (!s.cliente) return
      const id = s.clienteId
      if (!porCliente[id]) {
        porCliente[id] = { id: id, nome: s.cliente.nome, total: 0, servicos: 0 }
      }
      porCliente[id].servicos++
      if (s.status === 'Pago') porCliente[id].total += Number(s.valor)
    })

    const lista = Object.values(porCliente)
      .sort(function (a, b) { return b.total - a.total })
      .slice(0, 10)

    listaClientesEl.innerHTML = ''
    if (lista.length === 0) {
      listaClientesEl.innerHTML = '<p class="cell-empty block-pad">Sem dados para este período.</p>'
      return
    }

    lista.forEach(function (c, idx) {
      const div = document.createElement('div')
      div.className = 'cli-row'
      div.innerHTML =
        '<div class="cli-left">' +
        '<span class="cli-num">' + (idx + 1) + '</span>' +
        '<div><p class="cli-nome">' + c.nome + '</p><p class="cli-sub">' +
        c.servicos + ' serviço' + (c.servicos !== 1 ? 's' : '') + '</p></div></div>' +
        '<span class="cli-total">' + formatarMoeda(c.total) + '</span>'
      div.addEventListener('click', function () {
        clienteSelecionadoId = c.id
        clienteSelecionadoNome = c.nome
        renderizar()
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })
      listaClientesEl.appendChild(div)
    })
  }

  btnLimparCliente.addEventListener('click', function () {
    clienteSelecionadoId = null
    clienteSelecionadoNome = ''
    chipCliente.classList.add('hidden')
    renderizar()
  })

  async function carregarDados() {
    limparErro()
    carregandoEl.classList.remove('hidden')
    graficoEl.classList.add('hidden')

    try {
      const ano = parseInt(anoSel.value, 10)
      const [servicos] = await Promise.all([
        chamarApi('/api/servicos'),
        carregarDespesasDoAno(ano),
      ])
      todosServicos = servicos
      renderizar()
    } catch (e) {
      carregandoEl.classList.add('hidden')
      mostrarErro(e.message || 'Erro ao carregar relatórios.')
    }
  }

  anoSel.onchange = carregarDados
  mesSel.onchange = renderizar
  btnBaixarPdf.onclick = function () {
    window.print()
  }

  carregarDados()
})()

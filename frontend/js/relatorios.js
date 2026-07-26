if (!localStorage.getItem("usuarioId")) {
  window.location.href = "index.html";
}
document.querySelector(".botao-logout").addEventListener("click", function () {
  localStorage.clear();
  window.location.href = "index.html";
});

;(function () {
  const anoSel = document.getElementById('filtro-ano')
  const erroEl = document.getElementById('erro')
  const btnBaixarPdf = document.getElementById('btn-baixar-pdf')
  const printPeriodo = document.getElementById('print-periodo')
  const carregandoEl = document.getElementById('loading-chart')
  const graficoEl = document.getElementById('chart-bars')
  const corpoTabelaMeses = document.querySelector('#tbl-meses tbody')
  const listaClientesEl = document.getElementById('lista-clientes')

  const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

  const y = new Date().getFullYear()
  for (let i = 0; i < 3; i++) {
    const opt = document.createElement('option')
    opt.value = String(y - i)
    opt.textContent = String(y - i)
    anoSel.appendChild(opt)
  }

  function carregarDados() {
    erroEl.textContent = ''
    erroEl.classList.add('hidden')
    const ano = parseInt(anoSel.value, 10)
    carregandoEl.classList.remove('hidden')
    graficoEl.classList.add('hidden')
    graficoEl.innerHTML = ''

    chamarApi('/api/relatorios?ano=' + ano)
      .then(function (dados) {
        carregandoEl.classList.add('hidden')
        graficoEl.classList.remove('hidden')
        printPeriodo.textContent = 'Relatório Anual — ' + ano
        const meses = dados.meses || []
        const clientes = dados.clientes || []

        let totalReceita = 0
        let totalDespesas = 0
        for (let i = 0; i < meses.length; i++) {
          totalReceita += Number(meses[i].receita)
          totalDespesas += Number(meses[i].despesas)
        }
        const totalLucro = totalReceita - totalDespesas
        const margem = totalReceita > 0 ? Math.round((totalLucro / totalReceita) * 100) : 0

        document.getElementById('sum-rec').textContent = formatarMoeda(totalReceita)
        document.getElementById('sum-des').textContent = formatarMoeda(totalDespesas)
        document.getElementById('sum-luc').textContent = formatarMoeda(totalLucro)
        document.getElementById('sum-luc').className = 'resumo-valor ' + (totalLucro >= 0 ? 'valor-positivo' : 'valor-negativo')
        document.getElementById('sum-mar').textContent = margem + '%'

        let maxValor = 1
        for (let m = 0; m < meses.length; m++) {
          if (meses[m].receita > maxValor) maxValor = meses[m].receita
          if (meses[m].despesas > maxValor) maxValor = meses[m].despesas
        }

        graficoEl.innerHTML = ''
        meses.forEach(function (mm, idx) {
          const col = document.createElement('div')
          col.className = 'bar-col'

          const pctReceita = maxValor > 0 ? (mm.receita / maxValor) * 100 : 0
          const hReceita = Math.max(pctReceita, mm.receita > 0 ? 4 : 0)
          const labelReceita = mm.receita > 0 ? formatarMoeda(mm.receita) : ''

          const pctDespesa = maxValor > 0 ? (mm.despesas / maxValor) * 100 : 0
          const hDespesa = Math.max(pctDespesa, mm.despesas > 0 ? 4 : 0)
          const labelDespesa = mm.despesas > 0 ? formatarMoeda(mm.despesas) : ''

          col.innerHTML =
            '<span class="bar-tip">' +
            labelReceita +
            '</span>' +
            '<div class="bar-track-cima"><div class="bar-fill bar-cima ' +
            (mm.receita > 0 ? 'bar-verde' : '') +
            '" style="height:' +
            hReceita +
            '%"></div></div>' +
            '<div class="bar-zero"></div>' +
            '<div class="bar-track-baixo"><div class="bar-fill bar-baixo ' +
            (mm.despesas > 0 ? 'bar-vermelha' : '') +
            '" style="height:' +
            hDespesa +
            '%"></div></div>' +
            '<span class="bar-tip">' +
            labelDespesa +
            '</span>' +
            '<span class="bar-m">' +
            nomesMeses[idx] +
            '</span>'
          graficoEl.appendChild(col)
        })

        corpoTabelaMeses.innerHTML = ''
        let temLinha = false
        meses.forEach(function (mm) {
          if (mm.receita <= 0 && mm.despesas <= 0) return
          temLinha = true
          const mesNum = parseInt(mm.mes.split('-')[1], 10) - 1
          const tr = document.createElement('tr')
          tr.innerHTML =
            '<td class="font-medium">' +
            nomesMeses[mesNum] +
            '</td>' +
            '<td class="td-right valor-positivo">' +
            formatarMoeda(mm.receita) +
            '</td>' +
            '<td class="td-right valor-negativo">' +
            formatarMoeda(mm.despesas) +
            '</td>' +
            '<td class="td-right font-bold ' +
            (mm.lucro >= 0 ? 'valor-positivo' : 'valor-negativo') +
            '">' +
            formatarMoeda(mm.lucro) +
            '</td>'
          corpoTabelaMeses.appendChild(tr)
        })
        if (!temLinha) {
          corpoTabelaMeses.innerHTML =
            '<tr><td colspan="4" class="cell-empty">Nenhum dado para ' + ano + '.</td></tr>'
        }

        listaClientesEl.innerHTML = ''
        if (clientes.length === 0) {
          listaClientesEl.innerHTML = '<p class="cell-empty block-pad">Sem dados para este período.</p>'
        } else {
          clientes.forEach(function (c, idx) {
            const div = document.createElement('div')
            div.className = 'cli-row'
            div.innerHTML =
              '<div class="cli-left">' +
              '<span class="cli-num">' +
              (idx + 1) +
              '</span>' +
              '<div><p class="cli-nome">' +
              c.nome +
              '</p><p class="cli-sub">' +
              c.servicos +
              ' serviço' +
              (c.servicos !== 1 ? 's' : '') +
              '</p></div></div>' +
              '<span class="cli-total">' +
              formatarMoeda(c.total) +
              '</span>'
            listaClientesEl.appendChild(div)
          })
        }
      })
      .catch(function (erro) {
        carregandoEl.classList.add('hidden')
        erroEl.textContent = erro.message || 'Erro ao carregar relatórios.'
        erroEl.classList.remove('hidden')
      })
  }

  anoSel.onchange = carregarDados
  btnBaixarPdf.onclick = function () {
    window.print()
  }
  carregarDados()
})()

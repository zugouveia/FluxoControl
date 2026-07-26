if (!localStorage.getItem("usuarioId")) {
  window.location.href = "index.html";
}
document.querySelector(".botao-logout").addEventListener("click", function () {
  localStorage.clear();
  window.location.href = "index.html";
});

;(function () {
  const filtroMes = document.getElementById('filtro-mes')
  const erroEl = document.getElementById('erro')
  const btnNovaDespesa = document.getElementById('btn-nova-despesa')
  const btnBaixarPdf = document.getElementById('btn-baixar-pdf')
  const printPeriodo = document.getElementById('print-periodo')
  const painel = document.getElementById('painel-despesa')
  const painelTitulo = document.getElementById('painel-titulo')
  const btnFecharPainel = document.getElementById('btn-fechar-painel')
  const btnCancelarDespesa = document.getElementById('btn-cancelar-despesa')
  const formDespesa = document.getElementById('form-despesa')
  const corpoTabelaServicos = document.querySelector('#tbl-servicos tbody')
  const corpoTabelaDespesas = document.querySelector('#tbl-despesas tbody')
  let despesaEditandoId = null
  document.getElementById('d-data').value = new Date().toISOString().split('T')[0]

  // últimos 12 meses no select
  for (let i = 0; i < 12; i++) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const v = d.toISOString().slice(0, 7)
    const opt = document.createElement('option')
    opt.value = v
    opt.textContent = new Date(v + '-15').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    filtroMes.appendChild(opt)
  }

  function limparErro() {
    erroEl.textContent = ''
    erroEl.classList.add('hidden')
  }

  function mostrarErro(erro) {
    erroEl.textContent = erro.message || 'Erro ao carregar.'
    erroEl.classList.remove('hidden')
  }

  function carregarDados() {
    limparErro()
    const partes = filtroMes.value.split('-')
    const ano = parseInt(partes[0], 10)
    const mes = parseInt(partes[1], 10)

    chamarApi('/api/financeiro?ano=' + ano + '&mes=' + mes)
      .then(function (dados) {
        printPeriodo.textContent =
          'Financeiro — ' + filtroMes.options[filtroMes.selectedIndex].textContent
        const servicos = dados.servicos || []
        const despesas = dados.despesas || []

        let receita = 0
        let pendente = 0
        let pagos = 0
        let pendentes = 0
        for (let j = 0; j < servicos.length; j++) {
          const s = servicos[j]
          if ((s.status || '').toLowerCase() == 'pago') {
            receita += Number(s.valor)
            pagos++
          } else {
            pendente += Number(s.valor)
            pendentes++
          }
        }

        let totalDespesas = 0
        for (let k = 0; k < despesas.length; k++) {
          totalDespesas += Number(despesas[k].valor)
        }
        const lucro = receita - totalDespesas
        const margem = receita > 0 ? Math.round((lucro / receita) * 100) : 0

        document.getElementById('kpi-receita').textContent = formatarMoeda(receita)
        document.getElementById('kpi-receita-sub').textContent = pagos + ' serviços pagos'
        document.getElementById('kpi-despesas').textContent = formatarMoeda(totalDespesas)
        document.getElementById('kpi-despesas-sub').textContent = despesas.length + ' lançamentos'
        document.getElementById('kpi-lucro').textContent = formatarMoeda(lucro)
        document.getElementById('kpi-lucro').className = 'resumo-valor ' + (lucro >= 0 ? 'valor-positivo' : 'valor-negativo')
        document.getElementById('kpi-lucro-sub').textContent = 'margem ' + margem + '%'
        document.getElementById('kpi-pendente').textContent = formatarMoeda(pendente)
        document.getElementById('kpi-pendente-sub').textContent = pendentes + ' pendentes'

        corpoTabelaServicos.innerHTML = ''
        if (servicos.length === 0) {
          corpoTabelaServicos.innerHTML =
            '<tr><td colspan="5" class="cell-empty">Sem serviços neste período.</td></tr>'
        } else {
          servicos.forEach(function (s) {
            const tr = document.createElement('tr')
            tr.innerHTML =
              '<td class="muted">' +
              ((s.cliente && s.cliente.nome) || '—') +
              '</td><td>' +
              (s.descricao || '') +
              '</td><td class="muted">' +
              (s.evento || '—') +
              '</td><td class="td-right">' +
              formatarMoeda(Number(s.valor)) +
              '</td><td class="td-center">' +
              montarSituacao(s.status) +
              '</td>'
            corpoTabelaServicos.appendChild(tr)
          })
        }

        corpoTabelaDespesas.innerHTML = ''
        if (despesas.length === 0) {
          corpoTabelaDespesas.innerHTML =
            '<tr><td colspan="5" class="cell-empty">Sem despesas neste período.</td></tr>'
        } else {
          despesas.forEach(function (d) {
            const tr = document.createElement('tr')
            tr.innerHTML =
              '<td>' +
              (d.descricao || '') +
              '</td><td class="muted">' +
              formatarData(String(d.data).slice(0, 10)) +
              '</td><td class="muted capitalize">' +
              (d.categoria || '') +
              '</td><td class="td-right valor-negativo">' +
              formatarMoeda(Number(d.valor)) +
              '</td><td>' +
              "<div class='row-actions'>" +
              "<button class='btn-editar-despesa' data-id='" +
              d.id +
              "' title='Editar'><i class='fa-solid fa-pen-to-square'></i></button>" +
              "<button class='btn-deletar-despesa' data-id='" +
              d.id +
              "' title='Deletar'><i class='fa-solid fa-trash-can'></i></button>" +
              '</div></td>'
            corpoTabelaDespesas.appendChild(tr)
          })
          corpoTabelaDespesas.querySelectorAll('.btn-deletar-despesa').forEach(function (btn) {
            btn.onclick = function () {
              const id = btn.getAttribute('data-id')
              if (!confirm('Excluir esta despesa?')) return
              chamarApi('/api/financeiro/despesas/' + id, { method: 'DELETE' }).then(carregarDados).catch(mostrarErro)
            }
          })
          corpoTabelaDespesas.querySelectorAll('.btn-editar-despesa').forEach(function (btn) {
            btn.onclick = function () {
              const id = btn.getAttribute('data-id')
              const despesa = despesas.filter(function (d) { return String(d.id) === id })[0]
              if (!despesa) return
              abrirParaEditar(despesa)
            }
          })
        }
      })
      .catch(mostrarErro)
  }

  function fecharPainel() {
    painel.classList.add('hidden')
    despesaEditandoId = null
    painelTitulo.textContent = 'Nova despesa'
    formDespesa.reset()
    document.getElementById('d-data').value = new Date().toISOString().split('T')[0]
    document.getElementById('d-cat').value = 'outros'
  }

  function abrirParaEditar(despesa) {
    despesaEditandoId = despesa.id
    painelTitulo.textContent = 'Editar despesa'
    document.getElementById('d-desc').value = despesa.descricao || ''
    document.getElementById('d-valor').value = despesa.valor
    document.getElementById('d-data').value = String(despesa.data).slice(0, 10)
    document.getElementById('d-cat').value = despesa.categoria || 'outros'
    painel.classList.remove('hidden')
    painel.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  filtroMes.onchange = carregarDados
  btnBaixarPdf.onclick = function () {
    window.print()
  }

  btnNovaDespesa.onclick = function () {
    despesaEditandoId = null
    painelTitulo.textContent = 'Nova despesa'
    painel.classList.remove('hidden')
  }
  btnFecharPainel.onclick = fecharPainel
  btnCancelarDespesa.onclick = fecharPainel

  formDespesa.onsubmit = function (e) {
    e.preventDefault()
    limparErro()
    const dadosDespesa = JSON.stringify({
      descricao: document.getElementById('d-desc').value.trim(),
      valor: parseFloat(document.getElementById('d-valor').value),
      data: document.getElementById('d-data').value,
      categoria: document.getElementById('d-cat').value,
    })

    const caminho = despesaEditandoId
      ? '/api/financeiro/despesas/' + despesaEditandoId
      : '/api/financeiro/despesas'
    const metodo = despesaEditandoId ? 'PUT' : 'POST'

    chamarApi(caminho, { method: metodo, body: dadosDespesa })
      .then(function () {
        fecharPainel()
        carregarDados()
      })
      .catch(mostrarErro)
  }

  carregarDados()
})()

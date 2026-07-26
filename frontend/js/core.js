/**
 * Endereço único da API (.NET) unificada. Depois de publicar o backend
 * (Railway, Render, etc.), troque só esta linha — todas as páginas usam
 * essa mesma constante.
 */
const apiUrl = "https://fluxocontrol.onrender.com";

var chaveUsuarioId = "usuarioId";

function obterUsuarioId() {
  var id = localStorage.getItem(chaveUsuarioId);
  if (!id || id.trim() === "") return "demo-local";
  return id.trim();
}

function definirUsuarioId(id) {
  localStorage.setItem(chaveUsuarioId, id.trim());
}

function chamarApi(caminho, opcoes) {
  opcoes = opcoes || {};
  var cabecalhos = new Headers(opcoes.headers || {});
  cabecalhos.set("x-usuario-id", obterUsuarioId());
  if (opcoes.body && !cabecalhos.has("Content-Type")) {
    cabecalhos.set("Content-Type", "application/json");
  }

  return fetch(apiUrl + caminho, {
    method: opcoes.method || "GET",
    body: opcoes.body,
    headers: cabecalhos,
    cache: "no-store",
  }).then(function (resposta) {
    if (!resposta.ok) {
      return resposta.text().then(function (texto) {
        throw new Error(texto || "Falha ao comunicar com a API.");
      });
    }
    if (resposta.status === 204) return null;
    return resposta.json();
  });
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor || 0);
}

function formatarData(dataTexto) {
  return new Date(dataTexto + "T00:00:00").toLocaleDateString("pt-BR");
}

function montarSituacao(situacao) {
  var nomes = {
    pago: "Pago",
    pendente: "Pendente",
    atrasado: "Atrasado",
    ativo: "Ativo",
    inadimplente: "Inadimplente",
    novo: "Novo",
    inativo: "Inativo",
  };
  var chave = (situacao || "").toLowerCase();
  var classe = "badge-" + chave;
  var texto = nomes[chave] || situacao || "";
  return '<span class="' + classe + '">' + texto + "</span>";
}

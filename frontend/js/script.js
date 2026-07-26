const API_AUTH = apiUrl + "/api/auth";

const abaEntrar = document.getElementById("aba-entrar");
const abaCadastrar = document.getElementById("aba-cadastrar");
const formLogin = document.getElementById("form-login");
const formCadastro = document.getElementById("form-cadastro");
const mensagemErro = document.getElementById("auth-erro");
const btnEntrar = document.getElementById("btn-entrar");
const btnCadastrar = document.getElementById("btn-cadastrar");
const linkParaCadastro = document.getElementById("link-para-cadastro");
const linkParaLogin = document.getElementById("link-para-login");

const formRecuperar = document.getElementById("form-recuperar");
const linkRecuperar = document.getElementById("link-recuperar");
const linkVoltarLogin = document.getElementById("link-voltar-login");
const btnRecuperar = document.getElementById("btn-recuperar");

// SE JA ESTIVER LOGADO, VAI PARA O DASHBOARD
if (localStorage.getItem("usuarioId")) {
  window.location.href = "dashboard.html";
}

// TROCAR ABAS
function mostrarLogin() {
  formLogin.classList.remove("hidden");
  formCadastro.classList.add("hidden");
  formRecuperar.classList.add("hidden");
  abaEntrar.classList.add("ativa");
  abaCadastrar.classList.remove("ativa");
  mensagemErro.textContent = "";
}

function mostrarCadastro() {
  formLogin.classList.add("hidden");
  formCadastro.classList.remove("hidden");
  formRecuperar.classList.add("hidden");
  abaEntrar.classList.remove("ativa");
  abaCadastrar.classList.add("ativa");
  mensagemErro.textContent = "";
}

abaEntrar.addEventListener("click", mostrarLogin);
abaCadastrar.addEventListener("click", mostrarCadastro);
linkParaCadastro.addEventListener("click", function (e) {
  e.preventDefault();
  mostrarCadastro();
});
linkParaLogin.addEventListener("click", function (e) {
  e.preventDefault();
  mostrarLogin();
});

// MOSTRAR ERRO
function mostrarErro(mensagem) {
  mensagemErro.textContent = mensagem;
}

// LOGIN
btnEntrar.addEventListener("click", async function () {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-senha").value;

  if (!email || !password) {
    mostrarErro("Preencha o e-mail e a senha.");
    return;
  }

  btnEntrar.disabled = true;
  btnEntrar.textContent = "Entrando...";

  try {
    const resposta = await fetch(API_AUTH + "/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "", email: email, password: password }),
    });

    if (resposta.ok) {
      const dados = await resposta.json();
      const usuario = dados.user;

      localStorage.setItem("usuarioId", usuario.id);
      localStorage.setItem("usuarioNome", usuario.name);
      localStorage.setItem("usuarioEmail", usuario.email);

      window.location.href = "dashboard.html";
    } else {
      mostrarErro("E-mail ou senha inválidos.");
      btnEntrar.disabled = false;
      btnEntrar.textContent = "Entrar na conta";
    }
  } catch (error) {
    mostrarErro("Erro ao conectar. Tente novamente.");
    btnEntrar.disabled = false;
    btnEntrar.textContent = "Entrar na conta";
  }
});

// CADASTRO
btnCadastrar.addEventListener("click", async function () {
  const name = document.getElementById("cadastro-nome").value;
  const email = document.getElementById("cadastro-email").value;
  const password = document.getElementById("cadastro-senha").value;

  if (!name || !email || !password) {
    mostrarErro("Preencha todos os campos.");
    return;
  }

  if (password.length < 6) {
    mostrarErro("A senha deve ter pelo menos 6 caracteres.");
    return;
  }

  btnCadastrar.disabled = true;
  btnCadastrar.textContent = "Criando conta...";

  try {
    const resposta = await fetch(API_AUTH + "/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name, email: email, password: password }),
    });

    if (resposta.ok) {
      mostrarErro("");
      mostrarLogin();
      mensagemErro.style.color = "green";
      mensagemErro.textContent = "Conta criada! Faça login para continuar.";
    } else {
      const texto = await resposta.text();
      mostrarErro(texto || "Erro ao criar conta. Tente novamente.");
      btnCadastrar.disabled = false;
      btnCadastrar.textContent = "Criar conta";
    }
  } catch (error) {
    mostrarErro("Erro ao conectar. Tente novamente.");
    btnCadastrar.disabled = false;
    btnCadastrar.textContent = "Criar conta";
  }
});

//Recuperar senha
function mostrarRecuperar() {
  formLogin.classList.add("hidden");
  formCadastro.classList.add("hidden");
  formRecuperar.classList.remove("hidden");
  abaEntrar.classList.remove("ativa");
  abaCadastrar.classList.remove("ativa");
  mensagemErro.textContent = "";
}

linkRecuperar.addEventListener("click", function (e) {
  e.preventDefault();
  mostrarRecuperar();
});

linkVoltarLogin.addEventListener("click", function (e) {
  e.preventDefault();
  mostrarLogin();
});

btnRecuperar.addEventListener("click", async function () {
  const email = document.getElementById("recuperar-email").value;
  const novaSenha = document.getElementById("recuperar-senha").value;

  if (!email || !novaSenha) {
    mostrarErro("Preencha o e-mail e a nova senha.");
    return;
  }

  if (novaSenha.length < 6) {
    mostrarErro("A senha deve ter pelo menos 6 caracteres.");
    return;
  }

  btnRecuperar.disabled = true;
  btnRecuperar.textContent = "Redefinindo...";

  try {
    const resposta = await fetch(API_AUTH + "/recuperar-senha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, novaSenha: novaSenha }),
    });

    if (resposta.ok) {
      mensagemErro.style.color = "green";
      mensagemErro.textContent = "Senha redefinida! Faça login.";
      mostrarLogin();
    } else {
      const texto = await resposta.text();
      mostrarErro(texto || "E-mail não encontrado.");
    }
  } catch (error) {
    mostrarErro("Erro ao conectar. Tente novamente.");
  }

  btnRecuperar.disabled = false;
  btnRecuperar.textContent = "Redefinir senha";
});

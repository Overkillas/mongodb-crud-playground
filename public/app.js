// Frontend vanilla JS. Conversa com a API e, a cada operação, atualiza o
// PAINEL DE SINTAXE (objetivo didático: ver o comando MongoDB x SQL).

let collectionAtual = null;

const $ = (id) => document.getElementById(id);

// --- Toast de feedback (erros/sucessos ficam VISÍVEIS) ----------------------
let toastTimer;
function toast(msg, tipo = "ok") {
  const t = $("toast");
  t.textContent = msg;
  t.className = `toast show ${tipo}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = "toast"), 3500);
}

// Envolve handlers async: qualquer erro vira um toast em vez de falhar calado.
function safe(fn) {
  return async (...args) => {
    try {
      await fn(...args);
    } catch (e) {
      toast(e.message || "Erro inesperado", "erro");
      console.error(e);
    }
  };
}

async function api(metodo, url, body) {
  const opt = { method: metodo, headers: { "Content-Type": "application/json" } };
  if (body !== undefined) opt.body = JSON.stringify(body);
  const r = await fetch(url, opt);
  const data = await r.json();
  if (!r.ok) throw new Error(data.erro || "Erro na requisição");
  return data;
}

// Atualiza o painel de sintaxe com o objeto {mongo, sql, nota} da API.
function mostrarSintaxe(label, syntax) {
  $("sxLabel").textContent = label;
  $("sxLabel").style.fontStyle = "normal";
  $("sxMongo").textContent = syntax?.mongo || "...";
  $("sxSql").textContent = syntax?.sql || "...";
  $("sxNota").textContent = syntax?.nota || "";
}

// --- Status da conexão ------------------------------------------------------
async function checarStatus() {
  try {
    const s = await api("GET", "/api/status");
    if (s.conectado) {
      $("status").textContent = `● conectado (db: ${s.db})`;
      $("status").classList.add("ok");
    }
  } catch {
    $("status").textContent = "● sem conexão";
  }
}

// --- Seeds (presets) --------------------------------------------------------
async function carregarSeeds() {
  const { presets } = await api("GET", "/api/seeds");
  const cont = $("seedButtons");
  cont.innerHTML = "";
  presets.forEach((p) => {
    const b = document.createElement("button");
    b.className = "ghost";
    b.textContent = `Carregar: ${p.rotulo}`;
    b.onclick = safe(() => seed(p.chave));
    cont.appendChild(b);
  });
}

async function seed(chave) {
  const r = await api("POST", `/api/seed/${chave}`);
  mostrarSintaxe(`Seed carregado: ${r.inseridos} documentos em "${r.collection}"`, r.syntax);
  toast(`Carregados ${r.inseridos} documentos em "${r.collection}"`);
  await selecionarCollection(r.collection);
  // pré-preenche a agregação de exemplo do preset
  if (r.agregacao) {
    $("pipeline").value = JSON.stringify(r.agregacao.pipeline, null, 2);
  }
}

// --- Collections ------------------------------------------------------------
async function listarCollections() {
  const r = await api("GET", "/api/collections");
  mostrarSintaxe("Listar collections", r.syntax);
  const ul = $("listaCollections");
  ul.innerHTML = "";
  if (r.collections.length === 0) {
    ul.innerHTML = '<li class="vazio">nenhuma collection ainda</li>';
    return;
  }
  r.collections.forEach((c) => {
    const li = document.createElement("li");
    if (c.nome === collectionAtual) li.classList.add("ativa");
    li.innerHTML = `<span class="nome-col">${c.nome}</span>
      <span style="display:flex;gap:8px;align-items:center">
        <span class="badge">${c.total}</span>
        <button class="danger small" title="dropar">✕</button>
      </span>`;
    // clique em qualquer parte do item (menos o botão ✕) seleciona a collection
    li.onclick = safe((e) => {
      if (e.target.tagName === "BUTTON") return;
      return selecionarCollection(c.nome);
    });
    li.querySelector("button").onclick = safe((e) => {
      e.stopPropagation();
      return dropCollection(c.nome);
    });
    ul.appendChild(li);
  });
}

async function criarCollection() {
  const nome = $("novaCollection").value.trim();
  if (!nome) return toast("Informe o nome da collection.", "erro");
  const r = await api("POST", "/api/collections", { nome });
  mostrarSintaxe(`Collection "${nome}" criada`, r.syntax);
  toast(`Collection "${nome}" criada`);
  $("novaCollection").value = "";
  await listarCollections();
}

async function dropCollection(nome) {
  if (!confirm(`Dropar a collection "${nome}"? Isso apaga todos os documentos.`)) return;
  const r = await api("DELETE", `/api/collections/${nome}`);
  mostrarSintaxe(`Collection "${nome}" removida`, r.syntax);
  toast(`Collection "${nome}" removida`);
  if (collectionAtual === nome) {
    collectionAtual = null;
    $("tituloCollection").textContent = "Selecione uma collection";
    $("documentos").innerHTML = "";
  }
  await listarCollections();
}

// --- Documentos -------------------------------------------------------------
async function selecionarCollection(nome) {
  collectionAtual = nome;
  $("tituloCollection").textContent = `Collection: ${nome}`;
  $("filtro").value = ""; // limpa filtro ao trocar: evita travar a navegação
  await listarDocumentos();
  await listarCollections(); // re-render para marcar a ativa
}

async function listarDocumentos() {
  if (!collectionAtual) {
    return toast("Selecione uma collection primeiro (lista à esquerda).", "erro");
  }
  let url = `/api/collections/${collectionAtual}/documents`;
  const filtroTxt = $("filtro").value.trim();
  // Valida o filtro no CLIENTE: se for inválido, avisa e NÃO quebra a navegação.
  if (filtroTxt) {
    try {
      JSON.parse(filtroTxt);
    } catch {
      return toast('Filtro inválido. Use JSON, ex: {"autor":"ana"}', "erro");
    }
    url += `?filter=${encodeURIComponent(filtroTxt)}`;
  }
  const r = await api("GET", url);
  mostrarSintaxe(`Buscar documentos em "${collectionAtual}"`, r.syntax);

  const cont = $("documentos");
  cont.innerHTML = "";
  if (r.documentos.length === 0) {
    cont.innerHTML = '<div class="vazio">nenhum documento</div>';
    return;
  }
  r.documentos.forEach((doc) => {
    const id = doc._id;
    const div = document.createElement("div");
    div.className = "doc";
    div.innerHTML = `<pre>${JSON.stringify(doc, null, 2)}</pre>
      <div class="doc-acoes">
        <button class="ghost small">✏️ Editar ($set)</button>
        <button class="danger small">🗑️ Excluir</button>
      </div>`;
    const [btnEdit, btnDel] = div.querySelectorAll("button");
    btnEdit.onclick = safe(() => editarDocumento(id, doc));
    btnDel.onclick = safe(() => excluirDocumento(id));
    cont.appendChild(div);
  });
}

async function inserirDocumento() {
  if (!collectionAtual) return toast("Selecione/crie uma collection primeiro.", "erro");
  let doc;
  try {
    doc = JSON.parse($("novoDoc").value);
  } catch {
    return toast("JSON inválido no campo de inserção.", "erro");
  }
  const r = await api("POST", `/api/collections/${collectionAtual}/documents`, doc);
  mostrarSintaxe(`Documento inserido em "${collectionAtual}"`, r.syntax);
  toast("Documento inserido");
  $("novoDoc").value = "";
  await listarDocumentos();
}

async function editarDocumento(id, doc) {
  const copia = { ...doc };
  delete copia._id;
  const novo = prompt(
    "Edite o documento (JSON). Só os campos alterados serão aplicados via $set:",
    JSON.stringify(copia, null, 2)
  );
  if (!novo) return;
  let changes;
  try {
    changes = JSON.parse(novo);
  } catch {
    return toast("JSON inválido.", "erro");
  }
  const r = await api("PUT", `/api/collections/${collectionAtual}/documents/${id}`, changes);
  mostrarSintaxe(`Documento ${id} atualizado`, r.syntax);
  toast("Documento atualizado");
  await listarDocumentos();
}

async function excluirDocumento(id) {
  if (!confirm("Excluir este documento?")) return;
  const r = await api("DELETE", `/api/collections/${collectionAtual}/documents/${id}`);
  mostrarSintaxe(`Documento ${id} removido`, r.syntax);
  toast("Documento removido");
  await listarDocumentos();
}

// --- Agregação --------------------------------------------------------------
async function rodarAgregacao() {
  if (!collectionAtual) return toast("Selecione uma collection primeiro.", "erro");
  let pipeline;
  try {
    pipeline = JSON.parse($("pipeline").value);
  } catch {
    return toast("Pipeline JSON inválido.", "erro");
  }
  const r = await api("POST", `/api/collections/${collectionAtual}/aggregate`, { pipeline });
  mostrarSintaxe(`Agregação em "${collectionAtual}"`, r.syntax);
  $("resultadoAgg").innerHTML = `<pre>${JSON.stringify(r.resultado, null, 2)}</pre>`;
}

// Rola até a seção de inserir e destaca rapidamente.
function irParaInserir() {
  const card = $("cardInserir");
  card.scrollIntoView({ behavior: "smooth", block: "center" });
  card.classList.add("cardInserir-destaque");
  setTimeout(() => card.classList.remove("cardInserir-destaque"), 1500);
  $("novoDoc").focus();
}

// --- Liga os botões ---------------------------------------------------------
$("btnCriarCollection").onclick = safe(criarCollection);
$("btnFiltrar").onclick = safe(listarDocumentos);
$("btnLimparFiltro").onclick = safe(() => {
  $("filtro").value = "";
  return listarDocumentos();
});
$("btnInserir").onclick = safe(inserirDocumento);
$("btnAgregar").onclick = safe(rodarAgregacao);
$("btnIrInserir").onclick = irParaInserir;

// --- Inicialização ----------------------------------------------------------
safe(async function init() {
  await checarStatus();
  await carregarSeeds();
  await listarCollections();
})();

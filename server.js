// ---------------------------------------------------------------------------
// POC didática de MongoDB
// Backend Express + driver oficial 'mongodb'.
// O DIFERENCIAL: cada resposta da API devolve, junto com o resultado, a
// SINTAXE equivalente da operação no shell do MongoDB E no SQL relacional,
// para a interface exibir lado a lado (objetivo didático do trabalho).
// ---------------------------------------------------------------------------
const express = require("express");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");
const { seeds } = require("./seeds");

const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL || "mongodb://root:example@localhost:27017";
const DB_NAME = process.env.DB_NAME || "pocdb";

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let db; // referência ao banco, preenchida na conexão

// --- Conexão com retry (o container do Mongo pode demorar a subir) ----------
async function connectWithRetry(retries = 15) {
  for (let i = 1; i <= retries; i++) {
    try {
      const client = new MongoClient(MONGO_URL);
      await client.connect();
      db = client.db(DB_NAME);
      await db.command({ ping: 1 });
      console.log(`✅ Conectado ao MongoDB (db: ${DB_NAME})`);
      return;
    } catch (e) {
      console.log(`… tentativa ${i}/${retries} falhou (${e.message}). Retry em 2s`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error("Não foi possível conectar ao MongoDB.");
}

// --- Helpers de geração de sintaxe (o coração didático) ---------------------
const j = (o) => JSON.stringify(o, null, 2);

// Renderiza um valor para o "equivalente SQL" (aproximado, fins didáticos).
function sqlVal(v) {
  if (typeof v === "string") return `'${v}'`;
  if (Array.isArray(v) || (v && typeof v === "object")) return "/*estrutura aninhada*/";
  return String(v);
}

// Detecta se um documento tem arrays/objetos aninhados (algo que o SQL puro
// não armazena numa coluna, precisaria de tabelas extras e JOINs).
function temAninhados(doc) {
  return Object.values(doc).some(
    (v) => Array.isArray(v) || (v && typeof v === "object")
  );
}

function sxCriarCollection(col) {
  return {
    mongo: `db.createCollection("${col}")`,
    sql: `CREATE TABLE ${col} ( ... );  -- no SQL você define TODAS as colunas e tipos AGORA`,
    nota: "No MongoDB a collection nasce sem schema fixo: cada documento pode ter campos diferentes.",
  };
}

function sxDropCollection(col) {
  return {
    mongo: `db.${col}.drop()`,
    sql: `DROP TABLE ${col};`,
    nota: "Remove a collection inteira e todos os seus documentos.",
  };
}

function sxListar() {
  return {
    mongo: "db.getCollectionNames()",
    sql: "SHOW TABLES;",
    nota: "Lista as collections existentes no banco atual.",
  };
}

function sxFind(col, filtro) {
  const temFiltro = filtro && Object.keys(filtro).length > 0;
  const where = temFiltro
    ? "\nWHERE " +
      Object.entries(filtro)
        .map(([k, v]) => `${k} = ${sqlVal(v)}`)
        .join(" AND ")
    : "";
  return {
    mongo: temFiltro ? `db.${col}.find(${j(filtro)})` : `db.${col}.find({})`,
    sql: `SELECT * FROM ${col}${where};`,
    nota: "find({}) sem filtro retorna todos os documentos (como SELECT *).",
  };
}

function sxInsert(col, doc) {
  const cols = Object.keys(doc);
  return {
    mongo: `db.${col}.insertOne(${j(doc)})`,
    sql: `INSERT INTO ${col} (${cols.join(", ")})\nVALUES (${cols
      .map((k) => sqlVal(doc[k]))
      .join(", ")});`,
    nota: temAninhados(doc)
      ? "Este documento tem arrays/objetos aninhados: guardados direto no documento. No SQL isso exigiria tabelas extras + JOINs."
      : "O _id é gerado automaticamente pelo MongoDB (ObjectId) se você não informar.",
  };
}

function sxUpdate(col, id, changes) {
  const set = Object.entries(changes)
    .map(([k, v]) => `${k} = ${sqlVal(v)}`)
    .join(", ");
  return {
    mongo: `db.${col}.updateOne(\n  { _id: ObjectId("${id}") },\n  { $set: ${j(changes)} }\n)`,
    sql: `UPDATE ${col} SET ${set}\nWHERE _id = '${id}';`,
    nota: "O operador $set altera apenas os campos informados, sem apagar o resto do documento.",
  };
}

function sxDelete(col, id) {
  return {
    mongo: `db.${col}.deleteOne({ _id: ObjectId("${id}") })`,
    sql: `DELETE FROM ${col} WHERE _id = '${id}';`,
    nota: "deleteOne remove o primeiro documento que casar com o filtro.",
  };
}

function sxAggregate(col, pipeline) {
  return {
    mongo: `db.${col}.aggregate(${j(pipeline)})`,
    sql: "SELECT ... GROUP BY ...;  -- pipelines de agregação são o equivalente (poderoso) ao GROUP BY",
    nota: "O aggregation pipeline processa os documentos em estágios sequenciais ($match, $group, $sort, etc).",
  };
}

// --- Wrapper para tratar erros de forma limpa -------------------------------
const wrap = (fn) => async (req, res) => {
  try {
    if (!db) return res.status(503).json({ erro: "Banco ainda conectando, tente em instantes." });
    await fn(req, res);
  } catch (e) {
    res.status(400).json({ erro: e.message });
  }
};

// Converte string em ObjectId quando possível (ids do Mongo).
function toId(id) {
  return ObjectId.isValid(id) ? new ObjectId(id) : id;
}

// ============================ ROTAS DA API =================================

app.get("/api/status", (req, res) => {
  res.json({ conectado: !!db, db: DB_NAME });
});

// Listar collections (com contagem de documentos)
app.get(
  "/api/collections",
  wrap(async (req, res) => {
    const cols = await db.listCollections().toArray();
    const lista = [];
    for (const c of cols) {
      const count = await db.collection(c.name).countDocuments();
      lista.push({ nome: c.name, total: count });
    }
    res.json({ collections: lista, syntax: sxListar() });
  })
);

// Criar collection
app.post(
  "/api/collections",
  wrap(async (req, res) => {
    const { nome } = req.body;
    if (!nome) throw new Error("Informe o nome da collection.");
    await db.createCollection(nome);
    res.json({ ok: true, syntax: sxCriarCollection(nome) });
  })
);

// Dropar collection
app.delete(
  "/api/collections/:nome",
  wrap(async (req, res) => {
    const { nome } = req.params;
    await db.collection(nome).drop();
    res.json({ ok: true, syntax: sxDropCollection(nome) });
  })
);

// Listar documentos (com filtro opcional via query ?filter=<json>)
app.get(
  "/api/collections/:nome/documents",
  wrap(async (req, res) => {
    const { nome } = req.params;
    let filtro = {};
    if (req.query.filter) filtro = JSON.parse(req.query.filter);
    const docs = await db.collection(nome).find(filtro).limit(50).toArray();
    res.json({ documentos: docs, syntax: sxFind(nome, filtro) });
  })
);

// Inserir documento (CREATE)
app.post(
  "/api/collections/:nome/documents",
  wrap(async (req, res) => {
    const { nome } = req.params;
    const doc = req.body;
    // Gera a sintaxe ANTES de inserir: o driver adiciona _id ao objeto após
    // o insertOne, o que poluiria o comando exibido.
    const syntax = sxInsert(nome, doc);
    const r = await db.collection(nome).insertOne(doc);
    res.json({ ok: true, insertedId: r.insertedId, syntax });
  })
);

// Atualizar documento (UPDATE)
app.put(
  "/api/collections/:nome/documents/:id",
  wrap(async (req, res) => {
    const { nome, id } = req.params;
    const changes = req.body;
    delete changes._id; // _id é imutável
    const r = await db
      .collection(nome)
      .updateOne({ _id: toId(id) }, { $set: changes });
    res.json({ ok: true, modificados: r.modifiedCount, syntax: sxUpdate(nome, id, changes) });
  })
);

// Excluir documento (DELETE)
app.delete(
  "/api/collections/:nome/documents/:id",
  wrap(async (req, res) => {
    const { nome, id } = req.params;
    const r = await db.collection(nome).deleteOne({ _id: toId(id) });
    res.json({ ok: true, removidos: r.deletedCount, syntax: sxDelete(nome, id) });
  })
);

// Rodar agregação (pipeline JSON no body)
app.post(
  "/api/collections/:nome/aggregate",
  wrap(async (req, res) => {
    const { nome } = req.params;
    const pipeline = req.body.pipeline || [];
    const r = await db.collection(nome).aggregate(pipeline).toArray();
    res.json({ resultado: r, syntax: sxAggregate(nome, pipeline) });
  })
);

// Carregar dados de exemplo (preset: social | chat | recomendacao)
app.post(
  "/api/seed/:preset",
  wrap(async (req, res) => {
    const preset = seeds[req.params.preset];
    if (!preset) throw new Error("Preset inválido. Use: social, chat ou recomendacao.");
    // recria a collection do zero para a demo ficar previsível
    await db.collection(preset.collection).drop().catch(() => {});
    await db.collection(preset.collection).insertMany(preset.documentos);
    res.json({
      ok: true,
      collection: preset.collection,
      inseridos: preset.documentos.length,
      agregacao: preset.agregacao,
      syntax: {
        mongo: `db.${preset.collection}.insertMany([ ...${preset.documentos.length} documentos... ])`,
        sql: `-- equivalente a vários INSERTs; repare que documentos têm campos diferentes entre si`,
        nota: "Repare nos campos que existem em uns documentos e não em outros: isso é o schema flexível.",
      },
    });
  })
);

// Lista os presets disponíveis (para a interface montar os botões)
app.get("/api/seeds", (req, res) => {
  const lista = Object.entries(seeds).map(([chave, v]) => ({
    chave,
    rotulo: v.rotulo,
    collection: v.collection,
  }));
  res.json({ presets: lista });
});

// --- Sobe o servidor depois de conectar no banco ---------------------------
connectWithRetry()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`🚀 App em http://localhost:${PORT}`)
    );
  })
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });

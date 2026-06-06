# 🧪 Queries interessantes para a apresentação

Coleção de consultas prontas para copiar e colar na interface durante a demo.
Elas usam os dados dos **presets** (botões "Carregar:" na barra lateral).

**Onde colar cada coisa:**
- 🔍 **Filtro** → caixa **Buscar (find)**
- ➕ **Documento** → caixa **Inserir documento (JSON)**
- 📊 **Pipeline** → caixa **Agregação**

> Dica: a cada query, o **painel de sintaxe** (direita) mostra o comando MongoDB e o SQL equivalente; use isso para explicar.

---

## 📖 O que cada `$` significa (tabela de referência)

No MongoDB, palavras começando com `$` são **operadores** (comandos especiais).
Existem dois grupos:

**Operadores de consulta** (usados no filtro/find):

| Operador | Significado | Em SQL é como... |
|---|---|---|
| `$exists` | o campo **existe** (ou não) no documento | (não existe equivalente; colunas são fixas) |
| `$gt` | **g**reater **t**han → **maior que** | `>` |
| `$gte` | **g**reater **t**han or **e**qual → **maior ou igual** | `>=` |
| `$lt` | **l**ess **t**han → **menor que** | `<` |
| `$lte` | **l**ess **t**han or **e**qual → **menor ou igual** | `<=` |
| `$ne` | **n**ot **e**qual → **diferente de** | `!=` / `<>` |
| `$eq` | **eq**ual → **igual a** | `=` |
| `$in` | o valor **está em** uma lista | `IN (...)` |
| `$nin` | **n**ot **in** → **não está** na lista | `NOT IN (...)` |
| `$regex` | casa com uma **expressão regular** (padrão de texto) | `LIKE` |
| `$options` | opções do `$regex` (ex.: `"i"` = ignora maiúsc./minúsc.) | (nenhum) |
| `$all` | o array contém **todos** os valores informados | (nenhum) |
| `$size` | o array tem **exatamente** N elementos | (nenhum) |
| `$or` | lógico **OU** (basta uma condição ser verdadeira) | `OR` |
| `$and` | lógico **E** (todas as condições verdadeiras) | `AND` |

**Operadores de agregação/atualização** (usados em pipeline/update):

| Operador | Significado | Em SQL é como... |
|---|---|---|
| `$match` | **filtra** documentos no pipeline | `WHERE` |
| `$group` | **agrupa** documentos por um campo | `GROUP BY` |
| `$sum` | **soma** valores (ou conta, com `$sum: 1`) | `SUM()` / `COUNT()` |
| `$avg` | calcula a **média** | `AVG()` |
| `$sort` | **ordena** o resultado (`1` cresc., `-1` decresc.) | `ORDER BY` |
| `$unwind` | **desmembra** um array: 1 documento vira N (um por item) | (nenhum) |
| `$set` | **define/altera** campos no update (sem apagar o resto) | `SET` |
| `$inc` | **incrementa** um número (soma ao valor atual) | `SET x = x + n` |
| `$push` | **adiciona** um item a um array | (nenhum) |

> ⚠️ Atenção a um detalhe: dentro de uma **agregação**, um `$` na frente de um **nome de
> campo** (ex.: `"$tags"`, `"$autor"`) significa **"o valor desse campo"**. Já um `$` na
> frente de uma **palavra-comando** (ex.: `$group`, `$sum`) é um **operador**.

---

## ⭐ Roteiro sugerido (os "momentos uau")

1. Carregar preset **Rede Social** → mostra `insertMany` + documentos.
2. 🔍 `{}` → traz todos (igual a `SELECT *`).
3. 🔍 `{"localizacao": {"$exists": true}}` → **só os documentos que TÊM aquele campo** = prova do *schema flexível*.
4. ➕ inserir um documento com um **campo novo** que ninguém tem → reforça o schema flexível.
5. 🔍 `{"comentarios.de": "bruno"}` → busca dentro de documento **aninhado** (sem JOIN!).
6. 📊 ranking de hashtags → poder de **analytics** (aggregation).

---

## 1) Básico: buscar por valor

```json
{"autor": "ana"}
```
Todos os posts da ana. Equivale a `SELECT * FROM posts WHERE autor = 'ana'`.

```json
{}
```
Todos os documentos (sem filtro).

---

## 2) ⭐ Existência de campo: `$exists` (o destaque do schema flexível)

> **`$exists`** = "este campo **existe** no documento?". `true` = tem o campo; `false` = não tem.

Documentos que **possuem** o campo `localizacao`:
```json
{"localizacao": {"$exists": true}}
```

Documentos que **NÃO possuem** o campo `tags`:
```json
{"tags": {"$exists": false}}
```

> Por que é especial: numa tabela SQL **todas as linhas têm as mesmas colunas**, então essa
> pergunta nem faz sentido. No MongoDB cada documento pode ter campos diferentes.

---

## 3) Comparação: `$gt`, `$gte`, `$lt`, `$lte`, `$ne`

> **`$gt`** = maior que · **`$gte`** = maior ou igual · **`$lt`** = menor que · **`$lte`** = menor ou igual · **`$ne`** = diferente de.

Posts com **mais de 5 curtidas** (`$gt` = maior que):
```json
{"curtidas": {"$gt": 5}}
```

Posts com curtidas **entre 5 e 20** (`$gte` maior-ou-igual + `$lte` menor-ou-igual):
```json
{"curtidas": {"$gte": 5, "$lte": 20}}
```

Autores **diferentes** de "ana" (`$ne` = not equal):
```json
{"autor": {"$ne": "ana"}}
```

---

## 4) Listas de valores: `$in` e `$nin`

> **`$in`** = o valor está **dentro** da lista · **`$nin`** = o valor **não** está na lista.

Posts cujo autor está **na lista** (`$in`):
```json
{"autor": {"$in": ["ana", "carla"]}}
```

Autores que **não estão** na lista (`$nin` = not in):
```json
{"autor": {"$nin": ["bruno"]}}
```

---

## 5) Texto / busca parcial: `$regex`

> **`$regex`** = busca por **padrão de texto** (como o `LIKE` do SQL). **`$options: "i"`** = ignora maiúsculas/minúsculas.

Posts cujo texto contém "MongoDB" (ignorando maiúsculas/minúsculas):
```json
{"texto": {"$regex": "mongodb", "$options": "i"}}
```

Autores que começam com a letra "a" (o `^` significa "início do texto"):
```json
{"autor": {"$regex": "^a"}}
```

---

## 6) Documentos aninhados: notação de ponto (sem JOIN!)

> Aqui **não há operador `$`**: o ponto (`.`) "entra" dentro de objetos/arrays aninhados.

Posts que têm um comentário **feito pelo bruno** (campo dentro de um array de objetos):
```json
{"comentarios.de": "bruno"}
```

Posts com localização na cidade do Recife (objeto aninhado):
```json
{"localizacao.cidade": "Recife"}
```

> No SQL relacional isso exigiria uma tabela `comentarios` separada e um `JOIN`.

---

## 7) Arrays: `$size`, `$all`, elemento dentro do array

> **`$all`** = o array contém **todos** os valores listados · **`$size`** = o array tem **exatamente** N itens.

Posts com a tag "nosql" (basta o valor estar **dentro** do array, sem operador):
```json
{"tags": "nosql"}
```

Posts que tenham **todas** estas tags (`$all`):
```json
{"tags": {"$all": ["nosql", "estudos"]}}
```

Posts com **exatamente 1** tag (`$size` = tamanho do array):
```json
{"tags": {"$size": 1}}
```

---

## 8) Lógicos: `$or` e `$and`

> **`$or`** = basta **uma** condição ser verdadeira · **`$and`** = **todas** precisam ser verdadeiras.

Posts da ana **OU** com mais de 10 curtidas (`$or`):
```json
{"$or": [{"autor": "ana"}, {"curtidas": {"$gt": 10}}]}
```

Posts da ana **E** que tenham tags (`$and`):
```json
{"$and": [{"autor": "ana"}, {"tags": {"$exists": true}}]}
```

---

## 9) ➕ Inserções para mostrar o schema flexível

> Aqui não há operador: é só o documento JSON que você quer inserir.

Documento "normal":
```json
{"autor": "dudu", "texto": "meu primeiro post!", "tags": ["intro"], "curtidas": 0}
```

Documento com **campos totalmente novos** (que nenhum outro tem):
```json
{"autor": "eva", "texto": "post com enquete", "enquete": {"pergunta": "SQL ou NoSQL?", "opcoes": ["SQL", "NoSQL"]}, "fixado": true}
```

> Insira esse segundo e depois rode 🔍 `{"enquete": {"$exists": true}}` para achá-lo.

---

## 10) 📊 Agregações (analytics, equivalente ao GROUP BY)

> Lembre: **`$group`** agrupa, **`$sum`** soma/conta, **`$avg`** faz média, **`$sort`** ordena,
> **`$unwind`** desmembra arrays, **`$match`** filtra. E `"$tags"`/`"$autor"` = **o valor do campo**.

**Hashtags mais usadas** (preset Rede Social):
```json
[
  {"$unwind": "$tags"},
  {"$group": {"_id": "$tags", "total": {"$sum": 1}}},
  {"$sort": {"total": -1}}
]
```
- `$unwind: "$tags"` → cada item do array `tags` vira um documento separado.
- `$group` → junta por valor da tag (`_id: "$tags"`) e conta com `$sum: 1`.
- `$sort: {total: -1}` → ordena do maior para o menor (`-1` = decrescente).

**Total de curtidas por autor** (`$sum` somando o valor do campo `curtidas`):
```json
[
  {"$group": {"_id": "$autor", "totalCurtidas": {"$sum": "$curtidas"}}},
  {"$sort": {"totalCurtidas": -1}}
]
```

**Quantos posts cada autor tem** (`$sum: 1` conta 1 por documento):
```json
[
  {"$group": {"_id": "$autor", "qtdPosts": {"$sum": 1}}},
  {"$sort": {"qtdPosts": -1}}
]
```

---

## 11) ✏️ Updates além do `$set`: `$inc` e `$push`

> Estes valem para mostrar que atualizar vai além de trocar um valor.
> (No app o botão "Editar" usa `$set`; os de baixo são para citar/explicar no slide ou rodar no shell.)

> **`$set`** = define/altera campos · **`$inc`** = incrementa um número · **`$push`** = adiciona item a um array.

Incrementar as curtidas de um post em +1 (`$inc`):
```js
db.posts.updateOne({ autor: "ana" }, { $inc: { curtidas: 1 } })
```

Adicionar um comentário ao array (`$push`):
```js
db.posts.updateOne(
  { autor: "ana" },
  { $push: { comentarios: { de: "dudu", texto: "muito bom!" } } }
)
```

---

## Bônus: queries para os outros presets

### 💬 Chat (preset "Chat", collection `mensagens`)

Mensagens **não lidas**:
```json
{"lida": false}
```

Mensagens entre ana e bruno (nos dois sentidos, com `$or`):
```json
{"$or": [{"de": "ana", "para": "bruno"}, {"de": "bruno", "para": "ana"}]}
```

Mensagens que **têm anexo** (`$exists` = o campo existe):
```json
{"anexos": {"$exists": true}}
```

📊 Não lidas por destinatário (`$match` filtra, `$group`+`$sum` contam):
```json
[
  {"$match": {"lida": false}},
  {"$group": {"_id": "$para", "naoLidas": {"$sum": 1}}},
  {"$sort": {"naoLidas": -1}}
]
```

### 🎬 Recomendação (preset "Recomendação", collection `filmes`)

Filmes com nota média acima de 8.6 (`$gt` = maior que):
```json
{"notaMedia": {"$gt": 8.6}}
```

Filmes do gênero "ficção" (valor dentro do array, sem operador):
```json
{"generos": "ficção"}
```

Filmes que **ganharam prêmios** (`$exists`):
```json
{"premios": {"$exists": true}}
```

Filmes avaliados por "carla" (campo dentro de array de objetos, com notação de ponto):
```json
{"avaliacoes.usuario": "carla"}
```

📊 Nota média por gênero (`$unwind` desmembra, `$avg` faz a média):
```json
[
  {"$unwind": "$generos"},
  {"$group": {"_id": "$generos", "notaMediaDoGenero": {"$avg": "$notaMedia"}}},
  {"$sort": {"notaMediaDoGenero": -1}}
]
```

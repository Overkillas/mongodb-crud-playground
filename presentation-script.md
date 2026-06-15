# Roteiro de Apresentacao

Preset a usar: Rede Social (clicar no botao "Carregar: Rede Social" na barra lateral antes de comecar)

---

## 1. Busca simples

Filtro:
```json
{}
```
O que falar: "Isso e o equivalente ao SELECT * do SQL. Sem filtro, traz todos os documentos."

---

## 2. Busca por valor exato

Filtro:
```json
{"autor": "ana"}
```
O que falar: "Aqui filtramos por um campo especifico. Equivale a WHERE autor = 'ana' no SQL."

---

## 3. Schema flexivel com $exists (ponto alto)

Filtro:
```json
{"localizacao": {"$exists": true}}
```
O que falar: "Este e o diferencial do MongoDB. O operador $exists retorna so os documentos que TEM esse campo. No SQL isso nao faz sentido porque todas as linhas tem as mesmas colunas. Aqui cada documento pode ter campos diferentes."

Depois mostrar o oposto:
```json
{"tags": {"$exists": false}}
```
O que falar: "E podemos tambem buscar quem NAO tem o campo."

---

## 4. Inserir documento com campo novo (reforco do schema flexivel)

Documento:
```json
{"autor": "eva", "texto": "post com enquete", "enquete": {"pergunta": "SQL ou NoSQL?", "opcoes": ["SQL", "NoSQL"]}, "fixado": true}
```
O que falar: "Vou inserir um documento com campos que nenhum outro tem: enquete e fixado. No SQL eu precisaria alterar a tabela antes. Aqui so insiro."

Depois buscar:
```json
{"enquete": {"$exists": true}}
```
O que falar: "E consigo achar so esse documento pelo campo que eu acabei de criar."

---

## 5. Documento aninhado sem JOIN

Filtro:
```json
{"comentarios.de": "bruno"}
```
O que falar: "Aqui uso notacao de ponto para entrar dentro de um array de objetos. No SQL eu precisaria de uma tabela comentarios separada e um JOIN. Aqui e uma so consulta."

---

## 6. Comparacao numerica

Filtro:
```json
{"curtidas": {"$gt": 5}}
```
O que falar: "$gt significa 'greater than', maior que. Equivale ao > do SQL."

Filtro com intervalo:
```json
{"curtidas": {"$gte": 5, "$lte": 20}}
```
O que falar: "Posso combinar operadores no mesmo campo para definir um intervalo. $gte e maior ou igual, $lte e menor ou igual."

---

## 7. Arrays

Filtro por valor dentro do array:
```json
{"tags": "nosql"}
```
O que falar: "Para buscar um valor dentro de um array, basta colocar o valor diretamente. O MongoDB verifica se 'nosql' esta em alguma posicao do array tags."

Filtro com $all:
```json
{"tags": {"$all": ["nosql", "estudos"]}}
```
O que falar: "$all exige que o array contenha TODOS os valores listados."

---

## 8. Logicos: $or e $and

Filtro com $or:
```json
{"$or": [{"autor": "ana"}, {"curtidas": {"$gt": 10}}]}
```
O que falar: "$or funciona igual ao OR do SQL. Basta uma das condicoes ser verdadeira."

---

## 9. Agregacao: analytics (ponto alto)

Pipeline - hashtags mais usadas:
```json
[
  {"$unwind": "$tags"},
  {"$group": {"_id": "$tags", "total": {"$sum": 1}}},
  {"$sort": {"total": -1}}
]
```
O que falar: "Aqui entra o poder de analytics do MongoDB. O pipeline funciona em etapas: primeiro o $unwind desmembra o array de tags, cada item vira um documento separado. Depois o $group agrupa por tag e conta com $sum. Por fim o $sort ordena do maior para o menor. O equivalente no SQL seria um GROUP BY com JOIN em outra tabela."

---

## Resumo do que o painel de sintaxe mostra

A cada consulta, o painel da direita mostra o comando MongoDB e o equivalente SQL. Use isso para reforcar as comparacoes durante a apresentacao.

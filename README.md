# POC MongoDB: CRUD Didático

Interface web que demonstra, de forma visual e didática, as principais
características do **MongoDB**. A cada operação realizada na tela (criar,
buscar, atualizar, excluir), a aplicação exibe ao lado a **sintaxe equivalente**
no shell do MongoDB e em SQL, ajudando quem já conhece bancos relacionais a
entender o paradigma de documentos.

## O que é

Uma aplicação simples (Node.js + Express + MongoDB) com uma página única onde é
possível:

- Criar e remover **collections**.
- Fazer o **CRUD** completo de documentos: inserir, buscar (com filtros),
  atualizar e excluir.
- Buscar documentos por valor, por existência de campo (`$exists`), por
  comparação, dentro de arrays e em campos aninhados.
- Rodar **agregações** (analytics, equivalente ao `GROUP BY`).
- Ver, a cada ação, o **comando MongoDB** e o **SQL equivalente** num painel
  lateral, com uma nota explicando a diferença.
- Carregar **dados de exemplo** (presets) de três sistemas: rede social, chat e
  recomendação.

O arquivo [`tests.md`](tests.md) traz uma coleção de consultas prontas para
copiar e colar durante a demonstração, com a explicação de cada operador.

## Por que existe

Este projeto é a **aplicação prática de um trabalho da faculdade** sobre Bancos
de Dados NoSQL. O grupo recebeu o paradigma *document store* e o SGBD
**MongoDB** para pesquisar e apresentar. Além dos slides teóricos
(características, vantagens, desvantagens e casos de uso), o trabalho exige uma
demonstração de CRUD ao vivo no banco.

Em vez de fazer o CRUD apenas pelo terminal, a equipe optou por construir esta
interface para deixar a apresentação mais visual e, principalmente, mais
didática: mostrar lado a lado o comando MongoDB e o SQL equivalente deixa claro,
para uma turma acostumada com bancos relacionais, o que muda no modelo de
documentos.

A aplicação é **genérica de propósito**: como o MongoDB não exige um schema fixo,
a mesma ferramenta serve para qualquer collection, e os presets permitem
demonstrar diferentes sistemas sem alterar o código.

## Pré-requisitos

- Docker Desktop (para subir o MongoDB)
- Node.js 18 ou superior

## Como rodar

```powershell
# 1) Sobe o MongoDB (e o mongo-express opcional) via Docker
docker compose up -d

# 2) Instala as dependências do app
npm install

# 3) Sobe a aplicação
npm start
```

Abra **http://localhost:3000**.

> Bônus: **http://localhost:8081** é o mongo-express (GUI oficial), útil para
> comparar com o app que construímos durante a apresentação.

Credenciais do banco (genéricas, só para a POC): usuário `root`, senha `example`.

## Roteiro sugerido para a apresentação (cerca de 4 minutos)

1. **Carregar um preset** (ex.: "Rede Social"), que mostra o `insertMany` e os documentos.
2. **Ler (find)**: clicar na collection e depois filtrar com `{"autor":"ana"}`, que mostra o `find` e o `SELECT`.
3. **Inserir (Create)**: colar um documento com um campo novo que os outros não têm, reforçando o *schema flexível*.
4. **Atualizar (Update)**: editar um documento, que mostra o `updateOne` com `$set`.
5. **Excluir (Delete)**: remover um documento, que mostra o `deleteOne`.
6. **Agregação**: rodar o pipeline já preenchido (ex.: hashtags mais usadas), mostrando o poder de analytics do Mongo.

> Dica de segurança para a demo ao vivo: **grave um vídeo** rodando esse roteiro
> como backup, caso a internet ou o projetor falhem na sala.

## Estrutura do projeto

- `docker-compose.yml`: MongoDB + mongo-express
- `server.js`: API Express + gerador de sintaxe (MongoDB e SQL)
- `seeds.js`: dados de exemplo dos 3 sistemas (social, chat, recomendação)
- `public/`: interface (HTML, CSS e JS vanilla)
- `tests.md`: queries prontas para a apresentação, com explicação dos operadores

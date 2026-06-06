// Presets de dados de exemplo para os 3 sistemas do item 6 do trabalho.
// Cada preset usa documentos com campos PROPOSITALMENTE diferentes entre si,
// para demonstrar ao vivo o "schema flexível" do MongoDB (algo impossível
// numa tabela relacional, onde todas as linhas têm as mesmas colunas).

const seeds = {
  // -------------------------------------------------------------------------
  // REDE SOCIAL (mini Twitter): melhor encaixe para o modelo de documentos:
  // comentários EMBUTIDOS (embedded) no post, arrays de tags/likes.
  // -------------------------------------------------------------------------
  social: {
    collection: "posts",
    rotulo: "Rede Social (posts)",
    documentos: [
      {
        autor: "ana",
        texto: "Comecei a estudar MongoDB hoje! #nosql #estudos",
        tags: ["nosql", "estudos"],
        curtidas: 12,
        comentarios: [
          { de: "bruno", texto: "Boa! recomendo a doc oficial", curtidas: 2 },
          { de: "carla", texto: "vamos estudar juntos?" }
        ],
        criadoEm: "2026-06-01T10:00:00Z"
      },
      {
        autor: "bruno",
        texto: "Documento aninhado é vida 🚀",
        tags: ["mongodb"],
        curtidas: 5,
        comentarios: [],
        // campo EXTRA que o post da ana não tem -> schema flexível
        localizacao: { cidade: "Recife", pais: "BR" },
        criadoEm: "2026-06-02T14:30:00Z"
      },
      {
        autor: "carla",
        texto: "Alguém vai no evento de dados?",
        // este post NÃO tem 'tags' nem 'curtidas' -> também é válido!
        comentarios: [{ de: "ana", texto: "eu vou!" }],
        criadoEm: "2026-06-03T09:15:00Z"
      }
    ],
    // Exemplo de agregação: ranking de hashtags mais usadas
    agregacao: {
      descricao: "Hashtags mais usadas (desmembra o array 'tags' e conta)",
      pipeline: [
        { $unwind: "$tags" },
        { $group: { _id: "$tags", total: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ]
    }
  },

  // -------------------------------------------------------------------------
  // CHAT EM TEMPO REAL: mensagens como documentos.
  // -------------------------------------------------------------------------
  chat: {
    collection: "mensagens",
    rotulo: "Chat (mensagens)",
    documentos: [
      {
        de: "ana",
        para: "bruno",
        texto: "oi, tudo bem?",
        lida: true,
        enviadaEm: "2026-06-05T08:00:00Z"
      },
      {
        de: "bruno",
        para: "ana",
        texto: "tudo! e vc?",
        lida: false,
        enviadaEm: "2026-06-05T08:01:10Z"
      },
      {
        de: "ana",
        para: "bruno",
        texto: "olha esse arquivo",
        lida: false,
        // campo EXTRA: anexos só existe nesta mensagem -> schema flexível
        anexos: [{ tipo: "imagem", url: "foto.png", tamanhoKb: 240 }],
        enviadaEm: "2026-06-05T08:02:00Z"
      }
    ],
    agregacao: {
      descricao: "Quantidade de mensagens não lidas por destinatário",
      pipeline: [
        { $match: { lida: false } },
        { $group: { _id: "$para", naoLidas: { $sum: 1 } } },
        { $sort: { naoLidas: -1 } }
      ]
    }
  },

  // -------------------------------------------------------------------------
  // SISTEMA DE RECOMENDAÇÃO: filmes com avaliações embutidas.
  // -------------------------------------------------------------------------
  recomendacao: {
    collection: "filmes",
    rotulo: "Recomendação (filmes)",
    documentos: [
      {
        titulo: "A Origem",
        generos: ["ficção", "ação"],
        notaMedia: 8.8,
        avaliacoes: [
          { usuario: "ana", nota: 9 },
          { usuario: "bruno", nota: 8 }
        ]
      },
      {
        titulo: "Interestelar",
        generos: ["ficção", "drama"],
        notaMedia: 8.6,
        avaliacoes: [{ usuario: "carla", nota: 10 }],
        // campo EXTRA -> schema flexível
        premios: ["Oscar - Efeitos Visuais"]
      },
      {
        titulo: "Comédia Qualquer",
        generos: ["comédia"],
        // sem notaMedia nem avaliacoes ainda -> documento válido
        anoLancamento: 2026
      }
    ],
    agregacao: {
      descricao: "Nota média por gênero (desmembra 'generos' e calcula média)",
      pipeline: [
        { $unwind: "$generos" },
        { $group: { _id: "$generos", notaMediaDoGenero: { $avg: "$notaMedia" } } },
        { $sort: { notaMediaDoGenero: -1 } }
      ]
    }
  }
};

module.exports = { seeds };

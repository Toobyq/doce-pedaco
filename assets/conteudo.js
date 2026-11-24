/* ============================================================
   Doce Pedaço — conteúdo pronto
   Mensagens de WhatsApp, plano de Instagram, rotina e dicas.
   Tudo aqui é texto: dá para editar à vontade.
   ============================================================ */
window.DP_CONTEUDO = {

  /* ---------- Mensagens de WhatsApp para clientes ----------
     {nome} {numero} {itens} {quando} {total} {saldo} {pix} {insta} {selos} {meta} {endereco} */
  mensagens: {
    confirmacao:
`Oi, {nome}! 💗 Aqui é da Doce Pedaço.
Seu pedido #{numero} está anotadinho:

{itens}

📅 {quando}
💰 Total: {total}
{linhaPagamento}
Qualquer dúvida é só chamar. Obrigada pelo carinho! 🍫`,

    pronto:
`Oi, {nome}! Seu pedido #{numero} ficou prontinho e está lindo 😍
{linhaEntrega}{linhaSaldo}
Bom apetite! 💗`,

    saiu:
`Oi, {nome}! Seu pedido #{numero} acabou de sair para entrega 🛵💨
Daqui a pouquinho chega aí!`,

    cobranca:
`Oi, {nome}! Tudo bem? 💗
Passando para lembrar do saldo de {saldo} do pedido #{numero}.
{linhaPix}
Muito obrigada!`,

    posvenda:
`Oi, {nome}! O que achou dos docinhos? 🥰
Seu feedback me ajuda muito! Se puder, manda uma fotinho ou marca a @{insta} nos stories 📸
Ah, você já tem {selos} de {meta} selinhos no cartão fidelidade 💗`,

    aniversario:
`Feliz aniversário, {nome}! 🎂💗
A Doce Pedaço te deseja um ano cheio de momentos doces.
De presente: 10% de desconto em qualquer pedido até o fim do mês. É só me chamar! 🍫`,

    reativacao:
`Oi, {nome}! Tá com saudade de um docinho? 🍫
Essa semana tem fornada fresquinha de brownies e cookies.
Quer que eu separe um pedacinho para você? 💗`,

    brinde:
`{nome}, você completou o cartão fidelidade da Doce Pedaço! 🎉💗
Seu próximo docinho é por nossa conta. Me avisa quando quiser usar!`,

    livre:
`Oi, {nome}! Aqui é da Doce Pedaço 💗`
  },

  /* ---------- Mensagens prontas para salvar no WhatsApp ---------- */
  respostasRapidas: [
    { titulo: "Boas-vindas (primeira mensagem)", atalho: "/oi",
      texto: "Oiii! Que bom te ver por aqui 💗\nAqui é a Doce Pedaço: brownies, cookies e bolos feitos com carinho.\n\n🧁 Funciona assim: toda TERÇA eu abro os pedidos da fornada da semana, e as entregas são a partir de QUINTA.\n👉 {link}" },
    { titulo: "Cardápio da semana", atalho: "/cardapio",
      texto: "O cardápio dessa fornada está aqui 💗\n{link}\n\nÉ só escolher, colocar seu nome e enviar. Depois eu te chamo pra combinar tudinho!" },
    { titulo: "Como funciona a fornada", atalho: "/fornada",
      texto: "Funciona assim ♡\n🗓️ Terça: pedidos abertos o dia todo (o cardápio muda toda semana!)\n👩‍🍳 Quarta: mãos na massa\n🛵 Quinta em diante: entrega ou retirada, você escolhe\nAs vagas são limitadas, então corre na terça! {link}" },
    { titulo: "Pedidos fechados", atalho: "/fechado",
      texto: "Ai, os pedidos dessa semana já fecharam 🥹\nMas terça que vem tem fornada nova! Quer que eu te avise quando abrir? 💗" },
    { titulo: "Ausência (fora do horário)", atalho: "/ausente",
      texto: "Oi! Agora estou na cozinha ou descansando 🍫\nJá já te respondo! Enquanto isso, dá uma espiadinha na fornada: {link}" },
    { titulo: "Pagamento", atalho: "/pagamento",
      texto: "Aceito Pix, dinheiro e cartão 💗\nPra garantir sua vaga na fornada, peço {sinal}% de sinal pelo Pix, e o restante na entrega." },
    { titulo: "Combinar retirada", atalho: "/retirada",
      texto: "Seu pedido já está na fornada! 💗\nOnde fica melhor pra você retirar? Posso te encontrar em ______ entre ______." }
  ],

  /* ---------- Artes prontas com as fotos dela (assets/artes) ---------- */
  artesProntas: [
    { nome: "Bolo formigueiro", arq: "bolo-formigueiro" },
    { nome: "Cookie cake", arq: "cookie-cake" },
    { nome: "Brownie", arq: "brownie" }
  ],

  /* ---------- Instagram ---------- */
  bios: [
    "🧁 uma fornada por semana, feita com carinho\n🗓️ pedidos toda terça · entregas a partir de quinta\n🍫 brownies · cookies · bolos\n👇 cardápio da semana",
    "doce pedaço ♡\nbrownie molhadinho, cookie que escorre e bolo de abraçar\n💌 pedidos só às terças (vagas limitadas!)\n👇",
    "Confeitaria artesanal 💗\n🗓️ Terça: pedidos · Quinta+: entregas\n🛵 Entrega ou retirada\n✨ No 10º pedido, o docinho é presente!"
  ],

  destaques: [
    { nome: "Cardápio", emoji: "🍰" },
    { nome: "Pedidos", emoji: "🛍️" },
    { nome: "Brownies", emoji: "🍫" },
    { nome: "Cookies", emoji: "🍪" },
    { nome: "Bolos", emoji: "🎂" },
    { nome: "Clientes", emoji: "💗" },
    { nome: "Bastidores", emoji: "👩‍🍳" },
    { nome: "Entregas", emoji: "🛵" }
  ],

  hashtags: "#docepedaco #brownie #cookies #bolocaseiro #confeitaria #docesartesanais #encomendas #feitocomcarinho #brownierecheado #cookierecheado",

  // 4 semanas que se repetem. O app mostra a semana atual.
  calendario: [
    { tema: "Apresentação: quem faz a Doce Pedaço", posts: [
      { dia: "Seg", tipo: "Reels", titulo: "Mãos na massa",
        como: "Grave 5 a 8 cenas curtas (2 s cada): ovos, chocolate derretendo, massa na forma, corte. Termine mostrando a etiqueta.",
        legenda: "Prazer, Doce Pedaço 💗\nTudo aqui é feito por mim, em pequenas fornadas, com ingrediente de verdade e muito carinho.\nQual você quer provar primeiro: brownie, cookie ou bolo? 👇\n\n{hashtags}" },
      { dia: "Qua", tipo: "Carrossel", titulo: "Cardápio completo",
        como: "Use a arte do cardápio que o app gera (aba Divulgação) como primeira imagem + fotos dos produtos.",
        legenda: "Nosso cardápio 🍫🍪🎂\nArrasta para o lado e escolhe o seu!\nPedidos toda terça pelo link da bio 💌\n\n{hashtags}" },
      { dia: "Sex", tipo: "Stories", titulo: "Enquete + pedidos do fim de semana",
        como: "Story 1: enquete \"Brownie ou cookie?\". Story 2: \"Últimas vagas para sábado\" com o link de pedidos.",
        legenda: "" },
      { dia: "Sáb", tipo: "Reels", titulo: "O corte do brownie",
        como: "Câmera bem perto, faca cortando o brownie devagar. Som natural da casquinha crocante (ASMR).",
        legenda: "Esse barulhinho da casquinha 🤤🍫\nMarca quem te deve um brownie!\n\n{hashtags}" }
    ]},
    { tema: "Desejo: dar água na boca", posts: [
      { dia: "Seg", tipo: "Foto", titulo: "Cookie escorrendo",
        como: "Luz da janela, fundo claro. Parta o cookie recheado ao meio e fotografe o recheio escorrendo.",
        legenda: "Segunda-feira pede um cookie recheado 🍪💗\nVocê come de uma vez ou guarda metade? (mentira, ninguém guarda)\n\n{hashtags}" },
      { dia: "Qua", tipo: "Reels", titulo: "Montando uma caixa",
        como: "Vista de cima: caixa vazia → colocando um a um → fechando com a etiqueta. Acelere o vídeo.",
        legenda: "Monta comigo uma caixa de 6 📦💗\nPerfeita para presentear (ou para não dividir).\nEncomende pelo link da bio!\n\n{hashtags}" },
      { dia: "Sex", tipo: "Stories", titulo: "Bastidores da produção",
        como: "3 a 5 stories mostrando a produção do dia. Termine com \"pedidos da semana que vem já abertos\" + link.",
        legenda: "" },
      { dia: "Sáb", tipo: "Post", titulo: "Depoimento de cliente",
        como: "Print de um elogio no WhatsApp (peça autorização e esconda o número) com a foto do pedido.",
        legenda: "Mensagens assim fazem meu dia 🥹💗\nObrigada por confiar na Doce Pedaço!\n\n{hashtags}" }
    ]},
    { tema: "Confiança: mostrar como funciona", posts: [
      { dia: "Seg", tipo: "Carrossel", titulo: "Como pedir em 3 passos",
        como: "Slide 1: \"Como fazer seu pedido\". 2: escolha no link da bio. 3: envie no WhatsApp. 4: confirmo e é só aproveitar.",
        legenda: "Pedir é facinho 💌\n1. Escolha no link da bio\n2. Envie pelo WhatsApp\n3. Eu confirmo e preparo com carinho\nPedidos toda terça, entregas a partir de quinta!\n\n{hashtags}" },
      { dia: "Qua", tipo: "Reels", titulo: "Embalando um pedido",
        como: "Mostre a embalagem caprichada e a etiqueta sendo colada com a data de validade escrita à mão.",
        legenda: "Cada pedido sai daqui embalado com o mesmo cuidado que foi feito 💗\n\n{hashtags}" },
      { dia: "Sex", tipo: "Stories", titulo: "Caixinha de perguntas",
        como: "\"Pergunte à confeiteira\". Responda ao longo do fim de semana: sabores, validade, como conservar.",
        legenda: "" },
      { dia: "Sáb", tipo: "Post", titulo: "Sorteio",
        como: "Prêmio: caixa com 6 brownies. Regras: seguir o perfil, curtir e marcar 2 amigos. Resultado em 7 dias.",
        legenda: "🎁 SORTEIO 🎁\nVamos sortear uma caixa com 6 brownies!\nPara participar:\n1. Siga a @{insta}\n2. Curta este post\n3. Marque 2 amigos (cada comentário = 1 chance)\nResultado no sábado que vem 💗\n\n{hashtags}" }
    ]},
    { tema: "Ocasiões: aniversários e presentes", posts: [
      { dia: "Seg", tipo: "Post", titulo: "Bolo de aniversário",
        como: "Foto do bolo inteiro com uma vela. No texto, reforce a antecedência para encomendas.",
        legenda: "Aniversário chegando? 🎂\nPede na terça e ele chega quentinho na semana 💗\n\n{hashtags}" },
      { dia: "Qua", tipo: "Reels", titulo: "Um dia de produção em 15 s",
        como: "Do primeiro ovo até a entrega: um trechinho de cada etapa. Música animada.",
        legenda: "Um dia na Doce Pedaço em 15 segundos 🍫⏱️\n\n{hashtags}" },
      { dia: "Sex", tipo: "Stories", titulo: "Resultado do sorteio",
        como: "Mostre o sorteio sendo feito (site de sorteio ou papeizinhos). Marque a ganhadora e agradeça.",
        legenda: "" },
      { dia: "Sáb", tipo: "Carrossel", titulo: "Kit presente",
        como: "Monte o Kit Doce Pedaço com laço. Fotos: fechado, aberto, detalhe da etiqueta.",
        legenda: "Presente que todo mundo ama 🎁💗\nKit Doce Pedaço: brownies, cookies e bolo no pote.\nPerfeito para aniversário, agradecimento ou só porque sim.\n\n{hashtags}" }
    ]}
  ],

  estrategias: [
    { titulo: "Perfil profissional no Instagram", texto: "Configurações → Tipo de conta → Profissional → Empresa, categoria \"Confeitaria\". Ative o botão de contato com o WhatsApp e coloque o bairro/cidade." },
    { titulo: "Link da bio = página de pedidos", texto: "Use o link da página de pedidos (está logo acima). O cliente escolhe, e o pedido chega organizado no WhatsApp, pronto para colar no app." },
    { titulo: "Cartão fidelidade automático", texto: "O app conta os pedidos entregues de cada cliente. No 10º, avisa você e já deixa a mensagem pronta. Divulgue isso na bio e nas embalagens!" },
    { titulo: "Indique e ganhe", texto: "Quem indicar uma amiga que fizer pedido ganha 1 cookie, e a amiga também. Anote no campo \"Como conheceu\" do cliente." },
    { titulo: "Amostras que viram clientes", texto: "Leve mini cookies com a etiqueta para vizinhos, trabalho, academia e salão de beleza. Cada amostra é um cartão de visitas comestível." },
    { titulo: "Parcerias locais", texto: "Ofereça brownies para revenda em cafés, mercadinhos e lanchonetes do bairro (preço de atacado, mínimo de 10 unidades)." },
    { titulo: "Status do WhatsApp todo dia", texto: "Poste a fornada do dia nos status. Quem salvou seu número vê, e status de comida gera muito pedido por impulso." },
    { titulo: "Lista de transmissão semanal", texto: "Toda segunda, envie o \"cardápio da semana\" para uma lista de transmissão com seus clientes (só recebe quem salvou seu número)." },
    { titulo: "Perfil da Empresa no Google", texto: "É grátis: google.com/business. Faz a Doce Pedaço aparecer quando alguém pesquisa \"brownie perto de mim\"." },
    { titulo: "Datas que vendem", texto: "Natal, Páscoa, Dia das Mães, Dia dos Namorados, Dia das Crianças e Dia dos Professores. Divulgue os kits de 3 a 4 semanas antes." },
    { titulo: "Responder rápido", texto: "Quem responde em até 1 hora vende muito mais. Use as respostas rápidas do WhatsApp (abaixo) para ganhar tempo." }
  ],

  /* ---------- Rotina operacional ---------- */
  rotina: [
    { dia: "Todos os dias", itens: [
      "Abrir o caderninho de manhã e ver a tela Início",
      "Responder as mensagens do Instagram e do WhatsApp",
      "Atualizar o status dos pedidos (produção → pronto → entregue)",
      "Registrar os pagamentos recebidos"
    ]},
    { dia: "Segunda", itens: [
      "Montar o cardápio da fornada (aba Fornada) e ajustar o limite de pedidos",
      "Postar nos stories: \"amanhã abre a fornada!\" com uma prévia",
      "Separar o conteúdo do Instagram da semana (aba Divulgação)"
    ]},
    { dia: "Terça", itens: [
      "Dia de pedidos! Stories de manhã, à tarde e à noite com o link",
      "Confirmar os pedidos novos e mandar o Pix do sinal",
      "Se lotar ou cansar: pausar os pedidos (tudo bem!) 💜",
      "À noite: ver a lista de produção e fazer as compras"
    ]},
    { dia: "Quarta", itens: [
      "Mãos na massa: produção da fornada",
      "Imprimir as etiquetas com a validade",
      "Entregas da noite (se estiver ligado)",
      "Stories dos bastidores 🎥"
    ]},
    { dia: "Quinta", itens: [
      "Entregas e retiradas do dia",
      "Combinar horário e local com quem vai retirar"
    ]},
    { dia: "Sexta", itens: [
      "Entregas e retiradas",
      "Pedir foto e avaliação de quem já recebeu (o app lembra)"
    ]},
    { dia: "Sábado", itens: [
      "Últimas entregas",
      "Repostar as fotos das clientes nos stories 📸"
    ]},
    { dia: "Domingo", itens: [
      "Descansar 💗 (sério!)",
      "Fazer o backup (Ajustes → Baixar backup)",
      "Olhar os Resultados do mês e comemorar"
    ]}
  ],

  dicasOperacao: [
    { titulo: "Preço certo", texto: "Regra simples: preço = custo dos ingredientes e da embalagem × 3. Cadastre o custo de cada produto no Cardápio e o app mostra a margem de cada um." },
    { titulo: "Sinal para encomendas", texto: "Peça 50% de sinal para bolos inteiros e caixas. Assim ninguém desiste em cima da hora, e você não fica no prejuízo." },
    { titulo: "Limite de produção", texto: "Defina quantos pedidos cabem por dia. Quando lotar, diga que a agenda fechou: isso valoriza o produto e protege o seu descanso." },
    { titulo: "Validade e conservação", texto: "Brownie: 5 dias em pote fechado. Cookie: 7 dias. Bolo com recheio: 3 dias na geladeira. O app já calcula a data e imprime nas etiquetas." },
    { titulo: "Separar o dinheiro", texto: "Abra uma conta só para a Doce Pedaço (Pix da empresa). Fica muito mais fácil saber se está dando lucro. O MEI custa cerca de R$ 80 por mês e dá CNPJ." }
  ]
};

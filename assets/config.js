/* ============================================================
   Doce Pedaço — configuração do negócio
   Edite aqui o que aparece na PÁGINA PÚBLICA de pedidos
   (link da bio do Instagram). O app de gestão usa isto
   como ponto de partida e depois guarda as mudanças dela.
   ============================================================ */
window.DP_CONFIG = {
  nome: "Doce Pedaço",
  slogan: "Feito com carinho para você",

  // WhatsApp com DDI + DDD, só números. Ex.: "5551999998888"
  // Deixe vazio até decidir o número: os botões avisam que falta configurar.
  whatsapp: "",

  // Usuário do Instagram, sem @
  instagram: "docepedaco",

  cidade: "",

  // Sincronização entre computador e iPhone (Supabase, grátis).
  // Passo a passo em docs/SINCRONIZACAO.md. Vazio = dados só no aparelho.
  // A "chave" aqui é a chave PÚBLICA (anon/publishable): pode ficar no site.
  nuvem: { url: "", chave: "" },
  // Regras da fornada semanal (o painel muda isso em "Fornada").
  // Pedidos na terça (opcional: quarta de manhã); entregas a partir de quinta.
  fornada: {
    limite: 30,                // pedidos por fornada (0 = sem limite)
    estenderQuarta: false,     // aceitar pedidos na quarta de manhã também
    fimQuarta: "12:00",
    entregaQuartaNoite: false, // entregar já na quarta à noite
    horaQuartaNoite: "19:00",
    entregaSexta: true,
    entregaSabado: true,
    retirada: true,
    entrega: true,
    taxaEntrega: 5,
    pausadoSemana: null,
    recadinho: ""
  },

  // Depoimentos REAIS de clientes (com autorização). Aparecem no site quando houver.
  // Ex.: { nome: "Ana, cliente desde out/26", texto: "O brownie mais molhadinho que já comi!" }
  depoimentos: [],

  // Fotos reais da cozinha (galeria "direto da cozinha" no site)
  galeria: [
    { foto: "assets/fotos/bolo-formigueiro.webp", legenda: "bolo formigueiro na caixinha ♡" },
    { foto: "assets/fotos/cookie-cake.webp", legenda: "cookie cake saindo do forno" },
    { foto: "assets/fotos/brownie.webp", legenda: "olha essa casquinha ✨" }
  ],

  antecedenciaPadraoDias: 2, // para encomendas fora da fornada (bolos de aniversário etc.)
  formasPagamento: ["Pix", "Dinheiro", "Cartão"],
  sinalPercentual: 50, // % de sinal para encomendas grandes

  // Cardápio inicial — preços são SUGESTÃO, ajuste à realidade dela.
  // custo = gasto estimado com ingredientes + embalagem (para calcular o lucro)
  // antecedencia = dias de antecedência para produzir
  cardapio: [
    { id: "brw-trad",  categoria: "Brownies", nome: "Brownie tradicional",       descricao: "Casquinha crocante e miolo molhadinho.",        preco: 10,  custo: 3.5, antecedencia: 1, ativo: true, foto: "assets/fotos/brownie.webp" },
    { id: "brw-rech",  categoria: "Brownies", nome: "Brownie recheado",          descricao: "Ninho, doce de leite ou brigadeiro.",           preco: 13,  custo: 4.5, antecedencia: 1, ativo: true },
    { id: "brw-cx6",   categoria: "Brownies", nome: "Caixa com 6 brownies",      descricao: "Perfeita para presentear.",                     preco: 55,  custo: 20,  antecedencia: 2, ativo: true },
    { id: "ck-trad",   categoria: "Cookies",  nome: "Cookie tradicional",        descricao: "Gotas de chocolate, crocante por fora.",        preco: 8,   custo: 2.5, antecedencia: 1, ativo: true },
    { id: "ck-rech",   categoria: "Cookies",  nome: "Cookie recheado",           descricao: "Recheio cremoso que escorre.",                  preco: 11,  custo: 3.5, antecedencia: 1, ativo: true },
    { id: "cookie-cake", categoria: "Cookies", nome: "Cookie cake",               descricao: "Cookie gigante assado na forma: borda crocante, meio molinho e gotas de chocolate.", preco: 38, custo: 12, antecedencia: 1, ativo: true, foto: "assets/fotos/cookie-cake.webp" },
    { id: "ck-cx6",    categoria: "Cookies",  nome: "Caixa com 6 cookies",       descricao: "Sabores sortidos.",                             preco: 45,  custo: 16,  antecedencia: 2, ativo: true },
    { id: "bl-formigueiro", categoria: "Bolos", nome: "Bolo formigueiro",        descricao: "Bolo fofinho de baunilha com granulado de chocolate, na caixinha.", preco: 35, custo: 11, antecedencia: 1, ativo: true, foto: "assets/fotos/bolo-formigueiro.webp" },
    { id: "bl-fatia",  categoria: "Bolos",    nome: "Fatia de bolo",             descricao: "Sabor do dia — pergunte!",                      preco: 14,  custo: 4,   antecedencia: 1, ativo: true },
    { id: "bl-pote",   categoria: "Bolos",    nome: "Bolo no pote",              descricao: "Camadas de bolo e recheio no potinho.",         preco: 15,  custo: 5,   antecedencia: 1, ativo: true },
    { id: "bl-15",     categoria: "Bolos",    nome: "Bolo inteiro (15 cm)",      descricao: "Serve cerca de 10 fatias.",                     preco: 90,  custo: 32,  antecedencia: 3, ativo: true },
    { id: "bl-20",     categoria: "Bolos",    nome: "Bolo inteiro (20 cm)",      descricao: "Serve cerca de 20 fatias.",                     preco: 150, custo: 55,  antecedencia: 4, ativo: true },
    { id: "kit-mix",   categoria: "Kits",     nome: "Kit Doce Pedaço",           descricao: "2 brownies + 2 cookies + 1 bolo no pote.",      preco: 55,  custo: 19,  antecedencia: 2, ativo: true }
  ]
};

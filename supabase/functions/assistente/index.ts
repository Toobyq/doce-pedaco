// Doce Pedaço — Pedacinho (assistente): função na nuvem (Supabase Edge Function, Deno)
// Guarda a chave da Anthropic em segredo e repassa a conversa para o Claude.
// As ferramentas rodam no app dela (o navegador executa e devolve o resultado).
//
// Publicar:  npx supabase functions deploy assistente
// Segredo:   npx supabase secrets set ANTHROPIC_API_KEY=...   (nunca no código)
import Anthropic from "npm:@anthropic-ai/sdk";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const URL_BASE = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const FERRAMENTAS_PERMITIDAS = new Set([
  "criar_pedido", "listar_pedidos", "mudar_status", "registrar_pagamento", "pausar_pedidos", "ajustar_fornada",
  "resumo_vendas", "tarefas_do_dia", "buscar_cliente", "preparar_whatsapp", "criar_lembrete", "ideias_em_alta", "abrir_tela",
]);

const SISTEMA = `Você é o Pedacinho, o assistente pessoal da dona da Doce Pedaço, uma confeitaria artesanal de brownies, cookies e bolos que vende por "fornada semanal" (pedidos na terça; entregas a partir de quinta).
Fale com ela como uma amiga próxima, de um jeito meigo e carinhoso: português do Brasil neutro, descontraído e acolhedor, frases curtas, um emoji de vez em quando (💗 ✨ 🧁). Nada de textão: 1 a 3 frases, ou uma listinha curta.

Como trabalhar:
- Use as ferramentas para fazer o que ela pedir (anotar pedidos, mudar status, pagamentos, pausar a fornada, lembretes, resumos, mensagens). Depois de usar, confirme em uma frase o que foi feito.
- Os dados do caderninho vêm no bloco <contexto> e nos resultados das ferramentas. Nunca invente números, clientes, pedidos ou tendências: se não souber, use uma ferramenta ou pergunte.
- Datas: use o "Hoje" do contexto. "Quinta" = a próxima quinta. Se ela não disser o dia de um pedido, deixe data_entrega como null.
- Se faltar algo essencial (ex.: nome da cliente ou quais doces), pergunte antes de criar.
- Cancelar pedido: confirme com ela antes de mudar o status para cancelado.
- WhatsApp: você só prepara a mensagem; quem envia é ela, tocando no botão. Diga isso de forma natural.
- Conselhos de negócio (preço, divulgação, organização): dê dicas práticas e curtas. Para tendências, use ideias_em_alta e cite a fonte.`;

async function ehDona(auth: string): Promise<boolean> {
  // o token precisa ser de uma usuária logada E ela precisa ser a dona da vitrine (regras do banco)
  const r = await fetch(`${URL_BASE}/rest/v1/vitrine?select=dono`, { headers: { apikey: ANON, Authorization: auth } });
  if (!r.ok) return false;
  const linhas = await r.json();
  return Array.isArray(linhas) && linhas.length > 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const json = (st: number, corpo: unknown) => new Response(JSON.stringify(corpo), { status: st, headers: { ...CORS, "Content-Type": "application/json" } });
  if (req.method !== "POST") return json(405, { erro: "use POST" });

  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ") || !(await ehDona(auth))) return json(403, { erro: "só a dona pode usar o Pedacinho" });

  let corpo: { messages?: Anthropic.MessageParam[]; tools?: Anthropic.Tool[] };
  try { corpo = await req.json(); } catch { return json(400, { erro: "JSON inválido" }); }
  const messages = corpo.messages ?? [];
  const tools = (corpo.tools ?? []).filter((t) => FERRAMENTAS_PERMITIDAS.has(t.name));
  if (!messages.length || messages.length > 80) return json(400, { erro: "conversa vazia ou longa demais" });

  const client = new Anthropic(); // lê ANTHROPIC_API_KEY dos segredos da função
  try {
    const resposta = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default", // se o modelo recusar por engano, a API tenta de novo em outro modelo
      output_config: { effort: "low" }, // conversa rápida; o Opus 5.5 não desliga o raciocínio
      system: SISTEMA,
      tools,
      messages,
    });
    return json(200, { content: resposta.content, stop_reason: resposta.stop_reason });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return json(429, { erro: "muitas perguntas seguidas, espera um minutinho" });
    if (e instanceof Anthropic.APIError) return json(502, { erro: `Claude respondeu ${e.status}` });
    return json(500, { erro: "falha ao falar com o Claude" });
  }
});

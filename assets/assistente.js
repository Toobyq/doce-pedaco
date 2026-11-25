/* ============================================================
   Doce Pedaço — Pedacinho, o assistente pessoal
   • Ferramentas que mexem no caderninho (pedidos, fornada, lembretes...)
   • Modo IA: Claude, via função na nuvem (supabase/functions/assistente)
   • Modo básico (grátis, sem internet): entende os comandos mais comuns
   • Voz: fala com ele pelo microfone e ouve a resposta
   Nada é enviado no WhatsApp sem ela tocar no botão.
   ============================================================ */
(() => {
"use strict";
const $ = (s, el = document) => el.querySelector(s);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const A = () => window.DPApp;
const CFG = window.DP_CONFIG || {};
const F = window.DPFornada, M = window.DPMimos;

/* ---------------- ferramentas (mesmas para a IA e o modo básico) ---------------- */
const str = (d) => ({ type: ["string", "null"], description: d });
const FERRAMENTAS = [
  { name: "criar_pedido", description: "Anota um pedido novo no caderninho. Use os nomes de produto do cardápio. Se a data não foi dita, use null (o app escolhe o próximo dia de entrega da fornada).",
    input_schema: { type: "object", additionalProperties: false, required: ["cliente_nome", "telefone", "itens", "data_entrega", "recebimento", "endereco", "observacao"],
      properties: { cliente_nome: { type: "string" }, telefone: str("WhatsApp da cliente, se dito"),
        itens: { type: "array", items: { type: "object", additionalProperties: false, required: ["produto", "quantidade"], properties: { produto: { type: "string" }, quantidade: { type: "integer" } } } },
        data_entrega: str("AAAA-MM-DD"), recebimento: { type: ["string", "null"], enum: ["retirada", "entrega", null] }, endereco: str("se for entrega"), observacao: str("sabor, recado, alergia...") } } },
  { name: "listar_pedidos", description: "Lista pedidos. filtro: hoje, amanha, ativos, fornada (fornada da semana), a_receber.",
    input_schema: { type: "object", additionalProperties: false, required: ["filtro"], properties: { filtro: { type: "string", enum: ["hoje", "amanha", "ativos", "fornada", "a_receber"] } } } },
  { name: "mudar_status", description: "Muda o status de um pedido pelo número.",
    input_schema: { type: "object", additionalProperties: false, required: ["numero", "status"], properties: { numero: { type: "integer" }, status: { type: "string", enum: ["novo", "confirmado", "producao", "pronto", "entregue", "cancelado"] } } } },
  { name: "registrar_pagamento", description: "Registra um pagamento recebido. valor null = pagou tudo que faltava.",
    input_schema: { type: "object", additionalProperties: false, required: ["numero", "valor"], properties: { numero: { type: "integer" }, valor: { type: ["number", "null"] } } } },
  { name: "pausar_pedidos", description: "Pausa (true) ou reabre (false) os pedidos da fornada da semana no site.",
    input_schema: { type: "object", additionalProperties: false, required: ["pausar"], properties: { pausar: { type: "boolean" } } } },
  { name: "ajustar_fornada", description: "Muda o limite de pedidos e/ou liga e desliga doces no cardápio da semana. Use null no que não mudar.",
    input_schema: { type: "object", additionalProperties: false, required: ["limite", "ligar", "desligar"], properties: { limite: { type: ["integer", "null"] }, ligar: { type: ["array", "null"], items: { type: "string" } }, desligar: { type: ["array", "null"], items: { type: "string" } } } } },
  { name: "resumo_vendas", description: "Resumo de vendas: total vendido, recebido, a receber, número de pedidos e o mais vendido.",
    input_schema: { type: "object", additionalProperties: false, required: ["periodo"], properties: { periodo: { type: "string", enum: ["hoje", "semana", "mes"] } } } },
  { name: "tarefas_do_dia", description: "O que ela precisa fazer hoje (lembretes automáticos e dela).",
    input_schema: { type: "object", additionalProperties: false, required: [], properties: {} } },
  { name: "buscar_cliente", description: "Dados e histórico de uma cliente pelo nome.",
    input_schema: { type: "object", additionalProperties: false, required: ["nome"], properties: { nome: { type: "string" } } } },
  { name: "preparar_whatsapp", description: "Prepara uma mensagem de WhatsApp pronta. Ela toca no botão para enviar (nunca envia sozinho). tipo: confirmacao, pronto, saiu, cobranca, posvenda ou livre (use texto).",
    input_schema: { type: "object", additionalProperties: false, required: ["numero_pedido", "cliente_nome", "tipo", "texto"], properties: { numero_pedido: { type: ["integer", "null"] }, cliente_nome: str(""), tipo: { type: "string", enum: ["confirmacao", "pronto", "saiu", "cobranca", "posvenda", "livre"] }, texto: str("só para tipo livre") } } },
  { name: "criar_lembrete", description: "Cria um lembrete pra ela.",
    input_schema: { type: "object", additionalProperties: false, required: ["texto", "data", "hora"], properties: { texto: { type: "string" }, data: { type: "string", description: "AAAA-MM-DD" }, hora: str("HH:MM") } } },
  { name: "ideias_em_alta", description: "Tendências e ideias de doces em alta nesta semana (pesquisadas na internet, com fontes).",
    input_schema: { type: "object", additionalProperties: false, required: [], properties: {} } },
  { name: "abrir_tela", description: "Abre uma tela do caderninho.",
    input_schema: { type: "object", additionalProperties: false, required: ["tela"], properties: { tela: { type: "string", enum: ["inicio", "fornada", "pedidos", "agenda", "clientes", "cardapio", "ideias", "divulgacao", "rotina", "resultados", "ajustes"] } } } }
].map((t) => ({ ...t, strict: true }));

let cartoes = []; // cartões de ação mostrados junto da resposta
const achaProduto = (nome) => {
  const S = A().estado(); const n = A().normal(nome).replace(/s\b/g, "");
  return S.produtos.find((p) => A().normal(p.nome) === A().normal(nome)) ||
    S.produtos.find((p) => A().normal(p.nome).replace(/s\b/g, "").includes(n)) ||
    S.produtos.find((p) => n.includes(A().normal(p.nome).replace(/s\b/g, "").split(" ")[0]) && p.naFornada !== false);
};
const pedidoNum = (n) => A().estado().pedidos.find((p) => p.numero === Number(n));
const linhaPedido = (p) => { const c = A().cliente(p.clienteId) || {}; return `#${p.numero} ${c.nome || ""} · ${A().resumoItens(p)} · ${A().relativo(p.data)} · ${A().nomeStatus(p.status)} · ${A().brl(A().total(p))}${A().saldo(p) > 0 ? ` (falta ${A().brl(A().saldo(p))})` : ""}`; };

const EXEC = {
  criar_pedido(i) {
    const S = A().estado(); const itens = []; const faltou = [];
    for (const it of i.itens || []) {
      const p = achaProduto(it.produto);
      if (p) itens.push({ produtoId: p.id, nome: p.nome, preco: p.preco, custo: p.custo || 0, categoria: p.categoria, qtd: Math.max(1, it.quantidade || 1) });
      else faltou.push(it.produto);
    }
    if (!itens.length) return { erro: `Não achei no cardápio: ${faltou.join(", ")}. Produtos: ${S.produtos.filter((p) => p.ativo !== false).map((p) => p.nome).join(", ")}` };
    const dias = A().diasParaPedido(); const data = i.data_entrega || (dias.find((d) => !d.noite) || dias[0]).data;
    const d = dias.find((x) => x.data === data);
    const p = A().novoPedido({ clienteNome: i.cliente_nome, telefone: i.telefone, itens, data, hora: d && d.noite ? d.hora : "", tipo: i.recebimento || "retirada", endereco: i.endereco, obs: i.observacao });
    cartoes.push({ tipo: "pedido", id: p.id, titulo: `Pedido #${p.numero} anotado 🎉`, sub: linhaPedido(p) });
    A().confete(40);
    return { ok: true, pedido: linhaPedido(p), ...(faltou.length ? { nao_encontrados: faltou } : {}) };
  },
  listar_pedidos({ filtro }) {
    const S = A().estado(); const h = A().hoje(); const sem = F.janela(S.fornada).semana;
    const L = S.pedidos.filter((p) => p.status !== "cancelado" && (
      filtro === "hoje" ? p.data === h : filtro === "amanha" ? p.data === A().addDias(h, 1) : filtro === "ativos" ? A().ativo(p) :
      filtro === "fornada" ? A().fornadaDe(p.data) === sem : A().saldo(p) > 0)).sort((a, b) => a.data.localeCompare(b.data));
    return { quantidade: L.length, pedidos: L.slice(0, 25).map(linhaPedido) };
  },
  mudar_status({ numero, status }) {
    const p = pedidoNum(numero); if (!p) return { erro: `Não existe pedido #${numero}` };
    p.status = status; p.atualizadoEm = new Date().toISOString(); A().salvar();
    if (status === "cancelado" && p.siteId && window.DPSync) DPSync.apagarPedidoSite(p.siteId);
    cartoes.push({ tipo: "pedido", id: p.id, titulo: `#${p.numero}: ${A().nomeStatus(status)} ✓`, sub: linhaPedido(p) });
    if (status === "entregue") A().confete(40);
    return { ok: true, pedido: linhaPedido(p) };
  },
  registrar_pagamento({ numero, valor }) {
    const p = pedidoNum(numero); if (!p) return { erro: `Não existe pedido #${numero}` };
    p.pago = Math.round(((valor == null ? A().saldo(p) : valor) + (p.pago || 0)) * 100) / 100; p.atualizadoEm = new Date().toISOString(); A().salvar();
    cartoes.push({ tipo: "pedido", id: p.id, titulo: `💰 Pagamento registrado no #${p.numero}`, sub: linhaPedido(p) });
    return { ok: true, pedido: linhaPedido(p) };
  },
  pausar_pedidos({ pausar }) {
    const S = A().estado(); S.fornada.pausadoSemana = pausar ? F.janela(S.fornada).semana : null; A().salvar();
    cartoes.push({ tipo: "tela", h: "#fornada", titulo: pausar ? "❚❚ Pedidos pausados" : "▶ Pedidos reabertos", sub: pausar ? "O site já mostra que a fornada fechou" : "O site voltou a aceitar pedidos" });
    return { ok: true, situacao: A().situFornada().estado };
  },
  ajustar_fornada({ limite, ligar, desligar }) {
    const S = A().estado(); const feito = [];
    if (limite != null) { S.fornada.limite = Math.max(0, limite); feito.push(`limite ${limite || "sem limite"}`); }
    for (const [lista, v] of [[ligar, true], [desligar, false]]) for (const n of lista || []) { const p = achaProduto(n); if (p) { p.naFornada = v; feito.push(`${p.nome} ${v ? "ligado" : "desligado"}`); } }
    A().salvar(); cartoes.push({ tipo: "tela", h: "#fornada", titulo: "Fornada ajustada ✓", sub: feito.join(" · ") });
    return { ok: true, mudancas: feito };
  },
  resumo_vendas({ periodo }) {
    const S = A().estado(); const h = A().hoje();
    const ini = periodo === "hoje" ? h : periodo === "semana" ? A().addDias(h, -6) : h.slice(0, 8) + "01";
    const ps = S.pedidos.filter((p) => p.status !== "cancelado" && p.data >= ini && p.data <= (periodo === "mes" ? h.slice(0, 8) + "31" : h));
    const top = {}; ps.forEach((p) => p.itens.forEach((i) => top[i.nome] = (top[i.nome] || 0) + i.qtd));
    const mais = Object.entries(top).sort((a, b) => b[1] - a[1])[0];
    const vend = ps.reduce((s, p) => s + A().total(p), 0), rec = ps.reduce((s, p) => s + Math.min(p.pago || 0, A().total(p)), 0);
    return { periodo, pedidos: ps.length, vendido: A().brl(vend), recebido: A().brl(rec), a_receber: A().brl(vend - rec), mais_vendido: mais ? `${mais[0]} (${mais[1]} un.)` : "—", meta_mes: S.config.metaMensal ? A().brl(S.config.metaMensal) : null };
  },
  tarefas_do_dia() {
    const L = A().lembretes().filter((l) => l.data <= A().hoje());
    return { quantidade: L.length, tarefas: L.slice(0, 20).map((l) => `${l.titulo}${l.detalhe ? " — " + l.detalhe : ""}`) };
  },
  buscar_cliente({ nome }) {
    const S = A().estado(); const n = A().normal(nome);
    const c = S.clientes.find((x) => A().normal(x.nome) === n) || S.clientes.find((x) => A().normal(x.nome).includes(n));
    if (!c) return { erro: `Não achei cliente "${nome}"` };
    const st = A().statsCliente(c);
    cartoes.push({ tipo: "tela", h: "#cliente/" + c.id, titulo: `💗 ${c.nome}`, sub: `${st.pedidos} pedido(s) · ${A().brl(st.gasto)} · selos ${st.selos}/${st.meta}` });
    return { nome: c.nome, telefone: c.telefone, pedidos: st.pedidos, gasto: A().brl(st.gasto), ultimo: st.ultimo, selos: `${st.selos}/${st.meta}`, brindes: st.brindes, observacoes: c.obs || "" };
  },
  preparar_whatsapp({ numero_pedido, cliente_nome, tipo, texto }) {
    const S = A().estado(); let p = numero_pedido ? pedidoNum(numero_pedido) : null; let c = p ? A().cliente(p.clienteId) : null;
    if (!c && cliente_nome) { const n = A().normal(cliente_nome); c = S.clientes.find((x) => A().normal(x.nome).includes(n)); }
    if (!p && c && tipo !== "livre") p = S.pedidos.filter((x) => x.clienteId === c.id && x.status !== "cancelado").sort((a, b) => b.data.localeCompare(a.data))[0];
    if (tipo !== "livre" && !p) return { erro: "Preciso do número do pedido ou do nome da cliente." };
    const msg = tipo === "livre" ? (texto || "") : A().mensagem(tipo, p);
    const fone = (c || {}).telefone;
    cartoes.push({ tipo: "zap", fone, msg, titulo: `💬 Mensagem pra ${c ? A().primeiroNome(c.nome) : "cliente"}`, sub: msg.slice(0, 140) + (msg.length > 140 ? "…" : "") });
    return { ok: true, mensagem_pronta: msg, observacao: "Ela precisa tocar no botão para abrir o WhatsApp e enviar." };
  },
  criar_lembrete({ texto, data, hora }) {
    const S = A().estado(); S.lembretes.push({ id: A().uid(), texto, data, hora: hora || "", feito: false, atualizadoEm: new Date().toISOString() }); A().salvar();
    cartoes.push({ tipo: "tela", h: "#agenda", titulo: "📝 Lembrete criado", sub: `${texto} · ${A().relativo(data)}${hora ? " às " + hora : ""}` });
    return { ok: true };
  },
  ideias_em_alta() {
    const I = window.DP_IDEIAS || { emAlta: [] };
    return { atualizado: I.atualizadoEm, resumo: I.resumo, em_alta: I.emAlta.map((t) => `${t.titulo}: ${t.texto}${t.fonte && t.fonte.nome ? ` (fonte: ${t.fonte.nome})` : ""}`) };
  },
  abrir_tela({ tela }) { setTimeout(() => { location.hash = "#" + tela; }, 600); return { ok: true }; }
};
function executar(nome, input) {
  try { return EXEC[nome] ? EXEC[nome](input || {}) : { erro: "ferramenta desconhecida" }; }
  catch (e) { console.warn(e); return { erro: "Deu um probleminha: " + e.message }; }
}

/* ---------------- modo IA (Claude pela função na nuvem) ---------------- */
let historico = []; // mensagens no formato da API (append-only)
const iaDisponivel = () => !!(window.DPSync && DPSync.logado() && DPSync.configurado());
function contexto() {
  const S = A().estado(); const s = A().situFornada();
  return `<contexto>Hoje: ${A().fmtData(A().hoje())} (${A().hoje()}). Dona: ${S.config.dona || "—"}.
Fornada nº ${F.numero(s.semana)}: ${s.estado}, ${s.usados} pedido(s)${s.limite ? ` de ${s.limite}` : ""}. Dias de entrega: ${F.diasEntrega(S.fornada, s.semana).map((d) => `${d.rotulo} ${d.data}`).join(", ")}.
Cardápio: ${S.produtos.filter((p) => p.ativo !== false).map((p) => `${p.nome} ${A().brl(p.preco)}${p.naFornada === false ? " (fora da fornada)" : ""}`).join("; ")}.
Clientes: ${S.clientes.slice(0, 60).map((c) => c.nome).join(", ")}.</contexto>`;
}
async function perguntarIA(texto) {
  if (historico.length > 60) historico = []; // conversa longa: começa uma nova
  historico.push({ role: "user", content: [{ type: "text", text: texto }, { type: "text", text: contexto() }] });
  const url = `${String(CFG.nuvem.url).replace(/\/+$/, "")}/functions/v1/assistente`;
  for (let volta = 0; volta < 6; volta++) {
    const token = await DPSync.tokenAtual();
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, apikey: CFG.nuvem.chave },
      body: JSON.stringify({ messages: historico, tools: FERRAMENTAS }) });
    if (!r.ok) throw new Error(`assistente ${r.status}`);
    const resp = await r.json();
    historico.push({ role: "assistant", content: resp.content });
    if (resp.stop_reason === "refusal") return "Hmm, nisso eu não consigo ajudar. Tenta perguntar de outro jeito? ♡";
    const usos = resp.content.filter((b) => b.type === "tool_use");
    if (resp.stop_reason !== "tool_use" || !usos.length) return resp.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim() || "Prontinho ♡";
    historico.push({ role: "user", content: usos.map((u) => { const res = executar(u.name, u.input); return { type: "tool_result", tool_use_id: u.id, content: JSON.stringify(res), ...(res.erro ? { is_error: true } : {}) }; }) });
  }
  return "Fiz o que deu por agora. Confere aí nas telas ♡";
}

/* ---------------- modo básico (grátis, sem IA) ---------------- */
const NUM = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, "três": 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, doze: 12, meia: 6 };
const DIAS = { segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6, domingo: 0 };
function dataDita(t) {
  const h = A().hoje(); if (/\bhoje\b/.test(t)) return h; if (/\bamanha\b/.test(t)) return A().addDias(h, 1);
  for (const [n, dow] of Object.entries(DIAS)) if (new RegExp(`\\b${n}`).test(t)) { const d = F.parse(h); let k = (dow - d.getDay() + 7) % 7; if (k === 0) k = 7; return A().addDias(h, k); }
  const m = t.match(/(\d{1,2})\/(\d{1,2})/); if (m) return `${h.slice(0, 4)}-${String(m[2]).padStart(2, "0")}-${String(m[1]).padStart(2, "0")}`;
  return null;
}
function basico(original) {
  const t = A().normal(original); const S = A().estado();
  const cmd = (nome, input, resposta) => { const r = executar(nome, input); return r.erro ? r.erro : resposta(r); };
  if (/(pausa|pausar|fecha|fechar|para|parar)\b.*pedido|pedidos?.*(pausa|fecha)/.test(t) && !/reabr|abre|volta/.test(t))
    return cmd("pausar_pedidos", { pausar: true }, () => "Pronto, pausei os pedidos da fornada 💜 Descansa um pouquinho!");
  if (/(reabr|abre|abrir|volta|voltar|despaus)/.test(t) && /pedido|fornada|site/.test(t))
    return cmd("pausar_pedidos", { pausar: false }, () => "Reabri os pedidos! Bora vender 🎉");
  if (/quanto.*(vendi|vend|fatur)|resumo|vendas/.test(t)) {
    const periodo = /hoje/.test(t) ? "hoje" : /semana/.test(t) ? "semana" : "mes";
    return cmd("resumo_vendas", { periodo }, (r) => `${periodo === "hoje" ? "Hoje" : periodo === "semana" ? "Nos últimos 7 dias" : "Este mês"}: ${r.pedidos} pedido(s), ${r.vendido} vendido, ${r.recebido} recebido e ${r.a_receber} a receber. O campeão é ${r.mais_vendido} 🏆`);
  }
  if (/(o que|oq|que).*(fazer|tenho)|tarefa|agenda de hoje/.test(t))
    return cmd("tarefas_do_dia", {}, (r) => r.quantidade ? `Hoje você tem ${r.quantidade} tarefa(s):\n• ${r.tarefas.slice(0, 8).join("\n• ")}` : "Nada pendente hoje! Tudo em dia 💗");
  if (/(quem|o que).*(deve|falta|receber)|a receber/.test(t))
    return cmd("listar_pedidos", { filtro: "a_receber" }, (r) => r.quantidade ? `Falta receber de:\n• ${r.pedidos.join("\n• ")}` : "Ninguém te deve nada 🥳");
  if (/pedidos?.*(hoje|amanha|semana|fornada)|entregas?/.test(t) && !/anota|novo/.test(t)) {
    const filtro = /amanha/.test(t) ? "amanha" : /hoje/.test(t) ? "hoje" : "fornada";
    return cmd("listar_pedidos", { filtro }, (r) => r.quantidade ? `${r.quantidade} pedido(s):\n• ${r.pedidos.join("\n• ")}` : "Nenhum pedido aí ainda.");
  }
  let m = t.match(/(?:pedido\s*)?#?\s*(\d+)\b.*\b(pronto|entregue|entreguei|producao|produzindo|confirmad|cancel)/) || t.match(/\b(pronto|entregue|entreguei|producao|confirm|cancel)\w*\b.*#?\s*(\d+)/);
  if (m) { const num = /\d/.test(m[1]) ? m[1] : m[2]; const w = /\d/.test(m[1]) ? m[2] : m[1];
    const status = /pront/.test(w) ? "pronto" : /entreg/.test(w) ? "entregue" : /produ/.test(w) ? "producao" : /cancel/.test(w) ? "cancelado" : "confirmado";
    return cmd("mudar_status", { numero: +num, status }, (r) => `Feito! ${r.pedido}`); }
  m = t.match(/(pagou|recebi|pago|pagamento).*?#?\s*(\d+)/) || t.match(/#?\s*(\d+).*(pagou|pago)/);
  if (m) { const num = /\d/.test(m[2]) && !/pag|receb/.test(m[2]) ? m[2] : m[1]; return cmd("registrar_pagamento", { numero: +num, valor: null }, (r) => `Anotado o pagamento 💰 ${r.pedido}`); }
  m = t.match(/(?:me )?lembr\w*\s+(?:de\s+|que\s+)?(.+)/);
  if (m) { const data = dataDita(t) || A().hoje(); const hm = t.match(/(\d{1,2})\s*(?:h|:)(\d{2})?/);
    const txt = original.replace(/^.*?lembr\w*\s+(de\s+|que\s+)?/i, "").replace(/(^|\s)(às|as)\s*\d{1,2}\s*(h|:)\s*\d{0,2}(?=\s|$|[.,!])/gi, " ").replace(/(^|\s)(hoje|amanhã|amanha)(?=\s|$|[.,!])/gi, " ").replace(/\s{2,}/g, " ").trim();
    return cmd("criar_lembrete", { texto: txt || original, data, hora: hm ? `${hm[1].padStart(2, "0")}:${hm[2] || "00"}` : null }, () => `Combinado! Vou te lembrar ${A().relativo(data)} 📝`); }
  if (/ideia|em alta|tendencia|moda/.test(t)) return cmd("ideias_em_alta", {}, (r) => `${r.resumo}\n\nEm alta:\n• ${r.em_alta.slice(0, 4).map((x) => x.split(":")[0]).join("\n• ")}`);
  m = t.match(/(confirma\w*|pronto|cobra\w*|avaliac\w*)\b.*?(?:pra|para|da|do|a|o)\s+([a-zà-ú]+)/);
  if (m && /mand|envia|manda|prepara|escreve|faz/.test(t)) { const tipo = /confirm/.test(m[1]) ? "confirmacao" : /pront/.test(m[1]) ? "pronto" : /cobr/.test(m[1]) ? "cobranca" : "posvenda";
    return cmd("preparar_whatsapp", { numero_pedido: null, cliente_nome: m[2], tipo, texto: null }, () => "Deixei a mensagem prontinha. É só tocar no botão pra abrir o WhatsApp 💬"); }
  if (/anota|novo pedido|pedido (da|do|de|pra|para)|quer\b|encomend/.test(t)) {
    const nomeM = original.match(/(?:da|do|de|pra|para)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)?)/) || original.match(/(?:a|o)\s+([A-ZÀ-Ú][a-zà-ú]+)\s+quer/);
    const itens = []; const reItem = /(\d+|um|uma|dois|duas|tres|três|quatro|cinco|seis|sete|oito|nove|dez|doze|meia)\s+(?:duzia\s+de\s+)?([a-zà-ú]+(?:\s+(?:de\s+)?[a-zà-ú]+)?)/g; let k;
    while ((k = reItem.exec(t))) { const q = /\d/.test(k[1]) ? +k[1] : NUM[k[1]] || 1; if (achaProduto(k[2])) itens.push({ produto: k[2], quantidade: q }); }
    if (!nomeM) return "Me diz o nome da cliente? Ex.: \"anota pedido da Ana: 2 brownies pra quinta\" ♡";
    if (!itens.length) return `Anotei a ${nomeM[1]}, mas não entendi os doces. Ex.: \"2 brownies e 1 cookie\" ♡`;
    return cmd("criar_pedido", { cliente_nome: nomeM[1], telefone: null, itens, data_entrega: dataDita(t), recebimento: /entreg|em casa/.test(t) ? "entrega" : "retirada", endereco: null, observacao: null },
      (r) => `Anotado! ${r.pedido}${r.nao_encontrados ? `\n(não achei: ${r.nao_encontrados.join(", ")})` : ""}`);
  }
  m = t.match(/(?:cliente|quem e|sobre a|sobre o)\s+([a-zà-ú]+)/); if (m) return cmd("buscar_cliente", { nome: m[1] }, (r) => `${r.nome}: ${r.pedidos} pedido(s), ${r.gasto} no total, cartão ${r.selos}.`);
  for (const [tela, re] of [["fornada", /fornada/], ["ideias", /ideias?/], ["clientes", /clientes/], ["resultados", /resultado/], ["divulgacao", /divulga|instagram/], ["cardapio", /cardapio/], ["agenda", /agenda/]])
    if (re.test(t) && /abre|abrir|mostra|ver|vai/.test(t)) return cmd("abrir_tela", { tela }, () => "Abrindo ✨");
  return "Ainda não entendi esse 🥺 Experimenta assim:\n• \"anota pedido da Ana: 2 brownies pra quinta\"\n• \"quanto vendi esse mês?\"\n• \"o que tenho pra hoje?\"\n• \"pedido 12 tá pronto\"\n• \"pausa os pedidos\"\n• \"me lembra de comprar chocolate amanhã\"";
}

/* ---------------- interface (chat + voz) ---------------- */
let falarRespostas = false, ouvindo = null;
const SUGESTOES = ["o que tenho pra hoje?", "quanto vendi esse mês?", "anota pedido da Ana: 2 brownies pra quinta", "quem me deve?", "pausa os pedidos", "ideias em alta"];
function montar() {
  if ($("#pedacinho-btn")) return;
  const b = document.createElement("button"); b.id = "pedacinho-btn"; b.setAttribute("aria-label", "Falar com o Pedacinho, seu assistente");
  b.innerHTML = `<span>${M.desenho("bolo")}</span><i>pedacinho</i>`; b.onclick = abrir; document.body.append(b);
  const d = document.createElement("section"); d.id = "pedacinho"; d.setAttribute("role", "dialog"); d.setAttribute("aria-label", "Pedacinho, assistente");
  d.innerHTML = `
    <header><span class="pc-avatar">${M.desenho("bolo")}</span><div><b>Pedacinho</b><small id="pc-modo"></small></div>
      <button class="pc-icone" id="pc-voz" title="Ouvir as respostas" aria-pressed="false">🔈</button><button class="pc-icone" id="pc-fechar" aria-label="Fechar">✕</button></header>
    <div class="pc-msgs" id="pc-msgs" aria-live="polite"></div>
    <div class="pc-sugestoes" id="pc-sug">${SUGESTOES.map((s) => `<button>${esc(s)}</button>`).join("")}</div>
    <form class="pc-form" id="pc-form"><button type="button" class="pc-mic" id="pc-mic" aria-label="Falar">🎤</button>
      <input id="pc-txt" placeholder="pede qualquer coisa ♡" autocomplete="off"><button class="pc-enviar" aria-label="Enviar">➤</button></form>`;
  document.body.append(d);
  $("#pc-fechar").onclick = fechar;
  $("#pc-sug").onclick = (e) => { const x = e.target.closest("button"); if (x) enviar(x.textContent); };
  $("#pc-form").onsubmit = (e) => { e.preventDefault(); const v = $("#pc-txt").value.trim(); if (v) { $("#pc-txt").value = ""; enviar(v); } };
  $("#pc-voz").onclick = () => { falarRespostas = !falarRespostas; $("#pc-voz").textContent = falarRespostas ? "🔊" : "🔈"; $("#pc-voz").setAttribute("aria-pressed", falarRespostas); if (!falarRespostas) speechSynthesis?.cancel(); };
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Rec) $("#pc-mic").style.display = "none";
  else $("#pc-mic").onclick = () => {
    if (ouvindo) { ouvindo.stop(); return; }
    const r = new Rec(); r.lang = "pt-BR"; r.interimResults = true; ouvindo = r; $("#pc-mic").classList.add("on"); $("#pc-txt").placeholder = "tô ouvindo…";
    r.onresult = (e) => { const txt = [...e.results].map((x) => x[0].transcript).join(""); $("#pc-txt").value = txt; if (e.results[e.results.length - 1].isFinal) { $("#pc-txt").value = ""; enviar(txt); } };
    r.onend = () => { ouvindo = null; $("#pc-mic").classList.remove("on"); $("#pc-txt").placeholder = "pede qualquer coisa ♡"; };
    r.onerror = () => r.onend(); r.start();
  };
  d.addEventListener("click", (e) => {
    const z = e.target.closest("[data-zap]"); if (z) { const c = cartoesTela[+z.dataset.zap]; A().abrirZap(c.fone, c.msg); }
    const a = e.target.closest("[data-ir]"); if (a) { location.hash = a.dataset.ir; if (matchMedia("(max-width: 899px)").matches) fechar(); }
  });
}
const cartoesTela = [];
function bolha(quem, html, extra = "") { const el = document.createElement("div"); el.className = `pc-msg ${quem} ${extra}`; el.innerHTML = html; $("#pc-msgs").append(el); el.scrollIntoView({ block: "end", behavior: "smooth" }); return el; }
function abrir() {
  montar(); $("#pedacinho").classList.add("on"); $("#pedacinho-btn").classList.add("escondido");
  $("#pc-modo").textContent = iaDisponivel() ? "inteligência ligada ✨" : "modo básico · entende os comandos mais comuns";
  if (!$("#pc-msgs").children.length) {
    const S = A().estado(); const n = S && S.config.dona ? A().primeiroNome(S.config.dona) : "";
    bolha("ele", `Oi${n ? ", " + esc(n) : ""}! 💗 Eu sou o Pedacinho. Posso anotar pedidos, mudar status, pausar a fornada, te lembrar das coisas, preparar mensagens e te contar como estão as vendas.<br><b>É só pedir</b>, escrevendo ou tocando no 🎤`);
  }
  setTimeout(() => $("#pc-txt").focus(), 250);
}
function fechar() { $("#pedacinho")?.classList.remove("on"); $("#pedacinho-btn")?.classList.remove("escondido"); ouvindo?.stop(); }
async function enviar(texto) {
  if (!A().estado()) return;
  bolha("eu", esc(texto)); $("#pc-sug").classList.add("hidden");
  const pensando = bolha("ele", "<span class='pc-pontinhos'><i></i><i></i><i></i></span>", "pensando");
  cartoes = [];
  let resposta;
  try { resposta = iaDisponivel() ? await perguntarIA(texto) : basico(texto); }
  catch (e) { console.warn(e); resposta = basico(texto); }
  pensando.remove();
  if (cartoes.length && !/^#(novo-pedido|editar-pedido)/.test(location.hash)) A().render(); // a tela de trás acompanha o que ele fez
  const html = esc(resposta).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>");
  const cards = cartoes.map((c) => { const k = cartoesTela.push(c) - 1;
    return `<div class="pc-cartao"><b>${esc(c.titulo)}</b><small>${esc(c.sub || "")}</small>${c.tipo === "zap" ? `<button class="btn mini zap" data-zap="${k}">abrir no WhatsApp</button>` :
      c.tipo === "pedido" ? `<button class="btn mini claro" data-ir="#pedido/${c.id}">ver pedido</button>` : c.h ? `<button class="btn mini claro" data-ir="${esc(c.h)}">abrir</button>` : ""}</div>`; }).join("");
  bolha("ele", html + cards);
  if (falarRespostas && "speechSynthesis" in window) {
    const u = new SpeechSynthesisUtterance(resposta.replace(/[•#*]/g, "").replace(/[\u{1F300}-\u{1FAFF}☀-➿♡💗]/gu, "")); u.lang = "pt-BR"; u.rate = 1.02; u.pitch = 1.1;
    const v = speechSynthesis.getVoices().find((x) => /pt-BR/i.test(x.lang) && /Luciana|Francisca|female|feminina/i.test(x.name)) || speechSynthesis.getVoices().find((x) => /pt-BR/i.test(x.lang));
    if (v) u.voice = v; speechSynthesis.cancel(); speechSynthesis.speak(u);
  }
}

window.DPAssistente = {
  FERRAMENTAS, abrir, fechar, enviar, basico,
  iniciar() {
    montar();
    // atalho do iPhone (Siri / Atalhos): painel.html#pedacinho/<texto>
    const ver = () => { const m = location.hash.match(/^#pedacinho(?:\/(.+))?/); if (m) { abrir(); if (m[1]) setTimeout(() => enviar(decodeURIComponent(m[1])), 400); history.replaceState(null, "", "#inicio"); } };
    addEventListener("hashchange", ver); ver();
  }
};
})();

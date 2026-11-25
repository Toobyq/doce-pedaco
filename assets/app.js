/* ============================================================
   Doce Pedaço — app de gestão
   Tudo fica salvo NESTE aparelho (localStorage). Faça backup
   em Ajustes. Sem servidor, sem mensalidade.
   ============================================================ */
(() => {
"use strict";

const CFG = window.DP_CONFIG;
const TXT = window.DP_CONTEUDO;
const F = window.DPFornada, M = window.DPMimos;
const IDEIAS = window.DP_IDEIAS || { ideias: [], emAlta: [], fontes: [], cuidados: [] };
const TAGS = ["vegano", "sem glúten", "sem lactose", "low carb", "sem açúcar"];
const CHAVE = "docepedaco:v1";

/* ---------------- utilidades ---------------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clone = (o) => JSON.parse(JSON.stringify(o));
const brl = (n) => (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const num = (v) => { const n = parseFloat(String(v ?? "").replace(/\./g, "").replace(",", ".")); return isNaN(n) ? 0 : n; };
const numCampo = (v) => { const s = String(v ?? "").trim(); if (!s) return 0; return s.includes(",") ? num(s) : (parseFloat(s) || 0); };
const normal = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const corAvatar = (n) => "c" + ([...String(n || "")].reduce((s, c) => s + c.charCodeAt(0), 0) % 5);
const iniciais = (n) => String(n || "?").trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
const primeiroNome = (n) => String(n || "").trim().split(/\s+/)[0] || "";

const z2 = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${z2(d.getMonth() + 1)}-${z2(d.getDate())}`;
const parse = (s) => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const hoje = () => iso(new Date());
const addDias = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const difDias = (a, b) => Math.round((parse(b) - parse(a)) / 864e5); // b - a
const DSEM = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const DSEM_LONGO = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const fmtData = (s) => { if (!s) return "—"; const d = parse(s); return `${DSEM[d.getDay()]}, ${z2(d.getDate())}/${z2(d.getMonth() + 1)}`; };
const fmtDataCurta = (s) => { const d = parse(s); return `${z2(d.getDate())}/${z2(d.getMonth() + 1)}`; };
const relativo = (s) => { const n = difDias(hoje(), s); if (n === 0) return "hoje"; if (n === 1) return "amanhã"; if (n === -1) return "ontem"; return fmtData(s); };
const segundaDaSemana = (s) => { const d = parse(s); const dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow); return iso(d); };

/* ---------------- ícones ---------------- */
const P = {
  inicio: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  pedidos: '<path d="M9 3.5h6v3H9z"/><path d="M15 5h3v16H6V5h3"/><path d="M9 11h6M9 15h4"/>',
  agenda: '<rect x="4" y="5.5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v5M16 3v5"/>',
  clientes: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.9.7 3.1 2.4 3.5 5.2"/>',
  cardapio: '<path d="M4 21h16M5.5 21v-7h13v7"/><path d="M5.5 14c1.1 1.5 2.1 1.5 3.2 0 1.1 1.5 2.1 1.5 3.3 0 1.1 1.5 2.1 1.5 3.2 0 1.1 1.5 2.1 1.5 3.3 0"/><path d="M12 11V8"/><circle cx="12" cy="6" r="1.6"/>',
  divulgacao: '<path d="M3 10v4l11 5V5L3 10z"/><path d="M17 9a3.5 3.5 0 0 1 0 6"/><path d="M6 15l1.5 5h3l-1.2-4"/>',
  rotina: '<path d="M10 6h10M10 12h10M10 18h10"/><path d="m3.5 6 1.5 1.5L8 4.5M3.5 12l1.5 1.5L8 10.5M3.5 18l1.5 1.5L8 16.5"/>',
  resultados: '<path d="M4 20V11M10 20V5M16 20v-6M2 20h20"/>',
  ajustes: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  mais: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
  fornada: '<rect x="3.5" y="4.5" width="17" height="15.5" rx="3"/><path d="M3.5 9.5h17"/><rect x="7" y="12.5" width="10" height="4.5" rx="1.5"/><path d="M7 7h.01M10 7h.01"/>',
  coracao: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>',
  ideias: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.1V16h5v-.1c0-.8.4-1.6 1.1-2.1A6 6 0 0 0 12 3z"/>',
  foto: '<rect x="3" y="5" width="18" height="15" rx="3"/><circle cx="12" cy="12.5" r="3.5"/><path d="M8 5l1.5-2h5L16 5"/>',
  mais_sinal: '<path d="M12 5v14M5 12h14"/>',
  zap: '<path d="M20 11.6a8.2 8.2 0 0 1-12.1 7.2L3.5 20l1.3-4.2A8.2 8.2 0 1 1 20 11.6z"/><path d="M9 8.6c.3 2.9 2.6 5.3 5.6 5.8l1-1.2-1.8-1-1 .8a4.6 4.6 0 0 1-2-2l.8-1-1-1.8z"/>',
  busca: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  copiar: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  calendario: '<rect x="4" y="5.5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v5M16 3v5M12 13v5M9.5 15.5h5"/>',
  imprimir: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
  editar: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  baixar: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  insta: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6" fill="currentColor"/>',
  voltar: '<path d="M15 5l-7 7 7 7"/>',
  sino: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  colar: '<path d="M9 4h6v3H9z"/><path d="M15 5.5h3V21H6V5.5h3"/><path d="M12 10v7M9 14l3 3 3-3"/>'
};
const ic = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ""}</svg>`;

/* ---------------- dados ---------------- */
const STATUS = [
  { id: "novo", nome: "Novo" },
  { id: "confirmado", nome: "Confirmado" },
  { id: "producao", nome: "Em produção" },
  { id: "pronto", nome: "Pronto" },
  { id: "entregue", nome: "Entregue" }
];
const nomeStatus = (id) => id === "cancelado" ? "Cancelado" : (STATUS.find((s) => s.id === id) || {}).nome || id;
const ORIGENS = ["Site", "Instagram", "WhatsApp", "Indicação", "Página de pedidos", "Feira/evento", "Vizinho/trabalho", "Outro"];

function padrao() {
  return {
    versao: 1,
    config: {
      nome: CFG.nome, dona: "", whatsapp: CFG.whatsapp, instagram: CFG.instagram, pix: "", cidade: CFG.cidade || "",
      antecedencia: CFG.antecedenciaPadraoDias, producaoDiasAntes: 1, metaMensal: 3000, taxaEntrega: 5,
      sinal: CFG.sinalPercentual, fidelidadeMeta: 10, diasSumido: 30, linkPedidos: "",
      validade: { Brownies: 5, Cookies: 7, Bolos: 3, Kits: 3 }, ultimoBackup: null, avisoNotificado: null
    },
    fornada: F.config(CFG.fornada),
    produtos: clone(CFG.cardapio).map((p) => ({ naFornada: true, limite: null, ...p })),
    clientes: [], pedidos: [], lembretes: [],
    rotina: { semana: "", feitos: {} },
    conteudo: { feitos: {} },
    dispensados: {},
    proximoNumero: 1
  };
}

let S = carregar();
function carregar() {
  try {
    const raw = localStorage.getItem(CHAVE);
    if (!raw) return null;
    const d = JSON.parse(raw); const p = padrao();
    d.config = { ...p.config, ...d.config, validade: { ...p.config.validade, ...(d.config || {}).validade } };
    for (const k of Object.keys(p)) if (d[k] === undefined) d[k] = p[k];
    d.fornada = F.config(d.fornada);
    for (const base of CFG.cardapio) { const pr = (d.produtos || []).find((x) => x.id === base.id); if (pr && !pr.foto && base.foto) pr.foto = base.foto; }
    for (const p of d.pedidos || []) if (p.data && p.data.length > 10) p.data = p.data.slice(0, 10); // datas vindas do banco com hora
    return d;
  } catch (e) { console.error(e); return null; }
}
function salvar(semConquista) {
  try { localStorage.setItem(CHAVE, JSON.stringify(S)); }
  catch (e) { toast("Não consegui salvar! Faça um backup agora."); console.error(e); }
  if (window.DPSync) DPSync.marcar();
  if (!semConquista && window.DPInterativo) DPInterativo.depoisSalvar();
}

const cliente = (id) => S.clientes.find((c) => c.id === id);
const pedido = (id) => S.pedidos.find((p) => p.id === id);
const produto = (id) => S.produtos.find((p) => p.id === id);
const categorias = () => [...new Set(S.produtos.map((p) => p.categoria))];

const subtotal = (p) => p.itens.reduce((s, i) => s + i.qtd * i.preco, 0);
const total = (p) => Math.max(0, subtotal(p) + (p.taxa || 0) - (p.desconto || 0));
const saldo = (p) => Math.max(0, total(p) - (p.pago || 0));
const custo = (p) => p.itens.reduce((s, i) => s + i.qtd * (i.custo ?? (produto(i.produtoId) || {}).custo ?? 0), 0);
const situacaoPg = (p) => p.pago >= total(p) - 0.009 ? "pago" : p.pago > 0 ? "sinal" : "pendente";
const nomePg = { pago: "Pago", sinal: "Sinal pago", pendente: "A receber" };
const ativo = (p) => p.status !== "entregue" && p.status !== "cancelado";
const resumoItens = (p) => p.itens.map((i) => `${i.qtd}× ${i.nome}`).join(", ");
const diaProducao = (p) => addDias(p.data, -(S.config.producaoDiasAntes || 0));

/* ---------------- fornada ---------------- */
// pedidos de quarta a sábado pertencem à fornada da terça daquela semana
const fornadaDe = (data) => { const dow = parse(data).getDay(); return dow >= 3 && dow <= 6 ? addDias(data, 2 - dow) : null; };
const pedidosDaFornada = (sem) => S.pedidos.filter((p) => p.status !== "cancelado" && fornadaDe(p.data) === sem);
const situFornada = () => { const j = F.janela(S.fornada); return F.situacao(S.fornada, pedidosDaFornada(j.semana).length); };
/** o que o site público mostra (publicado na nuvem) */
function vitrine() {
  const sem = F.janela(S.fornada).semana; const manuais = pedidosDaFornada(sem).filter((p) => !p.siteId);
  const itens = {}; manuais.forEach((p) => p.itens.forEach((i) => { if (i.produtoId) itens[i.produtoId] = (itens[i.produtoId] || 0) + i.qtd; }));
  return {
    loja: { nome: S.config.nome, instagram: S.config.instagram, whatsapp: telefone(S.config.whatsapp) },
    fornada: { ...S.fornada, manuais: { semana: sem, pedidos: manuais.length, itens } },
    itens: S.produtos.filter((p) => p.ativo !== false && p.naFornada !== false)
      .map(({ id, nome, descricao, categoria, preco, limite, tags, foto }) => ({ id, nome, descricao, categoria, preco, limite: Number(limite) > 0 ? Number(limite) : null, tags: tags || [], foto: foto && !foto.startsWith("data:") ? foto : null }))
  };
}
/** pedidos que chegaram pelo site → viram pedidos do painel */
function importarSite(lista) {
  const ok = []; let novos = 0;
  for (const r0 of lista) {
    const r = { ...r0, entrega_dia: String(r0.entrega_dia).slice(0, 10), semana: String(r0.semana).slice(0, 10) };
    const id = "site-" + r.id; ok.push(r.id);
    if (S.pedidos.some((p) => p.id === id)) continue;
    const fone = String(r.telefone || "").replace(/\D/g, "");
    let c = S.clientes.find((x) => x.telefone && telefone(x.telefone) === telefone(fone)) || S.clientes.find((x) => normal(x.nome) === normal(r.nome));
    if (!c) { c = { id: uid(), nome: r.nome, telefone: fone, instagram: "", aniversario: "", endereco: r.endereco || "", origem: "Site", obs: "", criadoEm: r.criado_em, brindesUsados: 0 }; S.clientes.push(c); }
    else if (!c.telefone) c.telefone = fone;
    const dia = F.diasEntrega(S.fornada, r.semana).find((d) => d.data === r.entrega_dia);
    const itens = (r.itens || []).map((i) => { const pr = produto(i.id); return { produtoId: pr ? pr.id : null, nome: i.nome, preco: Number(i.preco), custo: pr ? pr.custo || 0 : 0, categoria: i.categoria || (pr && pr.categoria) || "Outros", qtd: Number(i.qtd) }; });
    const sub = itens.reduce((s, i) => s + i.qtd * i.preco, 0);
    S.pedidos.push({ id, siteId: r.id, numero: S.proximoNumero++, clienteId: c.id, itens, data: r.entrega_dia, hora: dia && dia.noite ? dia.hora : "",
      tipo: r.recebimento, endereco: r.endereco || "", taxa: Math.max(0, Number(r.total) - sub), desconto: 0, pago: 0, forma: "Pix",
      origem: r.origem ? `Site · ${r.origem}` : "Site", obs: r.obs || "", status: "novo", criadoEm: r.criado_em || new Date().toISOString(), atualizadoEm: new Date().toISOString() });
    novos++;
  }
  if (novos) {
    salvar(); M.confete(); toast(`ebaa! ${novos} ${novos === 1 ? "pedido novo" : "pedidos novos"} pelo site 🎉`);
    if (!form && !$("#folha.aberta")) render();
    if ("Notification" in window && Notification.permission === "granted") navigator.serviceWorker?.getRegistration().then((reg) => reg && reg.showNotification("Pedido novo pelo site! 🎉", { body: `${novos} pedido(s) na fornada`, icon: "assets/icon-192.png", tag: "site" }));
  }
  return ok;
}

function pedidosDoCliente(cid) { return S.pedidos.filter((p) => p.clienteId === cid && p.status !== "cancelado").sort((a, b) => b.data.localeCompare(a.data)); }
function statsCliente(c) {
  const ps = pedidosDoCliente(c.id);
  const entregues = ps.filter((p) => p.status === "entregue");
  const meta = S.config.fidelidadeMeta || 10;
  const ganhos = Math.floor(entregues.length / meta);
  return {
    pedidos: ps.length, gasto: ps.reduce((s, p) => s + total(p), 0),
    ultimo: ps[0] ? ps[0].data : null, entregues: entregues.length,
    selos: entregues.length % meta, meta, brindes: Math.max(0, ganhos - (c.brindesUsados || 0))
  };
}

/* ---------------- WhatsApp ---------------- */
function telefone(t) {
  let d = String(t || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("0")) d = d.replace(/^0+/, "");
  if (d.length <= 11) d = "55" + d;
  return d;
}
function linkZap(fone, texto) {
  const f = telefone(fone);
  return `https://wa.me/${f}?text=${encodeURIComponent(texto)}`;
}
function preencher(modelo, v) { return modelo.replace(/\{(\w+)\}/g, (m, k) => (v[k] !== undefined ? v[k] : m)); }
function linkPedidos() {
  if (S.config.linkPedidos) return S.config.linkPedidos;
  return location.href.split("#")[0].replace(/painel\.html$/, "");
}

function mensagem(tipo, p, c) {
  c = c || (p && cliente(p.clienteId)) || {};
  const cf = S.config; const st = c.id ? statsCliente(c) : { selos: 0, meta: cf.fidelidadeMeta };
  const v = { nome: primeiroNome(c.nome), insta: cf.instagram || "docepedaco", selos: st.selos, meta: st.meta, pix: cf.pix || "(chave Pix)" };
  if (p) {
    const sinalValor = Math.round(total(p) * (cf.sinal || 50)) / 100;
    Object.assign(v, {
      numero: p.numero,
      itens: p.itens.map((i) => `• ${i.qtd}× ${i.nome} — ${brl(i.qtd * i.preco)}`).join("\n") + (p.taxa ? `\n• Entrega — ${brl(p.taxa)}` : "") + (p.desconto ? `\n• Desconto — -${brl(p.desconto)}` : ""),
      quando: `${p.tipo === "entrega" ? "Entrega" : "Retirada"}: ${DSEM_LONGO[parse(p.data).getDay()]}, ${fmtDataCurta(p.data)}${p.hora ? " às " + p.hora : ""}${p.tipo === "entrega" && p.endereco ? "\n📍 " + p.endereco : ""}`,
      total: brl(total(p)), saldo: brl(saldo(p)),
      linkPagamento: "",
      linhaPagamento: situacaoPg(p) === "pago" ? "✅ Pagamento recebido, obrigada!\n" :
        p.pago > 0 ? `✅ Sinal de ${brl(p.pago)} recebido. Falta ${brl(saldo(p))} na ${p.tipo === "entrega" ? "entrega" : "retirada"}.\n` :
        cf.pix ? `Para reservar, o sinal de ${brl(sinalValor)} pode ser feito pelo Pix:\n🔑 ${cf.pix}\n` : "",
      linhaEntrega: p.tipo === "entrega" ? "Já já sai para entrega 🛵" : `Pode vir buscar${p.hora ? " a partir das " + p.hora : ""} 💗`,
      linhaSaldo: saldo(p) > 0 ? `\nFica faltando ${brl(saldo(p))}${cf.pix ? ` (Pix: ${cf.pix})` : ""}.` : "",
      linhaPix: cf.pix ? `Pix: ${cf.pix}` : ""
    });
  }
  return preencher(TXT.mensagens[tipo], v).replace(/\n{3,}/g, "\n\n").trim();
}
function abrirZap(fone, texto) {
  if (!telefone(fone)) { toast("Cliente sem telefone. Escolha o contato no WhatsApp."); }
  window.open(linkZap(fone, texto), "_blank", "noopener");
}

/* ---------------- lembretes automáticos ---------------- */
function lembretes() {
  const L = []; const h = hoje(); const cf = S.config;
  const add = (o) => { if (!S.dispensados[o.chave]) L.push(o); };
  for (const p of S.pedidos) {
    if (p.status === "cancelado") continue;
    const c = cliente(p.clienteId) || {}; const nome = c.nome || "Cliente";
    if (p.status === "novo")
      add({ chave: `conf:${p.id}`, data: p.criadoEm.slice(0, 10) < h ? h : p.criadoEm.slice(0, 10), ico: "💌", urgente: difDias(h, p.data) <= 2,
        titulo: `Confirmar pedido #${p.numero} · ${nome}`, detalhe: `${resumoItens(p)} · para ${relativo(p.data)}`, pedido: p.id,
        acoes: [{ t: "zap", m: "confirmacao", r: "Enviar confirmação" }, { t: "status", s: "confirmado", r: "Confirmado" }] });
    if (p.status === "novo" || p.status === "confirmado")
      add({ chave: `prod:${p.id}`, data: diaProducao(p), ico: "👩‍🍳",
        titulo: `Produzir #${p.numero} · ${nome}`, detalhe: resumoItens(p), pedido: p.id,
        acoes: [{ t: "status", s: "producao", r: "Comecei a produzir" }] });
    if (ativo(p))
      add({ chave: `ent:${p.id}`, data: p.data, ico: p.tipo === "entrega" ? "🛵" : "🛍️",
        titulo: `${p.tipo === "entrega" ? "Entregar" : "Retirada"} #${p.numero} · ${nome}${p.hora ? " · " + p.hora : ""}`,
        detalhe: p.tipo === "entrega" && p.endereco ? p.endereco : resumoItens(p), pedido: p.id,
        acoes: [{ t: "zap", m: p.tipo === "entrega" ? "saiu" : "pronto", r: p.tipo === "entrega" ? "Avisar que saiu" : "Avisar que está pronto" }, { t: "status", s: "entregue", r: "Entregue" }] });
    if (saldo(p) > 0 && (ativo(p) || p.status === "entregue"))
      add({ chave: `cob:${p.id}:${p.pago}`, data: p.status === "entregue" && p.data < h ? h : p.data, ico: "💰", urgente: p.data < h,
        titulo: `Receber ${brl(saldo(p))} · ${nome}`, detalhe: `Pedido #${p.numero} · ${nomePg[situacaoPg(p)]}`, pedido: p.id,
        acoes: [{ t: "zap", m: "cobranca", r: "Lembrar cliente" }, { t: "pago", r: "Recebi" }] });
    if (p.status === "entregue" && difDias(p.data, h) >= 1 && difDias(p.data, h) <= 7)
      add({ chave: `pos:${p.id}`, data: addDias(p.data, 1), ico: "📸",
        titulo: `Pedir avaliação · ${nome}`, detalhe: `Pedido #${p.numero}: peça foto ou marcação nos stories`, pedido: p.id,
        acoes: [{ t: "zap", m: "posvenda", r: "Pedir avaliação" }, { t: "ok", r: "Feito" }] });
  }
  for (const c of S.clientes) {
    if (c.aniversario) {
      const [, m, d] = c.aniversario.split("-");
      let dt = `${h.slice(0, 4)}-${m}-${d}`;
      if (difDias(h, dt) < -1) dt = `${Number(h.slice(0, 4)) + 1}-${m}-${d}`;
      const falta = difDias(h, dt);
      if (falta >= -1 && falta <= 7)
        add({ chave: `niver:${c.id}:${dt.slice(0, 4)}`, data: dt, ico: "🎂", cliente: c.id,
          titulo: `Aniversário de ${c.nome}`, detalhe: falta === 0 ? "É hoje! Mande os parabéns com o cupom." : `Em ${fmtData(dt)}`,
          acoes: [{ t: "zapc", m: "aniversario", r: "Mandar parabéns" }, { t: "ok", r: "Feito" }] });
    }
    const st = statsCliente(c);
    if (st.ultimo && !S.pedidos.some((p) => p.clienteId === c.id && ativo(p)) && difDias(st.ultimo, h) >= (cf.diasSumido || 30))
      add({ chave: `sum:${c.id}:${st.ultimo}`, data: h, ico: "🌷", cliente: c.id,
        titulo: `Chamar de volta: ${c.nome}`, detalhe: `Último pedido há ${difDias(st.ultimo, h)} dias`,
        acoes: [{ t: "zapc", m: "reativacao", r: "Mandar mensagem" }, { t: "ok", r: "Feito" }] });
    if (st.brindes > 0)
      add({ chave: `brinde:${c.id}:${st.entregues}`, data: h, ico: "🎁", cliente: c.id,
        titulo: `${c.nome} ganhou um brinde!`, detalhe: `Completou ${st.meta} pedidos no cartão fidelidade`,
        acoes: [{ t: "zapc", m: "brinde", r: "Avisar cliente" }, { t: "ok", r: "Avisei" }] });
  }
  { const j = F.janela(S.fornada); const vesp = addDias(j.semana, -1);
    if (h === vesp || h === j.semana)
      add({ chave: `fornada-${h === j.semana ? "abriu" : "cardapio"}:${j.semana}`, data: h, ico: "🧁", titulo: h === j.semana ? "Hoje é dia de pedidos! ♡" : "Amanhã abre a fornada",
        detalhe: h === j.semana ? "Posta nos stories que a fornada abriu (o link da bio já está pronto)" : "Escolhe o que vai ter no cardápio dessa semana",
        acoes: [{ t: "ir", h: h === j.semana ? "#divulgacao" : "#fornada", r: h === j.semana ? "Ideias de story" : "Montar o cardápio" }, { t: "ok", r: "Feito" }] }); }
  if (S.pedidos.length && (!cf.ultimoBackup || difDias(cf.ultimoBackup.slice(0, 10), h) >= 7))
    add({ chave: `backup:${segundaDaSemana(h)}`, data: h, ico: "💾",
      titulo: "Fazer o backup da semana", detalhe: "Seus dados ficam só neste aparelho. Guarde uma cópia.",
      acoes: [{ t: "backup", r: "Baixar backup" }] });
  for (const l of S.lembretes) if (!l.feito)
    L.push({ chave: `man:${l.id}`, manual: l.id, data: l.data, ico: "📝", titulo: l.texto, detalhe: l.hora ? `às ${l.hora}` : "", acoes: [] });
  return L.sort((a, b) => a.data.localeCompare(b.data) || (b.urgente ? 1 : 0) - (a.urgente ? 1 : 0));
}

/* ---------------- interface base ---------------- */
let rascunho = null; // pedido em preparo (ex.: colado do WhatsApp)
const tela = $("#tela");

function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2600);
}
function abrirFolha(html) {
  $("#folha").innerHTML = html; $("#folha").classList.add("aberta"); $("#folha-fundo").classList.add("aberta");
  const f = $("#folha input:not([type=hidden]), #folha textarea"); if (f && matchMedia("(min-width: 900px)").matches) f.focus();
}
function fecharFolha() { $("#folha").classList.remove("aberta"); $("#folha-fundo").classList.remove("aberta"); }
function confirmar(msg, rotulo, fn) {
  abrirFolha(`<h2>${esc(msg)}</h2><p class="muted">Isso não pode ser desfeito.</p>
    <div class="acoes" style="margin-top:16px"><button class="btn perigo" id="sim">${esc(rotulo)}</button><button class="btn borda" data-acao="fechar">Voltar</button></div>`);
  $("#sim").onclick = () => { fecharFolha(); fn(); };
}
async function copiar(texto) {
  try { await navigator.clipboard.writeText(texto); toast("Copiado! 💗"); }
  catch { const t = document.createElement("textarea"); t.value = texto; document.body.append(t); t.select(); document.execCommand("copy"); t.remove(); toast("Copiado! 💗"); }
}
function baixar(nome, conteudo, tipo) {
  const url = URL.createObjectURL(conteudo instanceof Blob ? conteudo : new Blob([conteudo], { type: tipo }));
  const a = document.createElement("a"); a.href = url; a.download = nome; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const MENU = [
  ["inicio", "Início"], ["fornada", "Fornada"], ["pedidos", "Pedidos"], ["agenda", "Agenda"], ["clientes", "Clientes"], ["cardapio", "Cardápio"], ["ideias", "Ideias"],
  ["-"], ["divulgacao", "Divulgação"], ["rotina", "Rotina"], ["resultados", "Resultados"], ["ajustes", "Ajustes"]
];
const MAIS = [["agenda", "Agenda"], ["clientes", "Clientes"], ["cardapio", "Cardápio"], ["ideias", "Ideias"], ["divulgacao", "Divulgação"], ["rotina", "Rotina"], ["resultados", "Resultados"], ["ajustes", "Ajustes"]];
function desenharMenus(rota) {
  const pend = S ? lembretes().filter((l) => l.data <= hoje()).length : 0;
  const novos = S ? S.pedidos.filter((p) => p.status === "novo").length : 0;
  const badge = (id) => id === "agenda" && pend ? `<span class="badge">${pend}</span>` : id === "pedidos" && novos ? `<span class="badge" title="pedidos novos">${novos}</span>` : "";
  $("#menu-lateral").innerHTML = MENU.map(([id, nome]) => id === "-" ? "<hr>" :
    `<a href="#${id}" class="${rota === id ? "ativo" : ""}">${ic(id)}${nome}${badge(id)}</a>`).join("") +
    `<hr><a href="#novo-pedido" class="${rota === "novo-pedido" ? "ativo" : ""}">${ic("mais_sinal")}Novo pedido</a>`;
  const b = (id, nome) => `<a href="#${id}" class="${rota === id ? "ativo" : ""}">${ic(id)}${nome}${badge(id)}</a>`;
  $("#barra").innerHTML = b("inicio", "Início") + b("pedidos", "Pedidos") +
    `<a href="#novo-pedido" aria-label="Novo pedido"><span class="mais-btn">${ic("mais_sinal")}</span></a>` +
    b("fornada", "Fornada") + `<button data-acao="menu-mais" class="${MAIS.some(([id]) => id === rota) ? "ativo" : ""}">${ic("mais")}Mais${pend ? `<span class="badge">${pend}</span>` : ""}</button>`;
}

/* ---------------- roteador ---------------- */
const TELAS = {};
function render() {
  const [rota, arg] = (location.hash.slice(1) || "inicio").split("/");
  document.body.classList.toggle("sem-app", !S);
  if (!S) { $(".topo").classList.add("hidden"); $("#barra").classList.add("hidden"); $(".lateral").classList.add("hidden"); tela.innerHTML = telaBoasVindas(); return; }
  $(".topo").classList.remove("hidden"); $("#barra").classList.remove("hidden"); $(".lateral").classList.remove("hidden");
  const fn = TELAS[rota] || TELAS.inicio;
  tela.innerHTML = fn(arg ? decodeURIComponent(arg) : undefined);
  desenharMenus(rota === "pedido" ? "pedidos" : rota === "cliente" ? "clientes" : rota);
  if (TELAS[rota] && TELAS[rota].montar) TELAS[rota].montar(arg);
  if (window.DPInterativo) DPInterativo.depoisRender(rota);
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", () => { fecharFolha(); render(); });

/* ---------------- boas-vindas ---------------- */
function telaBoasVindas() {
  return `<div class="boas-vindas card costura">
    <div class="logo"><img src="assets/logo.svg" alt=""><span class="l-doce">doce</span><span class="l-pedaco">pedaço</span></div>
    <span class="script">seu caderninho ♡</span>
    <p>Aqui ficam seus pedidos, suas clientes, a fornada da semana e tudo que precisa lembrar. Feito com carinho pra você.</p>
    <div class="campo" style="margin-top:18px"><label for="bv-nome">Como você quer ser chamada?</label><input id="bv-nome" placeholder="seu nome ♡" autocomplete="given-name"></div>
    <div class="grade">
      <button class="btn rosa" data-acao="comecar">Começar meu caderninho</button>
      <button class="btn borda" data-acao="exemplos">Espiar com dados de exemplo</button>
      ${window.DPSync && DPSync.configurado() ? `<button class="btn" data-acao="entrar">☁️ Já uso em outro aparelho: entrar</button>` : ""}
    </div>
    <p class="small muted" style="margin-top:16px">Dá pra apagar os exemplos depois, em Ajustes.</p>
  </div>`;
}

/* ---------------- INÍCIO ---------------- */
const BILHETES = [
  "Um pedido de cada vez. Você está indo muito bem ♡", "Respira, bebe uma água e confia na sua fornada 💧",
  "Cada docinho que sai daqui leva um pedacinho de você ✨", "Descansar também faz parte do trabalho 🌙",
  "Suas clientes amam o que você faz. Que orgulho! 🥹", "Foto bonita vende mais: a luz da janela é sua melhor amiga 📸",
  "Pequenos passos, todo dia. É assim que um sonho cresce 🍰", "Hoje é um ótimo dia pra pedir uma avaliação 💌",
  "Você não precisa dar conta de tudo hoje. Só do próximo passo ♡", "Seu capricho aparece em cada etiqueta 🎀"
];
function cartaoFornada() {
  const s = situFornada(); const f = S.fornada; const ped = pedidosDaFornada(s.semana); const h = hoje(); const lim = f.limite || 0;
  const rot = { aberto: ["pedidos", "abertos", `fecha em ${F.falta(s.fecha)}`], antes: ["abre em", F.falta(s.abre), `terça, ${fmtDataCurta(s.semana)}`],
    pausado: ["pedidos", "pausados", "reabre sozinho na próxima terça"], esgotado: ["fornada", "lotada!", "todas as vagas preenchidas 🎉"] }[s.estado];
  const dias = [[0, "ter", "ped"], [1, "qua", f.estenderQuarta ? "ped" : f.entregaQuartaNoite ? "ent" : ""], [2, "qui", "ent"], [3, "sex", f.entregaSexta ? "ent" : ""], [4, "sáb", f.entregaSabado ? "ent" : ""]];
  return `<section class="fornada-card fita" aria-label="Fornada da semana">
    <button class="estado-selo ${s.estado}" data-acao="${s.estado === "pausado" ? "retomar" : s.estado === "antes" ? "ir-fornada" : "pausar"}"
      title="${s.estado === "pausado" ? "Reabrir pedidos" : s.estado === "antes" ? "Ajustar a fornada" : "Pausar pedidos"}">
      <span class="mao">${rot[0]}</span><b>${rot[1]}</b><small>${rot[2]}</small></button>
    <div class="fornada-info">
      <h2>Fornada <em>nº ${F.numero(s.semana)}</em></h2>
      ${lim ? `<div class="vagas" aria-hidden="true">${Array.from({ length: Math.min(lim, 60) }, (_, i) => `<i class="${i < ped.length ? "on" : ""}"></i>`).join("")}</div>` : ""}
      <p class="small muted" style="margin:${lim ? 0 : "10px 0 0"}"><b style="color:var(--chocolate)">${ped.length} ${ped.length === 1 ? "pedido" : "pedidos"}</b>${lim ? ` de ${lim} · ${Math.max(0, lim - ped.length)} ${lim - ped.length === 1 ? "vaga" : "vagas"}` : " · sem limite"}</p>
      <div class="linha-tempo">${dias.map(([k, d, c]) => `<div class="${c} ${addDias(s.semana, k) === h ? "hoje" : ""}"><b>${d}</b>${fmtDataCurta(addDias(s.semana, k))}</div>`).join("")}</div>
      <div class="acoes">
        ${s.estado === "pausado" ? `<button class="btn mini menta" data-acao="retomar">▶ reabrir pedidos</button>` : `<button class="btn mini lavanda" data-acao="pausar">❚❚ pausar pedidos</button>`}
        <a class="btn mini claro" href="#fornada">ajustar a fornada</a>
        <a class="btn mini borda" href="index.html" target="_blank" rel="noopener">ver o site</a>
      </div>
    </div>
  </section>`;
}
TELAS.inicio = () => {
  const h = hoje(); const d = new Date(); const hr = d.getHours();
  const saud = hr < 5 ? "boa noite" : hr < 12 ? "bom dia" : hr < 18 ? "boa tarde" : "boa noite";
  const nome = S.config.dona ? primeiroNome(S.config.dona) : "";
  const L = lembretes();
  const atrasados = L.filter((l) => l.data < h); const deHoje = L.filter((l) => l.data === h);
  const entregasHoje = S.pedidos.filter((p) => ativo(p) && p.data === h);
  const prox = S.pedidos.filter((p) => ativo(p) && p.data > h && difDias(h, p.data) <= 7).sort((a, b) => (a.data + (a.hora || "")).localeCompare(b.data + (b.hora || "")));
  const mes = h.slice(0, 7);
  const doMes = S.pedidos.filter((p) => p.status !== "cancelado" && p.data.startsWith(mes));
  const fat = doMes.reduce((s, p) => s + total(p), 0);
  const aReceber = S.pedidos.filter((p) => p.status !== "cancelado").reduce((s, p) => s + saldo(p), 0);
  const meta = S.config.metaMensal || 0; const pct = meta ? Math.min(100, Math.round(fat / meta * 100)) : 0;
  const bilhete = BILHETES[(d.getDate() * 7 + d.getMonth()) % BILHETES.length];
  const dataTxt = `${DSEM_LONGO[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`;

  return `
  <div class="oi">
    <div><span class="mao">${saud}${nome ? ", " + esc(nome) : ""}! ♡</span><h1>${dataTxt[0].toUpperCase() + dataTxt.slice(1)}</h1></div>
    <div class="postit"><small>bilhetinho do dia</small><span class="mao">${esc(bilhete)}</span></div>
  </div>
  ${cartaoFornada()}
  <div class="numeros">
    <div class="numero"><span>pra hoje</span><strong>${entregasHoje.length}</strong><small>${entregasHoje.length === 1 ? "entrega" : "entregas"}</small></div>
    <div class="numero"><span>próximos 7 dias</span><strong>${prox.length}</strong><small>pedidos</small></div>
    <div class="numero"><span>a receber</span><strong>${brl(aReceber)}</strong><small>em aberto</small></div>
    <div class="numero"><span>vendas do mês</span><strong>${brl(fat)}</strong><small>${meta ? pct + "% da meta" : ""}</small></div>
  </div>
  ${meta ? `<div class="meta-trilho" title="Meta do mês"><i style="width:${pct}%"></i></div><p class="small muted" style="margin:0">Meta de ${MESES[d.getMonth()]}: ${brl(meta)} · ${fat >= meta ? "bateu a meta!! 🎉" : "faltam " + brl(meta - fat)}</p>` : ""}

  <div class="grade g2 secao">
    <div class="card">
      <div class="card-titulo"><h2>Pra fazer hoje</h2><a class="btn mini claro" href="#agenda">agenda</a></div>
      ${atrasados.length + deHoje.length ? listaTarefas([...atrasados, ...deHoje]) : `<div class="vazio"><span class="desenho">${M.desenho("coracao")}</span><span class="mao">tudo em dia!</span>Aproveita pra descansar um pouquinho ♡</div>`}
    </div>
    <div class="card">
      <div class="card-titulo"><h2>Próximas entregas</h2><a class="btn mini claro" href="#pedidos">ver todos</a></div>
      ${[...entregasHoje, ...prox].length ? `<div class="lista">${[...entregasHoje, ...prox].slice(0, 6).map(itemPedido).join("")}</div>` :
        `<div class="vazio"><span class="desenho">${M.desenho("cookie")}</span><span class="mao">agenda livre</span>Que tal postar o cardápio da fornada?<br><br><a class="btn mini rosa" href="#divulgacao">ideias de post</a></div>`}
    </div>
  </div>`;
};

function listaTarefas(L, comData) {
  const h = hoje();
  return L.map((l) => {
    const atras = l.data < h;
    const acoes = l.acoes.map((a, i) => `<button class="btn mini ${a.t.startsWith("zap") ? "zap" : a.t === "ok" ? "borda" : "claro"}" data-acao="tarefa" data-chave="${esc(l.chave)}" data-i="${i}">${a.t.startsWith("zap") ? ic("zap") : ""}${esc(a.r)}</button>`).join("");
    return `<div class="tarefa ${atras || l.urgente ? "urgente" : ""}">
      ${l.manual ? `<button class="check" data-acao="lembrete-feito" data-id="${l.manual}" aria-label="Marcar como feito">✓</button>` : `<div class="tarefa-ico">${l.ico}</div>`}
      <div class="tarefa-corpo">
        <strong>${esc(l.titulo)}</strong>
        <p>${atras ? `<b style="color:var(--vermelho)">Atrasado (${fmtData(l.data)})</b> · ` : comData ? `${relativo(l.data)} · ` : ""}${esc(l.detalhe)}</p>
        ${acoes || l.pedido ? `<div class="tarefa-acoes">${acoes}${l.pedido ? `<a class="btn mini borda" href="#pedido/${l.pedido}">Abrir</a>` : ""}${l.cliente ? `<a class="btn mini borda" href="#cliente/${l.cliente}">Ver cliente</a>` : ""}</div>` : ""}
      </div>
    </div>`;
  }).join("");
}

function itemPedido(p) {
  const c = cliente(p.clienteId) || {}; const h = hoje();
  const cls = p.data === h && ativo(p) ? "hoje" : p.data < h && ativo(p) ? "atrasado" : "";
  const d = parse(p.data);
  return `<a class="item" href="#pedido/${p.id}">
    <div class="data-bloco ${cls}"><small>${DSEM[d.getDay()]}</small><b>${z2(d.getDate())}</b><small>${MESES[d.getMonth()].slice(0, 3)}</small></div>
    <div class="item-corpo"><strong>#${p.numero} · ${esc(c.nome || "Cliente")}</strong><div class="linha2">${p.hora ? p.hora + " · " : ""}${esc(resumoItens(p))}</div></div>
    <div class="item-lado"><strong>${brl(total(p))}</strong><span class="tag st-${p.status}">${nomeStatus(p.status)}</span></div>
  </a>`;
}

/* ---------------- PEDIDOS ---------------- */
let filtroPedidos = "ativos"; let buscaPedidos = "";
TELAS.pedidos = () => {
  const F = [["ativos", "Em andamento"], ["hoje", "Hoje"], ["semana", "7 dias"], ["receber", "A receber"], ["entregues", "Entregues"], ["todos", "Todos"]];
  return `
  <div class="cabecalho"><div><h1>Pedidos</h1><p class="muted">${S.pedidos.filter(ativo).length} em andamento</p></div>
    <div class="acoes"><button class="btn borda" data-acao="colar-pedido">${ic("colar")}Colar do WhatsApp</button><a class="btn rosa" href="#novo-pedido">${ic("mais_sinal")}Novo</a></div></div>
  <div class="busca">${ic("busca")}<input id="busca-pedidos" placeholder="Buscar por cliente, número ou produto" value="${esc(buscaPedidos)}"></div>
  <div class="chips" style="margin-bottom:14px">${F.map(([id, n]) => `<button class="chip ${filtroPedidos === id ? "ativo" : ""}" data-acao="filtro-pedidos" data-f="${id}">${n}</button>`).join("")}</div>
  <div class="lista" id="lista-pedidos"></div>`;
};
TELAS.pedidos.montar = () => {
  const desenhar = () => {
    const h = hoje(); const b = normal(buscaPedidos);
    let L = S.pedidos.filter((p) => {
      switch (filtroPedidos) {
        case "ativos": return ativo(p);
        case "hoje": return p.data === h && p.status !== "cancelado";
        case "semana": return p.data >= h && difDias(h, p.data) <= 7 && p.status !== "cancelado";
        case "receber": return saldo(p) > 0 && p.status !== "cancelado";
        case "entregues": return p.status === "entregue";
        default: return true;
      }
    });
    if (b) L = L.filter((p) => normal(`${p.numero} ${(cliente(p.clienteId) || {}).nome} ${resumoItens(p)}`).includes(b));
    const desc = ["entregues", "todos"].includes(filtroPedidos);
    L.sort((a, b2) => (a.data + (a.hora || "")).localeCompare(b2.data + (b2.hora || "")) * (desc ? -1 : 1));
    $("#lista-pedidos").innerHTML = L.length ? L.map(itemPedido).join("") : `<div class="vazio card"><span class="script">nada por aqui</span>Nenhum pedido neste filtro.</div>`;
  };
  $("#busca-pedidos").oninput = (e) => { buscaPedidos = e.target.value; desenhar(); };
  desenhar();
};

/* ---------------- DETALHE DO PEDIDO ---------------- */
TELAS.pedido = (id) => {
  const p = pedido(id); if (!p) return `<div class="vazio">Pedido não encontrado. <a href="#pedidos">Voltar</a></div>`;
  const c = cliente(p.clienteId) || {}; const idx = STATUS.findIndex((s) => s.id === p.status);
  const prox = STATUS[idx + 1]; const pg = situacaoPg(p);
  const msgs = [["confirmacao", "Confirmação"], ["pronto", "Está pronto"]];
  if (p.tipo === "entrega") msgs.push(["saiu", "Saiu para entrega"]);
  if (saldo(p) > 0) msgs.push(["cobranca", "Cobrar saldo"]);
  if (p.status === "entregue") msgs.push(["posvenda", "Pedir avaliação"]);
  return `
  <div class="cabecalho">
    <div><a href="#pedidos" class="small" style="text-decoration:none">${"‹"} Pedidos</a><h1>Pedido #${p.numero}</h1>
      <p class="muted">Feito em ${fmtData(p.criadoEm.slice(0, 10))}${p.origem ? " · via " + esc(p.origem) : ""}</p></div>
    <div class="acoes"><span class="tag st-${p.status}">${nomeStatus(p.status)}</span><span class="tag pg-${pg}">${nomePg[pg]}</span></div>
  </div>
  <div class="grade g2">
    <div class="card costura">
      ${p.status !== "cancelado" ? `<div class="passos">${STATUS.map((s, i) => `<div class="${i <= idx ? "on" : ""}" title="${s.nome}"></div>`).join("")}</div>` : ""}
      <div class="chips" style="margin-bottom:14px">${STATUS.map((s) => `<button class="chip ${p.status === s.id ? "ativo" : ""}" data-acao="status" data-id="${p.id}" data-s="${s.id}">${s.nome}</button>`).join("")}</div>
      ${prox && p.status !== "cancelado" ? `<button class="btn rosa" style="width:100%" data-acao="status" data-id="${p.id}" data-s="${prox.id}">Avançar para: ${prox.nome} →</button>` : ""}
      <table class="itens-pedido" style="margin-top:14px">
        ${p.itens.map((i) => `<tr><td>${i.qtd}× ${esc(i.nome)}</td><td>${brl(i.qtd * i.preco)}</td></tr>`).join("")}
        ${p.taxa ? `<tr><td>Taxa de entrega</td><td>${brl(p.taxa)}</td></tr>` : ""}
        ${p.desconto ? `<tr><td>Desconto</td><td>−${brl(p.desconto)}</td></tr>` : ""}
        <tr class="total"><td>Total</td><td>${brl(total(p))}</td></tr>
        <tr><td class="muted">Recebido${p.forma ? " (" + esc(p.forma) + ")" : ""}</td><td>${brl(p.pago)}</td></tr>
        ${saldo(p) > 0 ? `<tr><td><b style="color:var(--vermelho)">Falta receber</b></td><td><b style="color:var(--vermelho)">${brl(saldo(p))}</b></td></tr>` : ""}
      </table>
      ${saldo(p) > 0 ? `<button class="btn claro" style="margin-top:12px;width:100%" data-acao="pagamento" data-id="${p.id}">💰 Registrar pagamento</button>` : ""}
    </div>
    <div class="grade">
      <div class="card">
        <div class="card-titulo"><h2>${esc(c.nome || "Cliente")}</h2><a class="btn mini claro" href="#cliente/${c.id}">Ver cliente</a></div>
        <div class="info-linha"><span>${p.tipo === "entrega" ? "Entrega" : "Retirada"}</span><span><b>${relativo(p.data)}</b>${p.hora ? " às " + p.hora : ""}${Math.abs(difDias(hoje(), p.data)) <= 1 ? ` (${fmtDataCurta(p.data)})` : ""}</span></div>
        ${p.tipo === "entrega" ? `<div class="info-linha"><span>Endereço</span><span>${esc(p.endereco || "—")}${p.endereco ? ` · <a href="https://maps.google.com/?q=${encodeURIComponent(p.endereco)}" target="_blank" rel="noopener">mapa</a>` : ""}</span></div>` : ""}
        <div class="info-linha"><span>Produzir em</span><span>${fmtData(diaProducao(p))}</span></div>
        ${c.telefone ? `<div class="info-linha"><span>Telefone</span><span>${esc(c.telefone)}</span></div>` : ""}
        ${p.obs ? `<div class="info-linha"><span>Observações</span><span>${esc(p.obs)}</span></div>` : ""}
        ${c.obs ? `<div class="info-linha"><span>Sobre a cliente</span><span>${esc(c.obs)}</span></div>` : ""}
      </div>
      <div class="card">
        <h3 style="margin-bottom:10px">Mensagens prontas</h3>
        <div class="acoes">${msgs.map(([m, r]) => `<button class="btn mini zap" data-acao="zap-pedido" data-id="${p.id}" data-m="${m}">${ic("zap")}${r}</button>`).join("")}</div>
        <h3 style="margin:16px 0 10px">Ferramentas</h3>
        <div class="acoes">
          <button class="btn mini claro" data-acao="ics-pedido" data-id="${p.id}">${ic("calendario")}Pôr no calendário</button>
          <button class="btn mini claro" data-acao="etiquetas" data-id="${p.id}">${ic("imprimir")}Etiquetas</button>
          <a class="btn mini claro" href="#editar-pedido/${p.id}">${ic("editar")}Editar</a>
          <button class="btn mini claro" data-acao="repetir" data-id="${p.id}">Repetir pedido</button>
          ${p.status !== "cancelado" ? `<button class="btn mini perigo" data-acao="cancelar" data-id="${p.id}">Cancelar</button>` : `<button class="btn mini claro" data-acao="status" data-id="${p.id}" data-s="confirmado">Reativar</button>`}
          <button class="btn mini perigo" data-acao="excluir-pedido" data-id="${p.id}">Excluir</button>
        </div>
      </div>
    </div>
  </div>`;
};

/* ---------------- FORMULÁRIO DE PEDIDO ---------------- */
let form = null;
function diasParaPedido() {
  const j = F.janela(S.fornada); const h = hoje(); const vistos = new Set();
  return [addDias(j.semana, -7), j.semana].flatMap((sem) => F.diasEntrega(S.fornada, sem))
    .filter((d) => d.data >= h && !vistos.has(d.data) && vistos.add(d.data));
}
function novoForm(base) {
  const cf = S.config; const dias = diasParaPedido();
  return {
    id: null, clienteNome: "", telefone: "", qtd: {}, extras: [],
    data: (dias.find((d) => !d.noite) || dias[0] || {}).data || addDias(hoje(), cf.antecedencia || 0), hora: "", tipo: "retirada", endereco: "", taxa: 0, desconto: 0,
    pago: 0, forma: "Pix", origem: "WhatsApp", obs: "", status: "novo", ...base
  };
}
function formDePedido(p) {
  const c = cliente(p.clienteId) || {}; const qtd = {}; const extras = [];
  for (const i of p.itens) { if (i.produtoId && produto(i.produtoId)) qtd[i.produtoId] = (qtd[i.produtoId] || 0) + i.qtd; else extras.push({ nome: i.nome, preco: i.preco, qtd: i.qtd }); }
  return novoForm({ id: p.id, clienteNome: c.nome || "", telefone: c.telefone || "", qtd, extras, data: p.data, hora: p.hora || "", tipo: p.tipo,
    endereco: p.endereco || "", taxa: p.taxa || 0, desconto: p.desconto || 0, pago: p.pago || 0, forma: p.forma || "Pix", origem: p.origem || "", obs: p.obs || "", status: p.status });
}
function telaForm(titulo) {
  const f = form; const cf = S.config;
  const prods = S.produtos.filter((p) => p.ativo !== false || f.qtd[p.id]);
  const cats = [...new Set(prods.map((p) => p.categoria))];
  const pouca = difDias(hoje(), f.data) < (cf.antecedencia || 0);
  return `
  <div class="cabecalho"><div><a href="${f.id ? "#pedido/" + f.id : "#pedidos"}" class="small" style="text-decoration:none">‹ Voltar</a><h1>${titulo}</h1></div></div>
  <form id="form-pedido" class="grade g2" autocomplete="off">
    <div class="grade" style="align-content:start">
      <div class="card">
        <h2 style="margin-bottom:12px">Cliente</h2>
        <div class="campo"><label for="f-cliente">Nome</label><input id="f-cliente" list="dl-clientes" required value="${esc(f.clienteNome)}" placeholder="Digite para buscar ou cadastrar">
          <datalist id="dl-clientes">${S.clientes.map((c) => `<option value="${esc(c.nome)}">`).join("")}</datalist></div>
        <div class="campo"><label for="f-tel">WhatsApp</label><input id="f-tel" type="tel" inputmode="tel" value="${esc(f.telefone)}" placeholder="(51) 99999-9999"></div>
        <p class="small muted" id="f-cliente-info" style="margin:-4px 0 0"></p>
      </div>
      <div class="card">
        <h2 style="margin-bottom:12px">Entrega</h2>
        <div class="chips" style="margin-bottom:12px">
          <button type="button" class="chip ${f.tipo === "retirada" ? "ativo" : ""}" data-tipo="retirada">🛍️ Retirada</button>
          <button type="button" class="chip ${f.tipo === "entrega" ? "ativo" : ""}" data-tipo="entrega">🛵 Entrega</button>
        </div>
        <div class="chips" style="margin-bottom:12px" id="f-dias">${(() => { const ds = diasParaPedido(); const outra = !ds.some((d) => d.data === f.data);
          return ds.map((d) => `<button type="button" class="chip ${d.data === f.data ? "ativo" : ""}" data-dia="${d.data}" data-hora="${d.noite ? d.hora : ""}">${d.rotulo} ${fmtDataCurta(d.data)}</button>`).join("") +
            `<button type="button" class="chip ${outra ? "ativo" : ""}" data-dia="outra">outra data</button>`; })()}</div>
        <div class="linha-campos">
          <div class="campo" id="f-campo-data" ${diasParaPedido().some((d) => d.data === f.data) ? 'style="display:none"' : ""}><label for="f-data">Data (encomenda)</label><input id="f-data" type="date" required value="${f.data}"></div>
          <div class="campo"><label for="f-hora">Horário (opcional)</label><input id="f-hora" type="time" value="${f.hora}"></div>
        </div>
        <p class="small" id="f-aviso-data" style="margin:-4px 0 10px;color:var(--ambar)">${pouca ? `⚠️ Menos de ${cf.antecedencia} dias de antecedência: confira se dá tempo.` : ""}</p>
        <div id="f-bloco-entrega" class="${f.tipo === "entrega" ? "" : "hidden"}">
          <div class="campo"><label for="f-end">Endereço</label><input id="f-end" value="${esc(f.endereco)}" placeholder="Rua, número, bairro"></div>
          <div class="campo"><label for="f-taxa">Taxa de entrega (R$)</label><input id="f-taxa" inputmode="decimal" value="${f.taxa || ""}"></div>
        </div>
      </div>
      <div class="card">
        <h2 style="margin-bottom:12px">Pagamento e detalhes</h2>
        <div class="linha-campos">
          <div class="campo"><label for="f-pago">Já recebido (R$)</label><input id="f-pago" inputmode="decimal" value="${f.pago || ""}" placeholder="0"></div>
          <div class="campo"><label for="f-forma">Forma</label><select id="f-forma">${["Pix", "Dinheiro", "Cartão", "Outro"].map((o) => `<option ${f.forma === o ? "selected" : ""}>${o}</option>`).join("")}</select></div>
        </div>
        <div class="linha-campos">
          <div class="campo"><label for="f-desc">Desconto (R$)</label><input id="f-desc" inputmode="decimal" value="${f.desconto || ""}" placeholder="0"></div>
          <div class="campo"><label for="f-origem">Veio por</label><select id="f-origem">${ORIGENS.map((o) => `<option ${f.origem === o ? "selected" : ""}>${o}</option>`).join("")}</select></div>
        </div>
        ${f.id ? `<div class="campo"><label for="f-status">Status</label><select id="f-status">${[...STATUS, { id: "cancelado", nome: "Cancelado" }].map((s) => `<option value="${s.id}" ${f.status === s.id ? "selected" : ""}>${s.nome}</option>`).join("")}</select></div>` : ""}
        <div class="campo"><label for="f-obs">Observações</label><textarea id="f-obs" placeholder="Sabor, mensagem no cartão, alergias...">${esc(f.obs)}</textarea></div>
      </div>
    </div>
    <div class="card" style="align-self:start">
      <h2>O que vai no pedido</h2>
      ${cats.map((cat) => `<div class="prod-cat">${esc(cat)}</div>` + prods.filter((p) => p.categoria === cat).map((p) => `
        <div class="prod-linha"><span class="mini-desenho">${M.desenhoDoProduto(p)}</span><div class="nome">${esc(p.nome)}<small>${brl(p.preco)}${p.naFornada === false ? " · fora da fornada" : ""}</small></div>
          <div class="passo-qtd"><button type="button" data-menos="${p.id}" aria-label="Menos">−</button><output id="q-${p.id}">${f.qtd[p.id] || 0}</output><button type="button" data-mais="${p.id}" aria-label="Mais">+</button></div></div>`).join("")).join("")}
      <div class="prod-cat">Personalizado</div>
      <div id="extras">${f.extras.map((e, i) => `
        <div class="linha-campos" style="grid-template-columns:2fr 1fr 70px auto;align-items:end">
          <div class="campo"><label>Item</label><input data-ex="${i}" data-k="nome" value="${esc(e.nome)}" placeholder="Ex.: Bolo de aniversário 2 kg"></div>
          <div class="campo"><label>Preço un.</label><input data-ex="${i}" data-k="preco" inputmode="decimal" value="${e.preco || ""}"></div>
          <div class="campo"><label>Qtd</label><input data-ex="${i}" data-k="qtd" inputmode="numeric" value="${e.qtd}"></div>
          <div class="campo"><button type="button" class="btn mini perigo" data-rem-ex="${i}" aria-label="Remover">✕</button></div>
        </div>`).join("")}</div>
      <button type="button" class="btn mini claro" id="add-extra">+ Item personalizado</button>
      <div class="resumo-total"><div><small>Total</small><br><strong id="f-total">R$ 0,00</strong></div><button class="btn rosa" type="submit">${f.id ? "Salvar" : "Salvar pedido"}</button></div>
    </div>
  </form>`;
}
function montarForm() {
  const f = form; const fe = $("#form-pedido");
  const ler = () => {
    f.clienteNome = $("#f-cliente").value.trim(); f.telefone = $("#f-tel").value.trim();
    f.data = $("#f-data").value; f.hora = $("#f-hora").value; f.endereco = $("#f-end").value.trim();
    f.taxa = numCampo($("#f-taxa").value); f.pago = numCampo($("#f-pago").value); f.forma = $("#f-forma").value;
    f.desconto = numCampo($("#f-desc").value); f.origem = $("#f-origem").value; f.obs = $("#f-obs").value.trim();
    if ($("#f-status")) f.status = $("#f-status").value;
  };
  const itens = () => [
    ...Object.entries(f.qtd).filter(([, q]) => q > 0).map(([id, q]) => { const p = produto(id); return { produtoId: id, nome: p.nome, preco: p.preco, custo: p.custo || 0, categoria: p.categoria, qtd: q }; }),
    ...f.extras.filter((e) => e.nome && e.qtd > 0).map((e) => ({ produtoId: null, nome: e.nome, preco: numCampo(e.preco), custo: 0, categoria: "Personalizado", qtd: Math.max(1, Math.round(numCampo(e.qtd))) }))
  ];
  const atualizarTotal = () => {
    ler(); const t = itens().reduce((s, i) => s + i.qtd * i.preco, 0) + (f.tipo === "entrega" ? f.taxa : 0) - f.desconto;
    $("#f-total").textContent = brl(Math.max(0, t));
    const pouca = f.data && !fornadaDe(f.data) && difDias(hoje(), f.data) < (S.config.antecedencia || 0);
    $("#f-aviso-data").textContent = pouca ? `⚠️ Menos de ${S.config.antecedencia} dias de antecedência: confira se dá tempo.` : "";
    const n = normal(f.clienteNome); const c = S.clientes.find((x) => normal(x.nome) === n);
    $("#f-cliente-info").innerHTML = !n ? "" : c ? `💗 Cliente cadastrada · ${statsCliente(c).pedidos} pedido(s)` : "✨ Cliente nova: vai ser cadastrada ao salvar";
  };
  $("#f-cliente").addEventListener("input", () => {
    const c = S.clientes.find((x) => normal(x.nome) === normal($("#f-cliente").value));
    if (c) { if (!$("#f-tel").value) $("#f-tel").value = c.telefone || ""; if (!$("#f-end").value && c.endereco) $("#f-end").value = c.endereco; }
  });
  fe.addEventListener("input", (e) => {
    if (e.target.dataset.ex !== undefined) f.extras[e.target.dataset.ex][e.target.dataset.k] = e.target.dataset.k === "nome" ? e.target.value : e.target.value;
    atualizarTotal();
  });
  fe.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.mais || b.dataset.menos) {
      const id = b.dataset.mais || b.dataset.menos; f.qtd[id] = Math.max(0, (f.qtd[id] || 0) + (b.dataset.mais ? 1 : -1));
      $("#q-" + CSS.escape(id)).textContent = f.qtd[id]; atualizarTotal();
    } else if (b.dataset.dia) {
      $$("[data-dia]").forEach((x) => x.classList.toggle("ativo", x === b));
      const outra = b.dataset.dia === "outra"; $("#f-campo-data").style.display = outra ? "" : "none";
      if (outra) $("#f-data").focus(); else { $("#f-data").value = b.dataset.dia; if (b.dataset.hora && !$("#f-hora").value) $("#f-hora").value = b.dataset.hora; }
      atualizarTotal();
    } else if (b.dataset.tipo) {
      f.tipo = b.dataset.tipo; $$("[data-tipo]").forEach((x) => x.classList.toggle("ativo", x === b));
      $("#f-bloco-entrega").classList.toggle("hidden", f.tipo !== "entrega");
      if (f.tipo === "entrega" && !$("#f-taxa").value && S.config.taxaEntrega) $("#f-taxa").value = S.config.taxaEntrega;
      atualizarTotal();
    } else if (b.id === "add-extra") { ler(); f.extras.push({ nome: "", preco: "", qtd: 1 }); render(); $$("[data-k=nome]").pop()?.focus(); }
    else if (b.dataset.remEx !== undefined) { ler(); f.extras.splice(+b.dataset.remEx, 1); render(); }
  });
  fe.addEventListener("submit", (e) => {
    e.preventDefault(); ler();
    const its = itens();
    if (!f.clienteNome) return toast("Coloque o nome da cliente");
    if (!its.length) return toast("Escolha pelo menos um item");
    if (!f.data) return toast("Escolha a data");
    let c = S.clientes.find((x) => normal(x.nome) === normal(f.clienteNome));
    if (!c) { c = { id: uid(), nome: f.clienteNome, telefone: f.telefone, instagram: "", aniversario: "", endereco: f.tipo === "entrega" ? f.endereco : "", origem: f.origem, obs: "", criadoEm: new Date().toISOString(), brindesUsados: 0 }; S.clientes.push(c); }
    else { if (f.telefone) c.telefone = f.telefone; if (f.tipo === "entrega" && f.endereco && !c.endereco) c.endereco = f.endereco; }
    const dados = { clienteId: c.id, itens: its, data: f.data, hora: f.hora, tipo: f.tipo, endereco: f.tipo === "entrega" ? f.endereco : "",
      taxa: f.tipo === "entrega" ? f.taxa : 0, desconto: f.desconto, pago: f.pago, forma: f.forma, origem: f.origem, obs: f.obs, atualizadoEm: new Date().toISOString() };
    let p;
    if (f.id) { p = pedido(f.id); Object.assign(p, dados, { status: f.status }); toast("Pedido atualizado 💗"); }
    else { p = { id: uid(), numero: S.proximoNumero++, status: "novo", criadoEm: new Date().toISOString(), ...dados }; S.pedidos.push(p); toast(`ebaa! pedido #${p.numero} anotado 🎉 agora é só confirmar`); M.confete(50); }
    salvar(); form = null; rascunho = null; location.hash = "#pedido/" + p.id;
  });
  atualizarTotal();
}
TELAS["novo-pedido"] = (arg) => {
  if (!form || form.id) {
    form = novoForm(rascunho || {});
    if (form.tipo === "entrega" && !form.taxa) form.taxa = S.config.taxaEntrega || 0;
    if (arg) { const c = cliente(arg); if (c) { form.clienteNome = c.nome; form.telefone = c.telefone || ""; form.endereco = c.endereco || ""; } }
  }
  return telaForm(rascunho ? "Pedido colado do WhatsApp" : "Novo pedido");
};
TELAS["novo-pedido"].montar = montarForm;
TELAS["editar-pedido"] = (id) => {
  const p = pedido(id); if (!p) return `<div class="vazio">Pedido não encontrado.</div>`;
  if (!form || form.id !== id) form = formDePedido(p);
  return telaForm(`Editar pedido #${p.numero}`);
};
TELAS["editar-pedido"].montar = montarForm;
window.addEventListener("hashchange", () => { const r = location.hash.slice(1).split("/")[0]; if (r !== "novo-pedido" && r !== "editar-pedido") form = null; });

/* colar pedido vindo da página pública */
function lerPedidoColado(txt) {
  const r = { qtd: {}, extras: [] };
  const nome = txt.match(/Nome:\s*\*?([^\n*]+)/i); if (nome) r.clienteNome = nome[1].trim();
  const tel = txt.match(/(?:Telefone|WhatsApp):\s*([\d ()+-]{8,})/i); if (tel) r.telefone = tel[1].trim();
  const dt = txt.match(/Data[^:\n]*:\s*\*?(?:[a-zç-]+,?\s*)?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/i);
  if (dt) { let y = dt[3] ? +dt[3] : new Date().getFullYear(); if (y < 100) y += 2000; r.data = `${y}-${z2(dt[2])}-${z2(dt[1])}`; if (!dt[3] && r.data < hoje()) r.data = `${y + 1}-${z2(dt[2])}-${z2(dt[1])}`; }
  const hr = txt.match(/Hor[aá]rio[^:\n]*:\s*\*?(\d{1,2})(?:[:h](\d{2}))?/i); if (hr) r.hora = `${z2(hr[1])}:${hr[2] || "00"}`;
  if (/Receber[^:\n]*:\s*\*?[^\n]*entrega/i.test(txt) || /🛵/.test(txt)) r.tipo = "entrega"; else r.tipo = "retirada";
  const end = txt.match(/Endere[cç]o:\s*([^\n]+)/i); if (end) r.endereco = end[1].replace(/\*/g, "").trim();
  const obs = txt.match(/Obs[^:\n]*:\s*([^\n]+)/i); if (obs) r.obs = obs[1].replace(/\*/g, "").trim();
  const re = /^\s*[•\-*]?\s*(\d+)\s*[x×]\s*(.+?)\s*[—–-]+\s*R\$\s*([\d.,]+)/gim; let m;
  while ((m = re.exec(txt))) {
    const q = +m[1]; const nomeP = m[2].replace(/\*/g, "").trim(); const tot = num(m[3]);
    const p = S.produtos.find((x) => normal(x.nome) === normal(nomeP));
    if (p) r.qtd[p.id] = (r.qtd[p.id] || 0) + q; else r.extras.push({ nome: nomeP, preco: Math.round(tot / q * 100) / 100, qtd: q });
  }
  r.origem = "Página de pedidos";
  return r;
}

/* ---------------- AGENDA ---------------- */
let abaAgenda = "tarefas";
TELAS.agenda = () => {
  const L = lembretes(); const h = hoje();
  const grupos = [["Atrasados", (l) => l.data < h], ["Hoje", (l) => l.data === h], ["Amanhã", (l) => difDias(h, l.data) === 1],
    ["Próximos 7 dias", (l) => difDias(h, l.data) > 1 && difDias(h, l.data) <= 7], ["Mais pra frente", (l) => difDias(h, l.data) > 7]];
  const tarefas = grupos.map(([n, fn]) => { const g = L.filter(fn); return g.length ? `<div class="card secao"><h2 style="margin-bottom:4px">${n} <span class="muted small">(${g.length})</span></h2>${listaTarefas(g, n !== "Hoje")}</div>` : ""; }).join("");

  // produção por dia (próximos 7 dias)
  const prod = {};
  for (const p of S.pedidos) if (["novo", "confirmado", "producao"].includes(p.status)) {
    const d = diaProducao(p) < h ? h : diaProducao(p); if (difDias(h, d) > 7) continue;
    prod[d] = prod[d] || {}; for (const i of p.itens) prod[d][i.nome] = (prod[d][i.nome] || 0) + i.qtd;
  }
  const producao = Object.keys(prod).sort().map((d) => `<div class="card secao"><h2 style="margin-bottom:8px">${relativo(d)[0].toUpperCase() + relativo(d).slice(1)} <span class="muted small">${fmtData(d)}</span></h2>
    <table class="itens-pedido">${Object.entries(prod[d]).sort((a, b) => b[1] - a[1]).map(([n, q]) => `<tr><td>${esc(n)}</td><td><b>${q}</b> un.</td></tr>`).join("")}</table></div>`).join("");

  return `
  <div class="cabecalho"><div><h1>Agenda</h1><p class="muted">Lembretes automáticos dos pedidos, clientes e da rotina</p></div>
    <div class="acoes"><button class="btn borda" data-acao="ics-todos">${ic("calendario")}Mandar p/ calendário</button><button class="btn rosa" data-acao="novo-lembrete">${ic("mais_sinal")}Lembrete</button></div></div>
  <div class="chips"><button class="chip ${abaAgenda === "tarefas" ? "ativo" : ""}" data-acao="aba-agenda" data-a="tarefas">Tarefas</button>
    <button class="chip ${abaAgenda === "producao" ? "ativo" : ""}" data-acao="aba-agenda" data-a="producao">Lista de produção</button></div>
  ${abaAgenda === "tarefas" ? (tarefas || `<div class="card vazio secao"><span class="script">tudo em dia!</span>Os lembretes aparecem aqui sozinhos quando entram pedidos.</div>`)
    : (producao ? `<p class="muted small" style="margin:12px 0 0">Quantidades somadas por dia de produção (1 dia antes da entrega; muda em Ajustes).</p>${producao}` : `<div class="card vazio secao"><span class="script">sem produção</span>Nada para produzir nos próximos 7 dias.</div>`)}`;
};

/* ---------------- FORNADA ---------------- */
function avisoPublicacao() {
  if (window.DPSync && DPSync.configurado() && DPSync.logado())
    return `<div class="postit" style="transform:rotate(-.6deg);margin-bottom:20px;background:var(--menta)"><span class="mao" style="color:#22573f">site ao vivo ♡</span><p class="small" style="margin:4px 0 0">Tudo que você muda aqui (cardápio, limite, pausa) aparece no site em poucos segundos, e os pedidos do site chegam sozinhos em Pedidos.</p></div>`;
  return `<div class="postit" style="transform:rotate(-.6deg);margin-bottom:20px"><span class="mao">psiu!</span><p class="small" style="margin:4px 0 8px">O site ainda está lendo o cardápio de um arquivo. Para o <b>limite</b>, a <b>pausa</b> e os <b>pedidos automáticos</b> funcionarem ao vivo, falta ligar a nuvem (é grátis, veja em Ajustes). Enquanto isso, os pedidos chegam pelo WhatsApp.</p>
    <button class="btn mini claro" data-acao="baixar-config">baixar arquivo do site atualizado</button></div>`;
}
TELAS.fornada = () => {
  const f = S.fornada; const s = situFornada(); const ped = pedidosDaFornada(s.semana);
  const vendidos = {}; ped.forEach((p) => p.itens.forEach((i) => { if (i.produtoId) vendidos[i.produtoId] = (vendidos[i.produtoId] || 0) + i.qtd; }));
  const naF = S.produtos.filter((p) => p.ativo !== false && p.naFornada !== false).length;
  const dias = F.diasEntrega(f, s.semana).map((d) => ({ ...d, n: ped.filter((p) => p.data === d.data).length }));
  const mx = Math.max(1, ...dias.map((d) => d.n));
  const tg = (k, txt, sub) => `<div class="regra"><div class="txt">${txt}${sub ? `<small>${sub}</small>` : ""}</div><label class="troca"><input type="checkbox" data-fornada="${k}" ${f[k] ? "checked" : ""}><i></i><span class="sr">${txt}</span></label></div>`;
  const sempre = (txt) => `<div class="regra"><div class="txt">${txt}</div><span class="tag st-entregue sem-ponto">sempre</span></div>`;
  const pausa = s.estado === "pausado" ? `<button class="btn menta" data-acao="retomar">▶ reabrir pedidos</button>` : `<button class="btn lavanda" data-acao="pausar">❚❚ pausar pedidos</button>`;
  return `
  <div class="cabecalho"><div><span class="mao">a fornada da semana</span><h1>Fornada nº ${F.numero(s.semana)}</h1>
    <p class="muted">Pedidos na terça, ${fmtDataCurta(s.semana)}${f.estenderQuarta ? ` (e quarta até ${f.fimQuarta})` : ""} · entregas ${dias.map((d) => d.curto).join(", ")}</p></div>
    <div class="acoes">${pausa}<a class="btn borda" href="index.html" target="_blank" rel="noopener">ver o site</a></div></div>
  ${avisoPublicacao()}
  <div class="grade g2">
    <div class="card fita" style="align-self:start">
      <div class="card-titulo"><h2>O que vai ter essa semana?</h2><span class="tag st-confirmado sem-ponto">${naF} no cardápio</span></div>
      <p class="small muted" style="margin-top:-4px">Liga o que entra nessa fornada. Se quiser, põe um limite de unidades (ex.: só 20 brownies). Vazio = sem limite.</p>
      ${categorias().map((c) => { const ps = S.produtos.filter((p) => p.categoria === c && p.ativo !== false); return ps.length ? `<div class="prod-cat">${esc(c)}</div>` + ps.map((p) => `
        <div class="escolha ${p.naFornada === false ? "fora" : ""}"><span class="mini-desenho">${M.desenhoDoProduto(p)}</span>
          <div class="nome"><b>${esc(p.nome)}</b><small>${brl(p.preco)}${vendidos[p.id] ? ` · <b style="color:var(--morango)">${vendidos[p.id]} vendidos</b>` : ""}</small></div>
          <div class="lim"><small>limite</small><input type="number" min="0" inputmode="numeric" data-lim="${p.id}" value="${p.limite || ""}" placeholder="∞" aria-label="Limite de ${esc(p.nome)}"></div>
          <label class="troca"><input type="checkbox" data-naf="${p.id}" ${p.naFornada !== false ? "checked" : ""}><i></i><span class="sr">${esc(p.nome)} na fornada</span></label></div>`).join("") : ""; }).join("")}
      <a class="btn mini claro" href="#cardapio" style="margin-top:14px">+ criar um doce novo</a>
    </div>
    <div class="grade" style="align-content:start">
      <div class="card fita menta">
        <h2 style="margin-bottom:4px">Limite de pedidos</h2>
        <div class="regra"><div class="txt">Pedidos por fornada<small>Quando chegar nesse número, o site fecha sozinho. Zero = sem limite.</small></div>
          <div class="contador"><button data-acao="limite" data-d="-1" aria-label="Diminuir">−</button><output>${f.limite || "∞"}</output><button data-acao="limite" data-d="1" aria-label="Aumentar">+</button></div></div>
        <div class="regra"><div class="txt">Pausar a fornada<small>Fecha os pedidos na hora, mesmo sobrando vaga. Na terça seguinte reabre sozinho.</small></div>
          ${s.estado === "pausado" ? `<button class="btn mini menta" data-acao="retomar">reabrir</button>` : `<button class="btn mini lavanda" data-acao="pausar">pausar</button>`}</div>
      </div>
      <div class="card fita baunilha">
        <h2 style="margin-bottom:4px">Quando recebe pedidos</h2>
        ${sempre("Terça-feira, o dia todinho")}
        ${tg("estenderQuarta", "Também na quarta de manhã", "Os pedidos continuam abertos até o horário abaixo")}
        ${f.estenderQuarta ? `<div class="regra"><div class="txt">Fecha na quarta às</div><input type="time" data-fornada-txt="fimQuarta" value="${f.fimQuarta}"></div>` : ""}
      </div>
      <div class="card fita lavanda">
        <h2 style="margin-bottom:4px">Quando entrega</h2>
        ${tg("entregaQuartaNoite", "Quarta à noite", "Pra quem quiser receber antes")}
        ${f.entregaQuartaNoite ? `<div class="regra"><div class="txt">A partir das</div><input type="time" data-fornada-txt="horaQuartaNoite" value="${f.horaQuartaNoite}"></div>` : ""}
        ${sempre("Quinta-feira")}${tg("entregaSexta", "Sexta-feira")}${tg("entregaSabado", "Sábado")}
        <h3 style="margin:16px 0 0">Como a cliente recebe</h3>
        ${tg("retirada", "Retira com você", "Vocês combinam o lugar pelo WhatsApp")}${tg("entrega", "Entrega em casa")}
        ${f.entrega ? `<div class="regra"><div class="txt">Taxa de entrega (R$)</div><input type="number" min="0" step="0.5" data-fornada-num="taxaEntrega" value="${f.taxaEntrega}"></div>` : ""}
      </div>
      <div class="card">
        <h2 style="margin-bottom:4px">Recadinho no site</h2>
        <p class="small muted">Aparece em destaque na página. Ex.: "essa semana tem brownie de Natal 🎄"</p>
        <div class="campo" style="margin:0"><textarea data-fornada-txt="recadinho" maxlength="200" placeholder="opcional">${esc(f.recadinho || "")}</textarea></div>
      </div>
      <div class="card">
        <h2 style="margin-bottom:12px">Pedidos por dia de entrega</h2>
        <div class="barras">${dias.map((d) => `<div class="barra-linha"><span>${d.rotulo} ${fmtDataCurta(d.data)}</span><div class="trilho"><i style="width:${d.n / mx * 100}%"></i></div><b>${d.n}</b></div>`).join("")}</div>
        <a class="btn mini claro" href="#agenda" style="margin-top:14px" data-acao="aba-agenda" data-a="producao">ver lista de produção</a>
      </div>
    </div>
  </div>`;
};
TELAS.fornada.montar = () => {
  const salvo = () => toast(window.DPSync && DPSync.logado() ? "salvo! o site já vai atualizar ♡" : "salvo ♡");
  tela.onchange = (e) => {
    if (!location.hash.startsWith("#fornada")) return;
    const el = e.target; const f = S.fornada;
    if (el.dataset.naf) { produto(el.dataset.naf).naFornada = el.checked; el.closest(".escolha").classList.toggle("fora", !el.checked); }
    else if (el.dataset.lim) { const v = parseInt(el.value); produto(el.dataset.lim).limite = v > 0 ? v : null; }
    else if (el.dataset.fornada) {
      f[el.dataset.fornada] = el.checked;
      if (!f.retirada && !f.entrega) { f[el.dataset.fornada === "retirada" ? "entrega" : "retirada"] = true; toast("Pelo menos uma forma de receber precisa ficar ligada ♡"); }
      salvar(); render(); return salvo();
    }
    else if (el.dataset.fornadaTxt) f[el.dataset.fornadaTxt] = el.value.trim();
    else if (el.dataset.fornadaNum) f[el.dataset.fornadaNum] = parseFloat(el.value) || 0;
    else return;
    salvar(); salvo();
  };
};

/* ---------------- CLIENTES ---------------- */
let buscaClientes = "";
TELAS.clientes = () => `
  <div class="cabecalho"><div><h1>Clientes</h1><p class="muted">${S.clientes.length} cadastradas</p></div><button class="btn rosa" data-acao="novo-cliente">${ic("mais_sinal")}Nova cliente</button></div>
  <div class="busca">${ic("busca")}<input id="busca-clientes" placeholder="Buscar por nome, telefone ou Instagram" value="${esc(buscaClientes)}"></div>
  <div class="lista" id="lista-clientes"></div>`;
TELAS.clientes.montar = () => {
  const desenhar = () => {
    const b = normal(buscaClientes);
    const L = S.clientes.filter((c) => !b || normal(`${c.nome} ${c.telefone} ${c.instagram}`).includes(b))
      .map((c) => ({ c, st: statsCliente(c) })).sort((a, b2) => (b2.st.ultimo || "").localeCompare(a.st.ultimo || "") || a.c.nome.localeCompare(b2.c.nome));
    $("#lista-clientes").innerHTML = L.length ? L.map(({ c, st }) => `<a class="item" href="#cliente/${c.id}">
      <div class="avatar ${corAvatar(c.nome)}">${esc(iniciais(c.nome))}</div>
      <div class="item-corpo"><strong>${esc(c.nome)}</strong><div class="linha2">${st.pedidos} pedido(s)${st.ultimo ? " · último " + relativo(st.ultimo) : ""}${c.instagram ? " · @" + esc(c.instagram) : ""}</div></div>
      <div class="item-lado"><strong>${brl(st.gasto)}</strong><span class="small muted">${st.brindes ? "🎁 brinde!" : `💗 ${st.selos}/${st.meta}`}</span></div></a>`).join("")
      : `<div class="vazio card"><span class="script">ninguém ainda</span>As clientes são cadastradas sozinhas quando você salva um pedido.</div>`;
  };
  $("#busca-clientes").oninput = (e) => { buscaClientes = e.target.value; desenhar(); };
  desenhar();
};
TELAS.cliente = (id) => {
  const c = cliente(id); if (!c) return `<div class="vazio">Cliente não encontrada. <a href="#clientes">Voltar</a></div>`;
  const st = statsCliente(c); const ps = pedidosDoCliente(c.id);
  const fav = {}; ps.forEach((p) => p.itens.forEach((i) => fav[i.nome] = (fav[i.nome] || 0) + i.qtd));
  const favorito = Object.entries(fav).sort((a, b) => b[1] - a[1])[0];
  return `
  <div class="cabecalho"><div style="display:flex;gap:14px;align-items:center"><div class="avatar ${corAvatar(c.nome)}" style="width:62px;height:62px;font-size:1.4rem">${esc(iniciais(c.nome))}</div>
    <div><a href="#clientes" class="small" style="text-decoration:none">‹ Clientes</a><h1>${esc(c.nome)}</h1><p class="muted">Cliente desde ${fmtDataCurta(c.criadoEm.slice(0, 10))}/${c.criadoEm.slice(2, 4)}${c.origem ? " · veio por " + esc(c.origem) : ""}</p></div></div>
    <div class="acoes"><button class="btn zap" data-acao="zap-cliente" data-id="${c.id}" data-m="livre">${ic("zap")}WhatsApp</button><a class="btn rosa" href="#novo-pedido/${c.id}">${ic("mais_sinal")}Pedido</a></div></div>
  <div class="numeros">
    <div class="numero"><span>Pedidos</span><strong>${st.pedidos}</strong></div>
    <div class="numero"><span>Total gasto</span><strong>${brl(st.gasto)}</strong></div>
    <div class="numero"><span>Último</span><strong style="font-size:1.15rem">${st.ultimo ? relativo(st.ultimo) : "—"}</strong></div>
    <div class="numero"><span>Favorito</span><strong style="font-size:1.05rem">${favorito ? esc(favorito[0]) : "—"}</strong></div>
  </div>
  <div class="grade g2 secao">
    <div class="grade" style="align-content:start">
      <div class="card costura">
        <div class="card-titulo"><h2>Cartão fidelidade</h2><span class="tag st-confirmado sem-ponto">${st.selos}/${st.meta}</span></div>
        <div class="selos">${Array.from({ length: st.meta }, (_, i) => `<span class="${i < st.selos ? "on" : ""}">${i < st.selos ? "♥" : i === st.meta - 1 ? "🎁" : ""}</span>`).join("")}</div>
        <p class="small muted" style="margin:10px 0 0">Cada pedido entregue vale 1 selo. No ${st.meta}º, o próximo docinho é presente.</p>
        ${st.brindes ? `<div class="acoes" style="margin-top:12px"><button class="btn mini zap" data-acao="zap-cliente" data-id="${c.id}" data-m="brinde">${ic("zap")}Avisar do brinde</button><button class="btn mini claro" data-acao="usar-brinde" data-id="${c.id}">Usou o brinde (${st.brindes})</button></div>` : ""}
      </div>
      <div class="card">
        <div class="card-titulo"><h2>Dados</h2><button class="btn mini claro" data-acao="editar-cliente" data-id="${c.id}">${ic("editar")}Editar</button></div>
        <div class="info-linha"><span>WhatsApp</span><span>${esc(c.telefone || "—")}</span></div>
        <div class="info-linha"><span>Instagram</span><span>${c.instagram ? `<a href="https://instagram.com/${esc(c.instagram)}" target="_blank" rel="noopener">@${esc(c.instagram)}</a>` : "—"}</span></div>
        <div class="info-linha"><span>Aniversário</span><span>${c.aniversario ? fmtDataCurta(c.aniversario) : "—"}</span></div>
        <div class="info-linha"><span>Endereço</span><span>${esc(c.endereco || "—")}</span></div>
        <div class="info-linha"><span>Observações</span><span>${esc(c.obs || "—")}</span></div>
      </div>
    </div>
    <div class="card" style="align-self:start"><h2 style="margin-bottom:12px">Histórico</h2>
      ${ps.length ? `<div class="lista">${ps.map(itemPedido).join("")}</div>` : `<div class="vazio">Nenhum pedido ainda.</div>`}
      <button class="btn mini perigo" style="margin-top:16px" data-acao="excluir-cliente" data-id="${c.id}">Excluir cliente</button>
    </div>
  </div>`;
};
function folhaCliente(c) {
  c = c || { nome: "", telefone: "", instagram: "", aniversario: "", endereco: "", origem: "Instagram", obs: "" };
  abrirFolha(`<h2 style="margin-bottom:14px">${c.id ? "Editar cliente" : "Nova cliente"}</h2>
  <form id="form-cliente" autocomplete="off">
    <div class="campo"><label>Nome</label><input name="nome" required value="${esc(c.nome)}"></div>
    <div class="linha-campos"><div class="campo"><label>WhatsApp</label><input name="telefone" type="tel" value="${esc(c.telefone)}"></div>
      <div class="campo"><label>Instagram (sem @)</label><input name="instagram" value="${esc(c.instagram)}"></div></div>
    <div class="linha-campos"><div class="campo"><label>Aniversário</label><input name="aniversario" type="date" value="${esc(c.aniversario)}"></div>
      <div class="campo"><label>Como conheceu</label><select name="origem">${ORIGENS.map((o) => `<option ${c.origem === o ? "selected" : ""}>${o}</option>`).join("")}</select></div></div>
    <div class="campo"><label>Endereço</label><input name="endereco" value="${esc(c.endereco)}"></div>
    <div class="campo"><label>Observações</label><textarea name="obs" placeholder="Alergias, preferências, quem indicou...">${esc(c.obs)}</textarea></div>
    <div class="acoes"><button class="btn rosa" type="submit">Salvar</button><button type="button" class="btn borda" data-acao="fechar">Cancelar</button></div>
  </form>`);
  $("#form-cliente").onsubmit = (e) => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); d.instagram = d.instagram.replace(/^@/, "").trim();
    d.atualizadoEm = new Date().toISOString();
    if (c.id) Object.assign(cliente(c.id), d); else { c = { id: uid(), criadoEm: new Date().toISOString(), brindesUsados: 0, ...d }; S.clientes.push(c); }
    salvar(); fecharFolha(); toast("Cliente salva 💗"); if (location.hash === "#cliente/" + c.id) render(); else location.hash = "#cliente/" + c.id;
  };
}

/* ---------------- CARDÁPIO ---------------- */
TELAS.cardapio = () => {
  const cats = categorias();
  return `
  <div class="cabecalho"><div><h1>Cardápio</h1><p class="muted">Preços, custos e margem de cada produto</p></div><button class="btn rosa" data-acao="novo-produto">${ic("mais_sinal")}Produto</button></div>
  ${cats.map((cat) => `<div class="card secao"><h2 style="margin-bottom:6px">${esc(cat)}</h2>
    ${S.produtos.filter((p) => p.categoria === cat).map((p) => { const mg = p.preco ? Math.round((p.preco - (p.custo || 0)) / p.preco * 100) : 0;
      return `<button class="tarefa" style="width:100%;background:none;border-left:0;border-right:0;border-top:0;text-align:left;cursor:pointer" data-acao="editar-produto" data-id="${p.id}">
        ${p.foto ? `<img class="mini-foto" src="${esc(p.foto)}" alt="">` : `<span class="mini-desenho" style="width:44px;height:44px">${M.desenhoDoProduto(p)}</span>`}
        <div class="tarefa-corpo"><strong class="${p.ativo === false ? "feito-texto" : ""}">${esc(p.nome)}</strong><p>${esc(p.descricao || "")}</p>${(p.tags || []).length ? `<div class="ideia-tags">${p.tags.map((t) => `<span class="selo-tag">${esc(t)}</span>`).join("")}</div>` : ""}</div>
        <div class="item-lado"><strong>${brl(p.preco)}</strong><span class="small ${mg < 50 ? "" : "muted"}" style="${mg < 50 ? "color:var(--ambar);font-weight:800" : ""}">custo ${brl(p.custo || 0)} · margem ${mg}%</span></div></button>`; }).join("")}
  </div>`).join("")}
  <p class="small muted secao">💡 Margem abaixo de 50% aparece em amarelo: vale revisar o preço. Produtos desativados não aparecem no formulário nem na página pública.</p>`;
};
function folhaProduto(p) {
  p = p || { nome: "", categoria: categorias()[0] || "Brownies", descricao: "", preco: "", custo: "", antecedencia: 1, ativo: true };
  abrirFolha(`<h2 style="margin-bottom:14px">${p.id ? "Editar produto" : "Novo produto"}</h2>
  <form id="form-produto" autocomplete="off">
    <div class="campo"><label>Nome</label><input name="nome" required value="${esc(p.nome)}"></div>
    <div class="campo"><label>Categoria</label><input name="categoria" list="dl-cats" required value="${esc(p.categoria)}"><datalist id="dl-cats">${categorias().map((c) => `<option value="${esc(c)}">`).join("")}</datalist></div>
    <div class="campo"><label>Descrição</label><input name="descricao" value="${esc(p.descricao)}"></div>
    <div class="campo"><label>Foto</label><div class="foto-campo">
      <span class="foto-prev" id="fp-prev">${p.foto ? `<img src="${esc(p.foto)}" alt="">` : M.desenhoDoProduto(p)}</span>
      <div class="acoes"><label class="btn mini claro" style="cursor:pointer">${ic("foto")}escolher foto<input type="file" accept="image/*" id="fp-arq" hidden></label>
      ${p.foto ? `<button type="button" class="btn mini borda" id="fp-tirar">tirar foto</button>` : ""}</div></div>
      <small class="muted">A foto é recortada quadradinha e ganha um ajuste de luz e cor ✨</small></div>
    <div class="campo"><label>Selos</label><div class="chips" id="fp-tags">${TAGS.map((t) => `<button type="button" class="chip ${(p.tags || []).includes(t) ? "ativo" : ""}" data-tag="${t}">${t}</button>`).join("")}</div></div>
    <div class="linha-campos"><div class="campo"><label>Preço de venda (R$)</label><input name="preco" inputmode="decimal" required value="${p.preco}"></div>
      <div class="campo"><label>Custo (R$)</label><input name="custo" inputmode="decimal" value="${p.custo}" placeholder="ingredientes + embalagem"></div></div>
    <div class="linha-campos"><div class="campo"><label>Antecedência (dias)</label><input name="antecedencia" type="number" min="0" value="${p.antecedencia}"></div>
      <div class="campo"><label>Disponível?</label><select name="ativo"><option value="1" ${p.ativo !== false ? "selected" : ""}>Sim</option><option value="0" ${p.ativo === false ? "selected" : ""}>Não (esconder)</option></select></div></div>
    <div class="acoes"><button class="btn rosa" type="submit">Salvar</button><button type="button" class="btn borda" data-acao="fechar">Cancelar</button>
      ${p.id ? `<button type="button" class="btn perigo" id="del-prod">Excluir</button>` : ""}</div>
  </form>`);
  let novaFoto = null, tirarFoto = false;
  $("#fp-tags").onclick = (e) => { const b = e.target.closest("[data-tag]"); if (b) b.classList.toggle("ativo"); };
  if ($("#fp-tirar")) $("#fp-tirar").onclick = () => { tirarFoto = true; novaFoto = null; $("#fp-prev").innerHTML = M.desenhoDoProduto(p); };
  $("#fp-arq").onchange = async (e) => {
    const arq = e.target.files[0]; if (!arq) return;
    try { novaFoto = await prepararFoto(arq); tirarFoto = false; $("#fp-prev").innerHTML = `<img src="${URL.createObjectURL(novaFoto)}" alt="">`; }
    catch { toast("Não consegui abrir essa foto. Tenta outra (JPG ou PNG) ♡"); }
  };
  $("#form-produto").onsubmit = async (e) => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(e.target));
    const btn = e.target.querySelector("[type=submit]"); btn.disabled = true; btn.textContent = "salvando…";
    let foto = tirarFoto ? null : p.foto || null;
    if (novaFoto) {
      try { foto = (window.DPSync && DPSync.logado()) ? await DPSync.subirFoto(novaFoto, `${p.id || "novo"}-${Date.now()}.${novaFoto.type.split("/")[1]}`) : await blobParaDataURL(novaFoto); }
      catch (x) { console.warn(x); foto = await blobParaDataURL(novaFoto); toast("Sem internet: a foto ficou só neste aparelho por enquanto"); }
    }
    const tags = $$("#fp-tags .ativo").map((b) => b.dataset.tag);
    const dados = { nome: d.nome.trim(), categoria: d.categoria.trim(), descricao: d.descricao.trim(), preco: numCampo(d.preco), custo: numCampo(d.custo), antecedencia: parseInt(d.antecedencia) || 0, ativo: d.ativo === "1", tags, foto };
    dados.atualizadoEm = new Date().toISOString();
    if (p.id) Object.assign(produto(p.id), dados); else S.produtos.push({ id: uid(), ...dados });
    salvar(); fecharFolha(); render(); toast("Cardápio atualizado 💗");
  };
  if (p.id) $("#del-prod").onclick = () => confirmar(`Excluir "${p.nome}"?`, "Excluir", () => { S.produtos = S.produtos.filter((x) => x.id !== p.id); salvar(); render(); });
}

/* ---------------- IDEIAS ---------------- */
let abaIdeias = "alta";
const ABAS_IDEIAS = [["alta", "✨ em alta"], ["doces", "🍰 doces"], ["biscoitos", "🍪 biscoitos"], ["salgados", "🥐 salgados"], ["veganos", "🌱 veganos"], ["light", "💚 light & low carb"]];
const jaTem = (i) => S.produtos.some((p) => p.id === "i-" + i.id || normal(p.nome) === normal(i.nome));
function cartaoIdeia(i) {
  const mg = i.preco ? Math.round((i.preco - i.custo) / i.preco * 100) : 0;
  return `<article class="ideia ${i.emAlta ? "alta" : ""}">
    ${i.emAlta ? '<span class="ideia-alta">em alta ✨</span>' : ""}
    <span class="mini-desenho">${M.desenhoDoProduto({ nome: i.nome, categoria: i.categoria })}</span>
    <div class="ideia-corpo">
      <h3>${esc(i.nome)}</h3>
      ${i.tags.length ? `<div class="ideia-tags">${i.tags.map((t) => `<span class="selo-tag">${esc(t)}</span>`).join("")}</div>` : ""}
      <p>${esc(i.descricao)}</p>
      <details class="dica"><summary>como fazer</summary><p>${esc(i.dica)}</p></details>
      <div class="ideia-numeros"><span><small>vender por</small><b>${brl(i.preco)}</b></span><span><small>custa ~</small><b>${brl(i.custo)}</b></span><span><small>margem</small><b>${mg}%</b></span><span><small>validade</small><b>${esc(i.validade)}</b></span><span><small>nível</small><b>${"●".repeat(i.dificuldade)}${"○".repeat(3 - i.dificuldade)}</b></span></div>
      ${jaTem(i) ? `<span class="btn mini menta" aria-disabled="true">✓ já está no seu cardápio</span>` : `<button class="btn mini rosa" data-acao="add-ideia" data-id="${esc(i.id)}">+ pôr no meu cardápio</button>`}
    </div>
  </article>`;
}
TELAS.ideias = () => {
  const lista = abaIdeias === "alta" ? IDEIAS.ideias.filter((i) => i.emAlta) : IDEIAS.ideias.filter((i) => i.aba === abaIdeias);
  const at = IDEIAS.atualizadoEm ? new Date(IDEIAS.atualizadoEm) : null;
  const diasSem = at ? Math.floor((Date.now() - at) / 864e5) : 99;
  const quando = !at ? "" : diasSem === 0 ? "hoje" : diasSem === 1 ? "ontem" : `há ${diasSem} dias (${fmtDataCurta(iso(at))})`;
  return `
  <div class="cabecalho"><div><span class="mao">ideias & tendências</span><h1>O que está em alta</h1>
    <p class="muted">Pesquisado na internet todo dia, com fontes${quando ? ` · atualizado ${quando}` : ""}</p></div></div>
  ${diasSem > 8 ? `<div class="postit" style="margin-bottom:18px;background:var(--lavanda);transform:none"><span class="mao" style="color:#4d3478">ops!</span><p class="small" style="margin:4px 0 0">As tendências não são atualizadas há ${diasSem} dias. Avisa quem cuida do sistema que a atualização automática parou ♡</p></div>` : ""}
  ${IDEIAS.resumo ? `<div class="postit" style="margin-bottom:22px;max-width:720px"><small style="display:block;font-weight:800;font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:#a08022">resumo da semana</small><span class="mao" style="font-size:1.4rem">${esc(IDEIAS.resumo)}</span></div>` : ""}
  <div class="chips" style="margin-bottom:18px">${ABAS_IDEIAS.map(([id, n]) => `<button class="chip ${abaIdeias === id ? "ativo" : ""}" data-acao="aba-ideias" data-a="${id}">${n}</button>`).join("")}</div>
  ${abaIdeias === "alta" && IDEIAS.emAlta.length ? `<div class="grade g2" style="margin-bottom:22px">${IDEIAS.emAlta.map((t, k) => `<div class="card fita ${["", "menta", "baunilha", "lavanda"][k % 4]}"><h3 style="margin-bottom:6px">${esc(t.titulo)}</h3><p class="small" style="margin:0;color:var(--chocolate-2)">${esc(t.texto)}</p>${t.fonte ? `<p class="small" style="margin:8px 0 0">fonte: ${t.fonte.url ? `<a href="${esc(t.fonte.url)}" target="_blank" rel="noopener">${esc(t.fonte.nome)}</a>` : esc(t.fonte.nome)}</p>` : ""}</div>`).join("")}</div>
    <h2 style="margin:6px 0 12px">Ideias pra testar</h2>` : ""}
  <div class="ideias">${lista.map(cartaoIdeia).join("") || `<div class="vazio card"><span class="mao">em breve</span>Nenhuma ideia nessa aba ainda.</div>`}</div>
  ${abaIdeias === "veganos" || abaIdeias === "light" || abaIdeias === "alta" ? `<div class="card secao"><h2 style="margin-bottom:6px">Cuidados importantes 💛</h2><ul class="cuidados">${(IDEIAS.cuidados || []).map((c) => `<li>${esc(c)}</li>`).join("")}</ul></div>` : ""}
  ${IDEIAS.fontes.length ? `<details class="dica secao"><summary>de onde vêm essas tendências</summary><ul>${IDEIAS.fontes.map((f) => `<li><a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.nome)}</a></li>`).join("")}</ul></details>` : ""}`;
};

/* fotos: recorta quadrado, ajusta luz/cor e comprime */
function prepararFoto(arq, lado = 900) {
  return new Promise((ok, erro) => {
    const img = new Image(); const url = URL.createObjectURL(arq);
    img.onload = () => {
      const m = Math.min(img.naturalWidth, img.naturalHeight); const cv = document.createElement("canvas"); cv.width = cv.height = Math.min(lado, m);
      const x = cv.getContext("2d"); x.filter = "brightness(1.05) contrast(1.06) saturate(1.12)";
      x.drawImage(img, (img.naturalWidth - m) / 2, (img.naturalHeight - m) / 2, m, m, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url);
      cv.toBlob((b) => (b && b.type === "image/webp") ? ok(b) : cv.toBlob((j) => (j ? ok(j) : erro()), "image/jpeg", .86), "image/webp", .84);
    };
    img.onerror = () => { URL.revokeObjectURL(url); erro(); }; img.src = url;
  });
}
const blobParaDataURL = (b) => new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(b); });

/* ---------------- DIVULGAÇÃO ---------------- */
TELAS.divulgacao = () => {
  const cf = S.config; const link = linkPedidos();
  const semanaIdx = Math.floor(difDias("2026-01-05", segundaDaSemana(hoje())) / 7) % 4;
  const sem = TXT.calendario[(semanaIdx + 4) % 4]; const chaveSem = segundaDaSemana(hoje());
  const vars = { link, antecedencia: cf.antecedencia, sinal: cf.sinal, insta: cf.instagram, hashtags: TXT.hashtags, alternativa: "outra data ou um kit pronto" };
  const T = (s) => preencher(s, vars);
  return `
  <div class="cabecalho"><div><h1>Divulgação</h1><p class="muted">Instagram, WhatsApp e ideias para conquistar clientes</p></div>
    ${cf.instagram ? `<a class="btn borda" href="https://instagram.com/${esc(cf.instagram)}" target="_blank" rel="noopener">${ic("insta")}@${esc(cf.instagram)}</a>` : ""}</div>

  <div class="card costura">
    <div class="card-titulo"><h2>🔗 Link da bio: página de pedidos</h2></div>
    <p class="muted" style="margin-top:0">É o site da Doce Pedaço: mostra a fornada da semana, as vagas e recebe os pedidos. Com a nuvem ligada, eles caem sozinhos em Pedidos ♡</p>
    <div class="texto-pronto">${esc(link)}</div>
    <div class="acoes"><button class="btn mini claro" data-acao="copiar" data-t="${esc(link)}">${ic("copiar")}Copiar link</button><a class="btn mini borda" href="index.html" target="_blank" rel="noopener">Ver o site</a></div>
    ${!cf.whatsapp ? `<p class="small" style="color:var(--ambar);margin-bottom:0">⚠️ O número do WhatsApp ainda não foi configurado. O botão de enviar pedido da página fica desativado até lá (Ajustes).</p>` : ""}
    ${/^(file:|http:\/\/(localhost|127\.|192\.168\.))/.test(link) ? `<p class="small muted" style="margin-bottom:0">Este link só funciona neste computador. Quando o app for publicado na internet, ele muda sozinho.</p>` : ""}
  </div>

  <div class="grade g2 secao">
    <div class="card">
      <div class="card-titulo"><h2>📅 Posts desta semana</h2><span class="tag st-confirmado sem-ponto">Semana ${((semanaIdx + 4) % 4) + 1}/4</span></div>
      <p class="muted small" style="margin-top:-6px"><b>Tema:</b> ${esc(sem.tema)}</p>
      ${sem.posts.map((p, i) => { const k = `${chaveSem}:${i}`; const feito = S.conteudo.feitos[k]; return `
      <div class="semana-post">
        <button class="check ${feito ? "feito" : ""}" data-acao="post-feito" data-k="${k}" aria-label="Marcar como postado">✓</button>
        <div style="flex:1;min-width:0">
          <strong class="${feito ? "feito-texto" : ""}">${p.dia} · ${p.tipo}: ${esc(p.titulo)}</strong>
          <p class="small muted" style="margin:4px 0">${esc(p.como)}</p>
          ${p.legenda ? `<details class="dica"><summary>Legenda pronta</summary><div class="texto-pronto">${esc(T(p.legenda))}</div><button class="btn mini claro" data-acao="copiar" data-t="${esc(T(p.legenda))}">${ic("copiar")}Copiar legenda</button></details>` : ""}
        </div>
      </div>`; }).join("")}
    </div>
    <div class="grade" style="align-content:start">
      <div class="card">
        <h2 style="margin-bottom:6px">🖼️ Artes prontas</h2>
        <p class="muted small" style="margin-top:0">Toque para baixar a imagem.</p>
        <h3 style="margin:10px 0">Capas dos destaques</h3>
        <div class="capas">${TXT.destaques.map((d, i) => `<button data-acao="capa" data-i="${i}"><canvas width="144" height="144" data-capa="${i}"></canvas>${esc(d.nome)}</button>`).join("")}</div>
        ${(TXT.artesProntas || []).length ? `<h3 style="margin:16px 0 10px">Suas fotos, prontas pra postar ♡</h3>
        <div class="artes-prontas">${TXT.artesProntas.map((a) => `<figure><img src="assets/artes/${a.arq}-post.jpg" alt="Arte ${esc(a.nome)}" loading="lazy">
          <figcaption>${esc(a.nome)}<span><a class="btn mini claro" href="assets/artes/${a.arq}-post.jpg" download>post</a><a class="btn mini claro" href="assets/artes/${a.arq}-story.jpg" download>story</a></span></figcaption></figure>`).join("")}</div>` : ""}
        <h3 style="margin:16px 0 10px">Carrossel de lançamento do site 🎉</h3>
        <div class="artes-prontas">${[1, 2, 3].map((n) => `<figure><img src="assets/artes/lancamento-${n}.jpg" alt="Post de lançamento ${n}" loading="lazy"><figcaption>parte ${n}<span><a class="btn mini claro" href="assets/artes/lancamento-${n}.jpg" download>baixar</a></span></figcaption></figure>`).join("")}</div>
        <div class="texto-pronto" style="margin-top:10px">${esc("Agora a Doce Pedaço tem site! 💗\nToda terça abre a fornada da semana: você escolhe os docinhos, o dia, e pronto.\nAs vagas são limitadas, então corre na terça 🧁\nE tem cartão fidelidade: no 10º pedido, o docinho é presente 🎁\n\nLink na bio ✨\n\n" + TXT.hashtags)}</div>
        <button class="btn mini claro" data-acao="copiar" data-t="${esc("Agora a Doce Pedaço tem site! 💗\nToda terça abre a fornada da semana: você escolhe os docinhos, o dia, e pronto.\nAs vagas são limitadas, então corre na terça 🧁\nE tem cartão fidelidade: no 10º pedido, o docinho é presente 🎁\n\nLink na bio ✨\n\n" + TXT.hashtags)}">${ic("copiar")}Copiar legenda</button>
        <h3 style="margin:16px 0 10px">Material impresso com QR code 🖨️</h3>
        <p class="small muted" style="margin:0 0 8px">Panfleto, cartão fidelidade, adesivo pra embalagem e cartãozinho de obrigada. Cada QR mostra em Resultados de onde a cliente veio.</p>
        <a class="btn mini rosa" href="materiais/" target="_blank" rel="noopener">abrir pra imprimir</a>
        <h3 style="margin:16px 0 10px">Cardápio para o feed</h3>
        <div class="acoes"><button class="btn mini rosa" data-acao="arte-cardapio" data-f="feed">${ic("baixar")}Post (1080×1350)</button><button class="btn mini claro" data-acao="arte-cardapio" data-f="story">${ic("baixar")}Story (1080×1920)</button></div>
      </div>
      <div class="card">
        <h2 style="margin-bottom:10px">✍️ Bio do Instagram</h2>
        ${TXT.bios.map((b) => `<div class="texto-pronto">${esc(T(b))}</div><button class="btn mini claro" data-acao="copiar" data-t="${esc(T(b))}">${ic("copiar")}Copiar</button>`).join("")}
        <h3 style="margin:16px 0 6px">Hashtags</h3>
        <div class="texto-pronto">${esc(TXT.hashtags)}</div><button class="btn mini claro" data-acao="copiar" data-t="${esc(TXT.hashtags)}">${ic("copiar")}Copiar</button>
      </div>
    </div>
  </div>

  <div class="grade g2 secao">
    <div class="card">
      <h2 style="margin-bottom:4px">💬 Respostas rápidas do WhatsApp</h2>
      <p class="muted small">No WhatsApp Business: Ferramentas → Respostas rápidas. No WhatsApp normal, é só copiar e colar.</p>
      ${TXT.respostasRapidas.map((r) => `<details class="dica"><summary>${esc(r.titulo)} <span class="muted small">${esc(r.atalho)}</span></summary>
        <div class="texto-pronto">${esc(T(r.texto))}</div><button class="btn mini claro" data-acao="copiar" data-t="${esc(T(r.texto))}">${ic("copiar")}Copiar</button></details>`).join("")}
    </div>
    <div class="card">
      <h2 style="margin-bottom:4px">🌷 Como conquistar clientes</h2>
      <p class="muted small">Estratégias gratuitas, da mais fácil para a mais trabalhosa.</p>
      ${TXT.estrategias.map((e) => `<details class="dica"><summary>${esc(e.titulo)}</summary><p>${esc(e.texto)}</p></details>`).join("")}
    </div>
  </div>`;
};
TELAS.divulgacao.montar = () => { document.fonts.ready.then(() => $$("canvas[data-capa]").forEach((cv) => desenharCapa(cv, TXT.destaques[cv.dataset.capa], 144))); };

/* artes em canvas */
const LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="#3B2420" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M32 17c-2.6 0-4 1.8-3.4 4 .5 1.8 2.2 3.4 3.4 4 1.2-.6 2.9-2.2 3.4-4 .6-2.2-.8-4-3.4-4z" fill="#F2C3CD"/><path d="M30 15.6l2 1.4 2-1.4"/><path d="M17 31c0-3.6 6.7-6 15-6s15 2.4 15 6"/><path d="M17 31c1.4 2.6 3 2.6 4.3 0 1.4 2.6 3 2.6 4.3 0 1.4 2.6 3 2.6 4.3 0 1.4 2.6 3 2.6 4.3 0 1.4 2.6 3 2.6 4.3 0 1.4 2.6 3 2.6 4.3 0 .9 1.7 1.7 1.6 2.5 0"/><path d="M17.5 32v13.5c0 2 6.5 3.5 14.5 3.5s14.5-1.5 14.5-3.5V32"/><path d="M22 35v9M27 36v9.5M32 36.2v9.8M37 36v9.5M42 35v9" stroke-width="1.4"/><path d="M12 49.5c0 2 9 3.5 20 3.5s20-1.5 20-3.5"/></svg>')}`;
let logoImg = null;
function carregarLogo() { return new Promise((ok) => { if (logoImg) return ok(logoImg); const i = new Image(); i.onload = () => { logoImg = i; ok(i); }; i.onerror = () => ok(null); i.src = LOGO_SVG; }); }
function desenharCapa(cv, d, tam) {
  const x = cv.getContext("2d"); const W = cv.width, H = cv.height; const r = tam / 2;
  x.fillStyle = "#FBE9EE"; x.fillRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2;
  x.strokeStyle = "#E8A7B5"; x.lineWidth = tam * .045; x.beginPath(); x.arc(cx, cy, r * .86, 0, Math.PI * 2); x.stroke();
  x.setLineDash([tam * .025, tam * .025]); x.lineWidth = tam * .01; x.beginPath(); x.arc(cx, cy, r * .74, 0, Math.PI * 2); x.stroke(); x.setLineDash([]);
  x.textAlign = "center"; x.textBaseline = "middle"; x.font = `${tam * .36}px "Apple Color Emoji","Segoe UI Emoji",sans-serif`;
  x.fillText(d.emoji, cx, cy + tam * .02);
}
async function baixarCapa(i) {
  await document.fonts.ready;
  const cv = document.createElement("canvas"); cv.width = 1080; cv.height = 1920;
  const x = cv.getContext("2d"); x.fillStyle = "#FBE9EE"; x.fillRect(0, 0, 1080, 1920);
  const tmp = document.createElement("canvas"); tmp.width = tmp.height = 1080; desenharCapa(tmp, TXT.destaques[i], 1080);
  x.drawImage(tmp, 0, 420);
  cv.toBlob((b) => baixar(`destaque-${normal(TXT.destaques[i].nome)}.png`, b), "image/png");
}
async function arteCardapio(formato) {
  await document.fonts.ready; const logo = await carregarLogo();
  const W = 1080, H = formato === "story" ? 1920 : 1350;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H; const x = cv.getContext("2d");
  x.fillStyle = "#FDF3F5"; x.fillRect(0, 0, W, H);
  const m = 40; x.fillStyle = "#FBE9EE"; rr(x, m, m, W - 2 * m, H - 2 * m, 48); x.fill();
  x.strokeStyle = "#E8A7B5"; x.lineWidth = 6; rr(x, m, m, W - 2 * m, H - 2 * m, 48); x.stroke();
  x.setLineDash([12, 10]); x.lineWidth = 2.5; rr(x, m + 22, m + 22, W - 2 * m - 44, H - 2 * m - 44, 32); x.stroke(); x.setLineDash([]);
  let y = formato === "story" ? 190 : 110;
  if (logo) x.drawImage(logo, W / 2 - 55, y, 110, 110); y += 175;
  x.textAlign = "center"; x.textBaseline = "alphabetic";
  x.font = '900 104px "Fraunces", Georgia, serif'; x.fillStyle = "#3B2420"; x.fillText("doce", W / 2, y);
  y += 92; x.fillStyle = "#DD8E9E"; x.fillText("pedaço", W / 2, y);
  y += 70; x.font = '58px "Allura", cursive'; x.fillText("feito com carinho para você ♡", W / 2, y);
  const prods = S.produtos.filter((p) => p.ativo !== false); const cats = [...new Set(prods.map((p) => p.categoria))];
  const linhas = prods.length + cats.length; const espaco = H - y - (formato === "story" ? 330 : 190);
  const lh = Math.min(formato === "story" ? 66 : 52, espaco / (linhas + cats.length * .6));
  y += lh * 1.2 + 28;
  for (const cat of cats) {
    x.textAlign = "center"; x.fillStyle = "#C96F82"; x.font = `700 ${lh * .78}px "Fraunces", Georgia, serif`; x.fillText(cat, W / 2, y); y += lh * 1.05;
    for (const p of prods.filter((q) => q.categoria === cat)) {
      x.font = `700 ${lh * .58}px "Nunito", sans-serif`; x.fillStyle = "#3B2420";
      x.textAlign = "left"; x.fillText(p.nome, 130, y); x.textAlign = "right"; x.fillText(brl(p.preco), W - 130, y);
      const wN = x.measureText(p.nome).width; x.textAlign = "left"; const wP = x.measureText(brl(p.preco)).width;
      x.strokeStyle = "#E8A7B5"; x.lineWidth = 2; x.setLineDash([3, 8]); x.beginPath(); x.moveTo(130 + wN + 14, y - lh * .14); x.lineTo(W - 130 - wP - 14, y - lh * .14); x.stroke(); x.setLineDash([]);
      y += lh;
    }
    y += lh * .6;
  }
  x.textAlign = "center"; x.fillStyle = "#3B2420"; x.font = '800 34px "Nunito", sans-serif';
  const yb = H - (formato === "story" ? 240 : 120);
  x.fillText(`Peça pelo link da bio${S.config.instagram ? "  ·  @" + S.config.instagram : ""}`, W / 2, yb);
  x.fillStyle = "#9C7B72"; x.font = '600 26px "Nunito", sans-serif'; x.fillText(`Encomendas com ${S.config.antecedencia} dias de antecedência`, W / 2, yb + 44);
  cv.toBlob((b) => baixar(`cardapio-${formato}.png`, b), "image/png");
}
function rr(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }

/* ---------------- ROTINA ---------------- */
TELAS.rotina = () => {
  const sem = segundaDaSemana(hoje());
  if (S.rotina.semana !== sem) { S.rotina = { semana: sem, feitos: {} }; salvar(); }
  const dHoje = DSEM_LONGO[new Date().getDay()];
  const ordem = ["Todos os dias", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
  const blocos = [...TXT.rotina].sort((a, b) => {
    const pa = a.dia === "Todos os dias" ? -2 : normal(a.dia) === normal(dHoje) ? -1 : ordem.indexOf(a.dia);
    const pb = b.dia === "Todos os dias" ? -2 : normal(b.dia) === normal(dHoje) ? -1 : ordem.indexOf(b.dia);
    return pa - pb;
  });
  const totalItens = TXT.rotina.reduce((s, b) => s + b.itens.length, 0);
  const feitos = Object.values(S.rotina.feitos).filter(Boolean).length;
  return `
  <div class="cabecalho"><div><h1>Rotina da semana</h1><p class="muted">O passo a passo para a Doce Pedaço rodar sem correria. Recomeça toda segunda.</p></div>
    <span class="tag st-confirmado sem-ponto">${feitos}/${totalItens} feitos</span></div>
  <div class="grade g2">
    ${blocos.map((b) => { const eHoje = normal(b.dia) === normal(dHoje); return `<div class="card ${eHoje ? "costura" : ""}">
      <div class="card-titulo"><h2>${esc(b.dia)}</h2>${eHoje ? '<span class="tag st-producao sem-ponto">hoje</span>' : ""}</div>
      ${b.itens.map((it, i) => { const k = `${b.dia}:${i}`; const f = S.rotina.feitos[k]; const diario = b.dia === "Todos os dias";
        const kk = diario ? `${hoje()}:${k}` : k; const ff = diario ? S.rotina.feitos[kk] : f;
        return `<div class="tarefa" style="padding:8px 0"><button class="check ${ff ? "feito" : ""}" data-acao="rotina" data-k="${esc(kk)}" aria-label="Feito">✓</button><div class="tarefa-corpo ${ff ? "feito-texto" : ""}">${esc(it)}</div></div>`; }).join("")}
    </div>`; }).join("")}
  </div>
  <div class="card secao"><h2 style="margin-bottom:6px">📌 Boas práticas do negócio</h2>
    ${TXT.dicasOperacao.map((d) => `<details class="dica"><summary>${esc(d.titulo)}</summary><p>${esc(d.texto)}</p></details>`).join("")}
  </div>`;
};

/* ---------------- RESULTADOS ---------------- */
let mesResultados = hoje().slice(0, 7);
TELAS.resultados = () => {
  const [y, m] = mesResultados.split("-").map(Number);
  const ps = S.pedidos.filter((p) => p.status !== "cancelado" && p.data.startsWith(mesResultados));
  const fat = ps.reduce((s, p) => s + total(p), 0); const rec = ps.reduce((s, p) => s + Math.min(p.pago, total(p)), 0);
  const cst = ps.reduce((s, p) => s + custo(p), 0); const lucro = fat - cst - ps.reduce((s, p) => s + (p.taxa || 0), 0) * 0;
  const meta = S.config.metaMensal || 0;
  const novos = S.clientes.filter((c) => c.criadoEm.startsWith(mesResultados)).length;
  const porProd = {}, porCat = {}, porOrig = {};
  ps.forEach((p) => { p.itens.forEach((i) => { porProd[i.nome] = (porProd[i.nome] || 0) + i.qtd; porCat[i.categoria || "Outros"] = (porCat[i.categoria || "Outros"] || 0) + i.qtd * i.preco; }); porOrig[p.origem || "—"] = (porOrig[p.origem || "—"] || 0) + 1; });
  const barras = (o, fmt) => { const e = Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 8); const mx = Math.max(1, ...e.map((x) => x[1]));
    return e.length ? `<div class="barras">${e.map(([k, v]) => `<div class="barra-linha"><span>${esc(k)}</span><div class="trilho"><i style="width:${v / mx * 100}%"></i></div><b>${fmt(v)}</b></div>`).join("")}</div>` : `<p class="muted">Sem dados neste mês.</p>`; };
  const prev = new Date(y, m - 2, 1), next = new Date(y, m, 1);
  return `
  <div class="cabecalho"><div><h1>Resultados</h1><p class="muted">${MESES[m - 1][0].toUpperCase() + MESES[m - 1].slice(1)} de ${y}</p></div>
    <div class="acoes"><button class="btn mini claro" data-acao="mes" data-m="${iso(prev).slice(0, 7)}">‹ ${MESES[prev.getMonth()].slice(0, 3)}</button><button class="btn mini claro" data-acao="mes" data-m="${iso(next).slice(0, 7)}">${MESES[next.getMonth()].slice(0, 3)} ›</button></div></div>
  <div class="numeros">
    <div class="numero"><span>Vendido</span><strong>${brl(fat)}</strong><small>${ps.length} pedidos</small></div>
    <div class="numero"><span>Recebido</span><strong>${brl(rec)}</strong><small>falta ${brl(fat - rec)}</small></div>
    <div class="numero"><span>Lucro estimado</span><strong>${brl(lucro)}</strong><small>${fat ? Math.round(lucro / fat * 100) : 0}% de margem</small></div>
    <div class="numero"><span>Ticket médio</span><strong>${brl(ps.length ? fat / ps.length : 0)}</strong><small>${novos} cliente(s) nova(s)</small></div>
  </div>
  ${meta ? `<div class="card secao"><div class="card-titulo"><h2>Meta do mês</h2><b>${Math.round(fat / meta * 100)}%</b></div><div class="meta-trilho"><i style="width:${Math.min(100, fat / meta * 100)}%"></i></div><p class="small muted" style="margin:0">${brl(fat)} de ${brl(meta)}</p></div>` : ""}
  <div class="grade g2 secao">
    <div class="card"><h2 style="margin-bottom:12px">Mais vendidos</h2>${barras(porProd, (v) => v + " un.")}</div>
    <div class="card"><h2 style="margin-bottom:12px">Vendas por categoria</h2>${barras(porCat, brl)}</div>
    <div class="card"><h2 style="margin-bottom:12px">De onde vieram os pedidos</h2>${barras(porOrig, (v) => v)}<p class="small muted" style="margin-bottom:0">Mostra qual canal está trazendo mais clientes.</p></div>
  </div>
  ${window.DPInterativo ? DPInterativo.htmlConquistas() : ""}
  <p class="small muted secao">O lucro estimado usa o custo cadastrado em cada produto do Cardápio. Itens personalizados entram sem custo.</p>`;
};

/* ---------------- AJUSTES ---------------- */
TELAS.ajustes = () => {
  const c = S.config; const notif = "Notification" in window ? Notification.permission : "indisponível";
  const campo = (k, rot, tipo = "text", extra = "") => `<div class="campo"><label for="cfg-${k}">${rot}</label><input id="cfg-${k}" data-cfg="${k}" type="${tipo}" value="${esc(c[k] ?? "")}" ${extra}></div>`;
  return `
  <div class="cabecalho"><div><h1>Ajustes</h1><p class="muted">Dados do negócio, avisos e backup</p></div></div>
  <div class="grade g2">
    <div class="card">
      <h2 style="margin-bottom:12px">O negócio</h2>
      ${campo("dona", "Seu nome (pro caderninho te chamar ♡)")}
      ${campo("whatsapp", "WhatsApp da Doce Pedaço (com DDD)", "tel", 'placeholder="(51) 99999-9999"')}
      ${campo("instagram", "Instagram (sem @)")}
      ${campo("pix", "Chave Pix", "text", 'placeholder="vai nas mensagens de confirmação"')}
      <div class="linha-campos">${campo("antecedencia", "Antecedência mínima (dias)", "number", 'min="0"')}${campo("producaoDiasAntes", "Produzir quantos dias antes", "number", 'min="0"')}</div>
      <div class="linha-campos">${campo("taxaEntrega", "Taxa de entrega padrão (R$)", "number", 'min="0" step="0.5"')}${campo("sinal", "Sinal (%)", "number", 'min="0" max="100"')}</div>
      <div class="linha-campos">${campo("metaMensal", "Meta de vendas no mês (R$)", "number", 'min="0" step="50"')}${campo("fidelidadeMeta", "Selos do cartão fidelidade", "number", 'min="2"')}</div>
      <div class="linha-campos">${campo("diasSumido", "Avisar cliente sumida após (dias)", "number", 'min="7"')}${campo("linkPedidos", "Link da página de pedidos", "url", 'placeholder="automático"')}</div>
      <h3 style="margin:8px 0 10px">Validade nas etiquetas (dias)</h3>
      <div class="linha-campos">${Object.keys(c.validade).map((k) => `<div class="campo"><label>${esc(k)}</label><input type="number" min="0" data-val="${esc(k)}" value="${c.validade[k]}"></div>`).join("")}</div>
    </div>
    <div class="grade" style="align-content:start">
      <div class="card">
        <h2 style="margin-bottom:6px">${ic("sino").replace("<svg", '<svg style="width:20px;vertical-align:-3px;color:var(--rosa)"')} Avisos</h2>
        <p class="muted small">Ao abrir o app, ele avisa o que tem para hoje. Para alarmes com o app fechado, use <b>Agenda → Mandar p/ calendário</b>: os pedidos entram no calendário do celular com alarme.</p>
        <button class="btn mini claro" data-acao="notificacoes" ${notif === "granted" || notif === "indisponível" ? "disabled" : ""}>${notif === "granted" ? "✓ Avisos ativados" : notif === "indisponível" ? "Avisos indisponíveis aqui" : "Ativar avisos"}</button>
      </div>
      <div class="card">
        <h2 style="margin-bottom:6px">☁️ Computador + iPhone</h2>
        ${!DPSync.configurado() ? `<p class="muted small">A sincronização ainda não foi ligada. Por enquanto os dados ficam só neste aparelho. O passo a passo para ligar (grátis) está em <code>docs/SINCRONIZACAO.md</code>.</p>`
          : DPSync.logado() ? `<p class="muted small">Conectada como <b>${esc(DPSync.email() || "")}</b>. Tudo que muda aqui aparece no outro aparelho em poucos segundos.</p>
            <div class="acoes"><button class="btn mini claro" data-acao="nuvem-agora">Sincronizar agora</button><button class="btn mini borda" data-acao="sair-nuvem">Sair da conta</button></div>`
          : `<p class="muted small">Entre com a conta da Doce Pedaço para ver os mesmos dados no computador e no iPhone.</p><button class="btn mini rosa" data-acao="entrar">Entrar ou criar conta</button>`}
      </div>
      <div class="card costura">
        <h2 style="margin-bottom:6px">💾 Backup</h2>
        <p class="muted small">Os dados ficam só neste aparelho. Baixe um backup toda semana e guarde no Drive ou no e-mail.${c.ultimoBackup ? `<br>Último backup: <b>${fmtData(c.ultimoBackup.slice(0, 10))}</b>` : "<br><b style='color:var(--vermelho)'>Nenhum backup ainda.</b>"}</p>
        <div class="acoes"><button class="btn mini rosa" data-acao="backup">${ic("baixar")}Baixar backup</button>
          <label class="btn mini borda" style="cursor:pointer">Restaurar backup<input type="file" accept=".json,application/json" id="restaurar" hidden></label></div>
      </div>
      <div class="card">
        <h2 style="margin-bottom:6px">🌐 Página pública</h2>
        <p class="muted small">A página de pedidos lê o arquivo <code>assets/config.js</code>. Depois de mudar o cardápio ou o WhatsApp aqui, baixe o arquivo novo e substitua o antigo.</p>
        <button class="btn mini claro" data-acao="baixar-config">${ic("baixar")}Baixar config.js atualizado</button>
      </div>
      <div class="card">
        <h2 style="margin-bottom:6px">Zona de cuidado</h2>
        <div class="acoes" style="margin-bottom:10px"><button class="btn mini claro" data-acao="tour">🍰 ver o tour de novo</button></div>
        <div class="acoes"><button class="btn mini perigo" data-acao="apagar-exemplos">Apagar dados de exemplo</button><button class="btn mini perigo" data-acao="apagar-tudo">Apagar tudo</button></div>
      </div>
    </div>
  </div>`;
};
TELAS.ajustes.montar = () => {
  $$("[data-cfg]").forEach((el) => el.addEventListener("change", () => {
    const k = el.dataset.cfg; S.config[k] = el.type === "number" ? (parseFloat(el.value) || 0) : el.value.trim();
    if (k === "instagram") S.config[k] = S.config[k].replace(/^@/, "");
    salvar(); toast("Salvo 💗");
  }));
  $$("[data-val]").forEach((el) => el.addEventListener("change", () => { S.config.validade[el.dataset.val] = parseInt(el.value) || 0; salvar(); toast("Salvo 💗"); }));
  $("#restaurar").onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { const d = JSON.parse(await f.text()); if (!d.pedidos || !d.clientes) throw 0;
      confirmar(`Restaurar backup com ${d.pedidos.length} pedidos e ${d.clientes.length} clientes? Os dados atuais serão substituídos.`, "Restaurar", () => {
        localStorage.setItem(CHAVE, JSON.stringify(d)); S = carregar(); render(); toast("Backup restaurado 💗"); });
    } catch { toast("Esse arquivo não é um backup válido"); }
  };
};

/* ---------------- calendário (.ics) ---------------- */
function ics(eventos) {
  const fmt = (data, hora) => data.replace(/-/g, "") + (hora ? "T" + hora.replace(":", "") + "00" : "");
  const e = (s) => String(s).replace(/[\\;,]/g, (c) => "\\" + c).replace(/\n/g, "\\n");
  const linhas = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Doce Pedaco//Gestao//PT", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  const agora = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  for (const ev of eventos) {
    linhas.push("BEGIN:VEVENT", `UID:${ev.uid}@docepedaco`, `DTSTAMP:${agora}`);
    if (ev.hora) { const fim = ev.hora.split(":").map(Number); const hf = `${z2(Math.min(23, fim[0] + 1))}:${z2(fim[1])}`;
      linhas.push(`DTSTART:${fmt(ev.data, ev.hora)}`, `DTEND:${fmt(ev.data, hf)}`); }
    else linhas.push(`DTSTART;VALUE=DATE:${fmt(ev.data)}`, `DTEND;VALUE=DATE:${fmt(addDias(ev.data, 1))}`);
    linhas.push(`SUMMARY:${e(ev.titulo)}`, `DESCRIPTION:${e(ev.desc || "")}`);
    for (const a of ev.alarmes || []) linhas.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${e(ev.titulo)}`, `TRIGGER:${a}`, "END:VALARM");
    linhas.push("END:VEVENT");
  }
  linhas.push("END:VCALENDAR"); return linhas.join("\r\n");
}
function eventosPedido(p) {
  const c = cliente(p.clienteId) || {}; const desc = `${resumoItens(p)}\nTotal: ${brl(total(p))} · Falta: ${brl(saldo(p))}\n${c.telefone || ""}\n${p.endereco || ""}\n${p.obs || ""}`.trim();
  const ev = [{ uid: "ent-" + p.id, data: p.data, hora: p.hora, titulo: `🍰 ${p.tipo === "entrega" ? "Entregar" : "Retirada"} #${p.numero} · ${c.nome || ""}`, desc, alarmes: p.hora ? ["-PT2H"] : ["PT9H"] }];
  if (diaProducao(p) !== p.data) ev.push({ uid: "prod-" + p.id, data: diaProducao(p), titulo: `👩‍🍳 Produzir #${p.numero} · ${c.nome || ""}`, desc, alarmes: ["PT8H"] });
  return ev;
}

/* ---------------- etiquetas ---------------- */
function imprimirEtiquetas(p) {
  const c = cliente(p.clienteId) || {}; const et = [];
  for (const i of p.itens) {
    const dias = S.config.validade[i.categoria] ?? 3; const val = addDias(p.data, dias); const [yy, mm, dd] = val.split("-");
    for (let k = 0; k < Math.min(i.qtd, 24); k++) et.push(`<div class="etiqueta"><img src="assets/logo.svg" alt=""><span class="e-doce">doce</span><span class="e-pedaco">pedaço</span>
      <div class="e-frase">Feito com carinho<em>para ${esc(primeiroNome(c.nome)) || "você"} ♡</em></div><div class="e-prod">${esc(i.nome)}</div>
      <div class="e-val">Consumir preferencialmente até<br><b>${dd} / ${mm} / ${yy.slice(2)}</b></div></div>`);
  }
  $("#impressao").innerHTML = et.join("");
  document.fonts.ready.then(() => setTimeout(() => window.print(), 300));
}

/* ---------------- avisos (notificações) ---------------- */
async function avisarDoDia() {
  if (!S || !("Notification" in window) || Notification.permission !== "granted") return;
  const h = hoje(); if (S.config.avisoNotificado === h) return;
  const L = lembretes().filter((l) => l.data <= h); if (!L.length) return;
  const corpo = L.slice(0, 4).map((l) => "• " + l.titulo).join("\n") + (L.length > 4 ? `\n+ ${L.length - 4} tarefas` : "");
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) reg.showNotification(`Doce Pedaço: ${L.length} tarefa(s) hoje`, { body: corpo, icon: "assets/icon-192.png", tag: "dia" });
    else new Notification(`Doce Pedaço: ${L.length} tarefa(s) hoje`, { body: corpo, icon: "assets/icon-192.png" });
    S.config.avisoNotificado = h; salvar();
  } catch (e) { console.warn(e); }
}

/* ---------------- dados de exemplo ---------------- */
function exemplos() {
  const h = hoje(); const agora = new Date().toISOString();
  const nomes = [["Ana Paula Souza", "51988887777", "anapaula.s", "03-14", "Instagram", "Ama brownie de Ninho"],
    ["Juliana Martins", "51977776666", "ju.martins", null, "Indicação", "Indicada pela Ana"],
    ["Carla Ribeiro", "51966665555", "", null, "WhatsApp", "Sem lactose no recheio!"],
    ["Fernanda Lima", "51955554444", "fe.lima", null, "Instagram", ""],
    ["Mariana Costa", "51944443333", "", null, "Vizinho/trabalho", "Trabalha na farmácia da esquina"],
    ["Beatriz Rocha", "51933332222", "bia.rocha", null, "Página de pedidos", ""]];
  const anivProx = addDias(h, 3).slice(5);
  nomes[3][3] = anivProx;
  const ids = nomes.map(([nome, tel, ig, aniv, orig, obs], i) => {
    const id = "ex-c" + i; S.clientes.push({ id, exemplo: true, nome, telefone: tel, instagram: ig, aniversario: aniv ? `1995-${aniv}` : "", endereco: i % 2 ? "Rua das Flores, 120 - Centro" : "", origem: orig, obs, criadoEm: addDias(h, -60 + i * 5) + "T10:00:00.000Z", brindesUsados: 0 });
    return id;
  });
  const it = (id, q) => { const p = produto(id); return { produtoId: id, nome: p.nome, preco: p.preco, custo: p.custo, categoria: p.categoria, qtd: q }; };
  const ped = (ci, dias, itens, st, pago, tipo = "retirada", hora = "15:00", obs = "") => {
    const p = { id: "ex-p" + S.proximoNumero, exemplo: true, numero: S.proximoNumero++, clienteId: ids[ci], itens, data: addDias(h, dias), hora, tipo,
      endereco: tipo === "entrega" ? "Rua das Flores, 120 - Centro" : "", taxa: tipo === "entrega" ? 5 : 0, desconto: 0, pago: 0, forma: "Pix",
      origem: S.clientes[ci + (S.clientes.length - nomes.length)].origem, obs, status: st, criadoEm: addDias(h, Math.min(dias, 0) - 3) + "T12:00:00.000Z", atualizadoEm: agora };
    p.pago = pago === "tudo" ? total(p) : pago; S.pedidos.push(p);
  };
  for (let k = 0; k < 9; k++) ped(0, -95 + k * 9, [it("brw-rech", 2)], "entregue", "tudo");
  ped(4, -45, [it("ck-cx6", 1)], "entregue", "tudo");
  ped(1, -20, [it("bl-15", 1)], "entregue", "tudo", "entrega", "16:00", "Escrever 'Feliz aniversário, Lu'");
  ped(2, -12, [it("brw-cx6", 1), it("ck-trad", 2)], "entregue", "tudo");
  ped(3, -1, [it("kit-mix", 2)], "entregue", 55, "entrega", "10:00");
  ped(0, 0, [it("brw-trad", 4), it("ck-rech", 2)], "pronto", "tudo", "retirada", "17:30");
  ped(5, 0, [it("bl-pote", 3)], "producao", 0, "entrega", "18:00");
  ped(1, 1, [it("ck-cx6", 1), it("brw-rech", 2)], "confirmado", 35, "retirada", "14:00");
  ped(2, 3, [it("bl-20", 1)], "novo", 0, "entrega", "15:00", "Bolo de chocolate com morango, sem lactose");
  ped(5, 5, [it("brw-cx6", 2)], "confirmado", 55, "retirada", "11:00", "Presente corporativo");
  S.lembretes.push({ id: "ex-l1", exemplo: true, texto: "Comprar caixas e fitas de cetim", data: addDias(h, 1), hora: "", feito: false });
}

/* ---------------- ações (cliques) ---------------- */
const ACOES = {
  fechar: () => fecharFolha(),
  entrar: () => folhaLogin(),
  "nuvem-agora": () => { if (!DPSync.logado()) return folhaLogin(); DPSync.agora(); toast("Sincronizando ☁️"); },
  "sair-nuvem": () => confirmar("Sair da conta neste aparelho?", "Sair", () => { DPSync.sair(); render(); toast("Você saiu. Os dados continuam neste aparelho."); }),
  comecar: () => { const n = ($("#bv-nome") || {}).value?.trim() || ""; S = padrao(); S.config.dona = n; salvar(); location.hash = "#inicio"; render(); M.confete(); toast(`Bem-vinda${n ? ", " + primeiroNome(n) : ""}! ♡`); },
  exemplos: () => { const n = ($("#bv-nome") || {}).value?.trim() || ""; S = padrao(); S.config.dona = n; exemplos(); salvar(); location.hash = "#inicio"; render(); toast("Exemplos carregados. Explora à vontade ♡"); },
  pausar: () => { S.fornada.pausadoSemana = F.janela(S.fornada).semana; salvar(); render(); toast("pedidos pausados 💜 o site já mostra que fechou"); },
  retomar: () => { S.fornada.pausadoSemana = null; salvar(); render(); M.confete(60); toast("pedidos reabertos! 🎉"); },
  limite: (d) => { S.fornada.limite = Math.max(0, (S.fornada.limite || 0) + Number(d.d)); salvar(); render(); },
  "ir-fornada": () => { location.hash = "#fornada"; },
  "aba-ideias": (d) => { abaIdeias = d.a; render(); },
  tour: () => { if (window.DPInterativo) { location.hash = "#inicio"; setTimeout(() => DPInterativo.iniciarTour(), 300); } },
  "add-ideia": (d) => {
    const i = IDEIAS.ideias.find((x) => x.id === d.id); if (!i || jaTem(i)) return;
    S.produtos.push({ id: "i-" + i.id, categoria: i.categoria, nome: i.nome, descricao: i.descricao, preco: i.preco, custo: i.custo, antecedencia: 1,
      ativo: true, naFornada: false, limite: null, tags: [...i.tags], atualizadoEm: new Date().toISOString() });
    salvar(); render(); M.confete(40); toast("Adicionado ♡ quando quiser vender, liga ele na aba Fornada");
  },
  "menu-mais": () => { const pend = lembretes().filter((l) => l.data <= hoje()).length;
    abrirFolha(`<div class="menu-folha">${MAIS.map(([id, n]) => `<a href="#${id}">${ic(id)}${n}${id === "agenda" && pend ? `<span class="badge">${pend}</span>` : ""}</a>`).join("")}</div>`); },
  "filtro-pedidos": (d) => { filtroPedidos = d.f; render(); },
  "aba-agenda": (d) => { abaAgenda = d.a; render(); },
  mes: (d) => { mesResultados = d.m; render(); },
  status: (d) => { const p = pedido(d.id); p.status = d.s; p.atualizadoEm = new Date().toISOString(); salvar(); render(); toast(`#${p.numero}: ${nomeStatus(d.s)}`);
    $$(".cabecalho .tag")[0]?.classList.add("bate"); if (d.s === "entregue") M.confete(45);
    if (d.s === "entregue" && saldo(p) > 0) setTimeout(() => toast(`Atenção: falta receber ${brl(saldo(p))}`), 2700); },
  pagamento: (d) => { const p = pedido(d.id);
    abrirFolha(`<h2>Registrar pagamento</h2><p class="muted">Pedido #${p.numero} · falta ${brl(saldo(p))}</p>
      <form id="form-pg"><div class="linha-campos"><div class="campo"><label>Valor recebido (R$)</label><input id="pg-v" inputmode="decimal" value="${saldo(p).toFixed(2).replace(".", ",")}"></div>
      <div class="campo"><label>Forma</label><select id="pg-f">${["Pix", "Dinheiro", "Cartão", "Outro"].map((o) => `<option ${p.forma === o ? "selected" : ""}>${o}</option>`).join("")}</select></div></div>
      <div class="acoes"><button class="btn rosa">Salvar</button><button type="button" class="btn borda" data-acao="fechar">Cancelar</button></div></form>`);
    $("#form-pg").onsubmit = (e) => { e.preventDefault(); p.pago = Math.round((p.pago + numCampo($("#pg-v").value)) * 100) / 100; p.forma = $("#pg-f").value; p.atualizadoEm = new Date().toISOString(); salvar(); fecharFolha(); render(); toast("Pagamento registrado 💰"); }; },
  "zap-pedido": (d) => { const p = pedido(d.id); abrirZap((cliente(p.clienteId) || {}).telefone, mensagem(d.m, p)); },
  "zap-cliente": (d) => { const c = cliente(d.id); abrirZap(c.telefone, mensagem(d.m, null, c)); },
  "ics-pedido": (d) => { const p = pedido(d.id); baixar(`pedido-${p.numero}.ics`, ics(eventosPedido(p)), "text/calendar"); toast("Abra o arquivo para pôr no calendário 📅"); },
  "ics-todos": () => { const ps = S.pedidos.filter((p) => ativo(p) && p.data >= hoje()); if (!ps.length) return toast("Nenhum pedido futuro");
    baixar(`doce-pedaco-agenda-${hoje()}.ics`, ics(ps.flatMap(eventosPedido)), "text/calendar"); toast(`${ps.length} pedido(s) exportado(s) com alarme 📅`); },
  etiquetas: (d) => imprimirEtiquetas(pedido(d.id)),
  repetir: (d) => { const p = pedido(d.id); const f = formDePedido(p); delete f.id; rascunho = { ...f, id: null, data: addDias(hoje(), S.config.antecedencia || 0), pago: 0, status: "novo", origem: p.origem }; form = null; location.hash = "#novo-pedido"; },
  cancelar: (d) => { const p = pedido(d.id); confirmar(`Cancelar o pedido #${p.numero}?`, "Cancelar pedido", () => { p.status = "cancelado"; p.atualizadoEm = new Date().toISOString(); salvar(); render(); if (p.siteId && window.DPSync) DPSync.apagarPedidoSite(p.siteId); }); },
  "excluir-pedido": (d) => { const p = pedido(d.id); confirmar(`Excluir o pedido #${p.numero}?`, "Excluir", () => { S.pedidos = S.pedidos.filter((x) => x.id !== p.id); salvar(); location.hash = "#pedidos"; if (p.siteId && window.DPSync) DPSync.apagarPedidoSite(p.siteId); }); },
  "colar-pedido": () => {
    abrirFolha(`<h2>Colar pedido do WhatsApp</h2><p class="muted small">Copie a mensagem que a cliente enviou pela página de pedidos e cole aqui. O app preenche tudo sozinho.</p>
      <div class="campo"><textarea id="txt-colado" style="min-height:180px" placeholder="Cole a mensagem aqui"></textarea></div>
      <div class="acoes"><button class="btn rosa" id="ler-colado">Preencher pedido</button><button class="btn borda" data-acao="fechar">Cancelar</button></div>`);
    $("#ler-colado").onclick = () => { const t = $("#txt-colado").value; if (!t.trim()) return toast("Cole a mensagem primeiro");
      const r = lerPedidoColado(t); if (!Object.keys(r.qtd).length && !r.extras.length) return toast("Não encontrei itens nessa mensagem");
      rascunho = r; form = null; fecharFolha(); if (location.hash === "#novo-pedido") render(); else location.hash = "#novo-pedido"; toast("Confira os dados e salve 💗"); };
  },
  tarefa: (d) => {
    const l = lembretes().find((x) => x.chave === d.chave); if (!l) return; const a = l.acoes[d.i];
    const p = l.pedido && pedido(l.pedido); const c = l.cliente ? cliente(l.cliente) : p && cliente(p.clienteId);
    if (a.t === "zap") { abrirZap(c && c.telefone, mensagem(a.m, p)); if (l.chave.startsWith("pos:")) { S.dispensados[l.chave] = hoje(); salvar(); setTimeout(render, 400); } }
    else if (a.t === "zapc") { abrirZap(c && c.telefone, mensagem(a.m, null, c)); S.dispensados[l.chave] = hoje(); salvar(); setTimeout(render, 400); }
    else if (a.t === "status") ACOES.status({ id: p.id, s: a.s });
    else if (a.t === "pago") { p.pago = total(p); p.atualizadoEm = new Date().toISOString(); salvar(); render(); toast("Pagamento registrado 💰"); }
    else if (a.t === "ok") { S.dispensados[l.chave] = hoje(); salvar(); render(); }
    else if (a.t === "backup") ACOES.backup();
    else if (a.t === "ir") location.hash = a.h;
  },
  "novo-lembrete": () => {
    abrirFolha(`<h2 style="margin-bottom:14px">Novo lembrete</h2><form id="form-lem">
      <div class="campo"><label>O que lembrar?</label><input id="lem-t" required placeholder="Ex.: comprar chocolate em barra"></div>
      <div class="linha-campos"><div class="campo"><label>Dia</label><input id="lem-d" type="date" required value="${hoje()}"></div><div class="campo"><label>Hora (opcional)</label><input id="lem-h" type="time"></div></div>
      <div class="acoes"><button class="btn rosa">Salvar</button><button type="button" class="btn borda" data-acao="fechar">Cancelar</button></div></form>`);
    $("#form-lem").onsubmit = (e) => { e.preventDefault(); S.lembretes.push({ id: uid(), texto: $("#lem-t").value.trim(), data: $("#lem-d").value, hora: $("#lem-h").value, feito: false }); salvar(); fecharFolha(); render(); toast("Lembrete criado 📝"); };
  },
  "lembrete-feito": (d) => { const l = S.lembretes.find((x) => x.id === d.id); l.feito = true; l.atualizadoEm = new Date().toISOString(); salvar(); render(); toast("Feito! ✓"); },
  "novo-cliente": () => folhaCliente(),
  "editar-cliente": (d) => folhaCliente(clone(cliente(d.id))),
  "excluir-cliente": (d) => { const c = cliente(d.id); const n = S.pedidos.filter((p) => p.clienteId === c.id).length;
    confirmar(`Excluir ${c.nome}${n ? ` e os ${n} pedido(s) dela` : ""}?`, "Excluir", () => { S.clientes = S.clientes.filter((x) => x.id !== c.id); S.pedidos = S.pedidos.filter((p) => p.clienteId !== c.id); salvar(); location.hash = "#clientes"; }); },
  "usar-brinde": (d) => { const c = cliente(d.id); c.brindesUsados = (c.brindesUsados || 0) + 1; c.atualizadoEm = new Date().toISOString(); salvar(); render(); toast("Brinde registrado 🎁"); },
  "novo-produto": () => folhaProduto(),
  "editar-produto": (d) => folhaProduto(clone(produto(d.id))),
  copiar: (d) => copiar(d.t),
  "post-feito": (d) => { S.conteudo.feitos[d.k] = !S.conteudo.feitos[d.k]; salvar(); render(); },
  rotina: (d) => { S.rotina.feitos[d.k] = !S.rotina.feitos[d.k]; salvar(); render(); },
  capa: (d) => baixarCapa(+d.i),
  "arte-cardapio": (d) => { toast("Gerando a arte..."); arteCardapio(d.f); },
  backup: () => { S.config.ultimoBackup = new Date().toISOString(); salvar(); baixar(`docepedaco-backup-${hoje()}.json`, JSON.stringify(S, null, 2), "application/json"); toast("Backup baixado 💾 Guarde num lugar seguro"); render(); },
  "baixar-config": () => {
    const cf = { ...CFG, nome: S.config.nome, whatsapp: telefone(S.config.whatsapp), instagram: S.config.instagram, antecedenciaPadraoDias: S.config.antecedencia, sinalPercentual: S.config.sinal,
      fornada: { ...S.fornada, pausadoSemana: null },
      cardapio: S.produtos.map(({ id, categoria, nome, descricao, preco, custo, antecedencia, ativo: at, naFornada, limite, tags, foto }) => ({ id, categoria, nome, descricao, preco, custo, antecedencia, ativo: at, naFornada, limite, tags, foto })) };
    baixar("config.js", `/* Gerado pelo app Doce Pedaço em ${new Date().toLocaleString("pt-BR")} */\nwindow.DP_CONFIG = ${JSON.stringify(cf, null, 2)};\n`, "text/javascript");
  },
  notificacoes: async () => { const r = await Notification.requestPermission(); if (r === "granted") { S.config.avisoNotificado = null; salvar(); avisarDoDia(); toast("Avisos ativados 🔔"); } render(); },
  "apagar-exemplos": () => confirmar("Apagar os dados de exemplo?", "Apagar exemplos", () => {
    S.clientes = S.clientes.filter((c) => !c.exemplo); S.pedidos = S.pedidos.filter((p) => !p.exemplo); S.lembretes = S.lembretes.filter((l) => !l.exemplo);
    if (!S.pedidos.length) S.proximoNumero = 1; salvar(); render(); toast("Exemplos apagados"); }),
  "apagar-tudo": () => confirmar("Apagar TODOS os dados deste aparelho?", "Apagar tudo", () => { localStorage.removeItem(CHAVE); S = null; location.hash = ""; render(); })
};
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-acao]"); if (!el) return;
  const fn = ACOES[el.dataset.acao]; if (!fn) return; e.preventDefault(); fn(el.dataset);
});
$("#folha-fundo").onclick = fecharFolha;
$("#btn-novo-topo").onclick = () => { location.hash = "#novo-pedido"; };
document.addEventListener("keydown", (e) => { if (e.key === "Escape") fecharFolha(); });
$("#folha").addEventListener("click", (e) => { if (e.target.closest("a[href^='#']")) fecharFolha(); });

/* ---------------- nuvem ---------------- */
function folhaLogin() {
  abrirFolha(`<h2>☁️ Conta da Doce Pedaço</h2><p class="muted small">Use o mesmo e-mail e senha no computador e no iPhone.</p>
    <form id="form-login" autocomplete="on">
      <div class="campo"><label for="lg-email">E-mail</label><input id="lg-email" type="email" autocomplete="username" required></div>
      <div class="campo"><label for="lg-senha">Senha</label><input id="lg-senha" type="password" autocomplete="current-password" minlength="6" required></div>
      <p class="small" id="lg-erro" style="color:var(--vermelho);min-height:1em;margin:0 0 10px"></p>
      <div class="acoes"><button class="btn rosa" type="submit">Entrar</button><button class="btn borda" type="button" id="lg-criar">Criar conta</button></div>
    </form>`);
  const f = $("#form-login"); const erro = (m) => { $("#lg-erro").textContent = m; };
  const dados = () => [$("#lg-email").value.trim(), $("#lg-senha").value];
  f.onsubmit = async (e) => { e.preventDefault(); erro("Entrando...");
    try { const tinha = await DPSync.entrar(...dados()); fecharFolha(); if (!S) S = padrao(), salvar(); render(); toast(tinha ? "Dados da nuvem carregados ☁️💗" : "Conectada! Enviando seus dados ☁️"); }
    catch (x) { erro(x.message); } };
  $("#lg-criar").onclick = async () => { if (!f.reportValidity()) return; erro("Criando conta...");
    try { const r = await DPSync.criarConta(...dados()); if (r === "confirmar") erro("Conta criada! Confirme pelo link no e-mail e depois toque em Entrar.");
      else { fecharFolha(); if (!S) { S = padrao(); salvar(); } render(); toast("Conta criada ☁️💗"); } }
    catch (x) { erro(x.message); } };
}
function statusNuvem(st, detalhe) {
  const txt = { ok: "sincronizado", enviando: "sincronizando…", offline: "sem internet", erro: "erro na nuvem", "sem-login": "entrar na nuvem" }[st];
  for (const el of [$("#nuvem-topo"), $("#nuvem-lateral")]) {
    if (!el) continue; el.className = "nuvem " + st + (txt ? "" : " hidden"); el.textContent = txt || "";
    el.title = detalhe || "Sincronização entre computador e iPhone";
  }
}

/* ---------------- início ---------------- */
render();
if (window.DPInterativo) DPInterativo.iniciar(
  { estado: () => S, salvar: (x) => salvar(x), toast, primeiroNome },
  { lotou: () => { const j = F.janela(S.fornada); return S.fornada.limite > 0 && pedidosDaFornada(j.semana).filter((p) => !p.exemplo).length >= S.fornada.limite; },
    vendasMes: () => { const m = hoje().slice(0, 7); return S.pedidos.filter((p) => !p.exemplo && p.status !== "cancelado" && p.data.startsWith(m)).reduce((s, p) => s + total(p), 0); } });
if (window.DPSync) DPSync.iniciar({
  obter: () => S,
  vitrine: () => (S ? vitrine() : null),
  importar: (lista) => (S ? importarSite(lista) : []),
  substituir: (d) => {
    localStorage.setItem(CHAVE, JSON.stringify(d)); S = carregar();
    const editando = form || $("#folha.aberta"); if (!editando) render(); else desenharMenus((location.hash.slice(1) || "inicio").split("/")[0]);
  },
  aoMudarStatus: statusNuvem
});
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").then(() => avisarDoDia()).catch(() => avisarDoDia());
else avisarDoDia();
setInterval(() => { if (S && document.visibilityState === "visible" && !$("#folha.aberta") && !form) { const r = location.hash.slice(1).split("/")[0] || "inicio"; if (r === "inicio" || r === "agenda") render(); } }, 5 * 60 * 1000);

/* ---------------- API interna (usada pelo assistente Pedacinho) ---------------- */
setTimeout(() => { if (window.DPAssistente) DPAssistente.iniciar(); }, 0);
window.DPApp = {
  estado: () => S, salvar, render, toast, abrirZap, copiar,
  total, saldo, situacaoPg, nomeStatus, STATUS, pedido, cliente, produto, categorias, statsCliente,
  lembretes, mensagem, linkZap, telefone, situFornada, pedidosDaFornada, fornadaDe, diasParaPedido, vitrine,
  hoje, addDias, difDias, fmtData, fmtDataCurta, relativo, brl, normal, uid, primeiroNome, resumoItens, ativo,
  novoPedido(dados) {
    let c = S.clientes.find((x) => normal(x.nome) === normal(dados.clienteNome)) ||
      (dados.telefone && S.clientes.find((x) => x.telefone && telefone(x.telefone) === telefone(dados.telefone)));
    if (!c) { c = { id: uid(), nome: dados.clienteNome, telefone: dados.telefone || "", instagram: "", aniversario: "", endereco: dados.endereco || "", origem: "WhatsApp", obs: "", criadoEm: new Date().toISOString(), brindesUsados: 0 }; S.clientes.push(c); }
    else if (dados.telefone && !c.telefone) c.telefone = dados.telefone;
    const p = { id: uid(), numero: S.proximoNumero++, status: "novo", clienteId: c.id, itens: dados.itens, data: dados.data, hora: dados.hora || "",
      tipo: dados.tipo || "retirada", endereco: dados.tipo === "entrega" ? (dados.endereco || c.endereco || "") : "",
      taxa: dados.tipo === "entrega" ? (S.fornada.taxaEntrega || 0) : 0, desconto: 0, pago: 0, forma: "Pix", origem: dados.origem || "WhatsApp",
      obs: dados.obs || "", criadoEm: new Date().toISOString(), atualizadoEm: new Date().toISOString() };
    S.pedidos.push(p); salvar(); return p;
  },
  confete: (n) => M.confete(n)
};
})();

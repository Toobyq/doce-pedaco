/* ============================================================
   Doce Pedaço — painel interativo
   • Tour guiado com o Pedacinho (mascote)
   • Conquistas (com confete quando desbloqueia)
   • Números que "contam" e animações de entrada
   O app.js chama DPInterativo.depoisRender(rota) e .depoisSalvar().
   ============================================================ */
(() => {
"use strict";
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const M = window.DPMimos;
let app = null; // { estado(), salvar(), toast(), primeiroNome() }

const PEDACINHO = () => M.desenho("bolo");

/* ---------------- tour ---------------- */
const PASSOS = [
  { rota: "inicio", alvo: null, txt: (n) => `Oi${n ? ", " + n : ""}! Eu sou o <b>Pedacinho</b> 🍰<br>Vou te mostrar seu caderninho rapidinho. Leva menos de um minuto, prometo!` },
  { rota: "inicio", alvo: [".fornada-card"], txt: () => "Essa é a <b>fornada da semana</b>. Cada coraçãozinho é uma vaga: quando chega pedido, ele fica rosinha ♥" },
  { rota: "inicio", alvo: [".estado-selo"], txt: () => "Esse selo mostra se os pedidos estão abertos. <b>Toca nele pra pausar</b> quando a cozinha lotar. Sem culpa 💜" },
  { rota: "inicio", alvo: [".barra .mais-btn", '#menu-lateral a[href="#novo-pedido"]'], txt: () => "Alguém pediu por mensagem? Toca no <b>+</b> e anota em segundos. Pedido do site entra <b>sozinho</b>, com confete 🎉" },
  { rota: "inicio", alvo: [".tela .grade.g2 .card"], txt: () => "Aqui ficam as <b>tarefas do dia</b>. Eu te lembro de tudo: confirmar, produzir, entregar, cobrar e pedir avaliação." },
  { rota: "fornada", alvo: [".tela .card.fita"], txt: () => "Na aba <b>Fornada</b> você escolhe o que vai ter na semana, o limite de pedidos e os dias de entrega." },
  { rota: "ideias", alvo: [".tela .chips"], txt: () => "E aqui tem <b>ideias novas e o que está em alta</b>, pesquisado todo dia. Gostou de uma? Um toque e ela vai pro seu cardápio ✨" },
  { rota: "inicio", alvo: null, txt: () => "Prontinho! Se quiser rever, o tour fica em <b>Ajustes</b>.<br>Bora fazer doce? 🧁", fim: true }
];
let passo = -1;
function visivel(el) { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden"; }
function acharAlvo(lista) { for (const s of lista || []) { const el = $$(s).find(visivel); if (el) return el; } return null; }

function montarTour() {
  if ($("#tour")) return;
  const d = document.createElement("div"); d.id = "tour"; d.innerHTML = `
    <div class="tour-foco"></div>
    <div class="tour-balao" role="dialog" aria-live="polite">
      <span class="tour-mascote">${PEDACINHO()}</span>
      <div class="tour-texto"></div>
      <div class="tour-pe"><span class="tour-pontos"></span><span><button class="btn mini borda" data-tour="pular">pular</button> <button class="btn mini rosa" data-tour="prox">próximo →</button></span></div>
    </div>`;
  document.body.append(d);
  d.addEventListener("click", (e) => { const b = e.target.closest("[data-tour]"); if (!b) return; b.dataset.tour === "pular" ? fimTour() : irPasso(passo + 1); });
  addEventListener("resize", posicionar);
}
function irPasso(i) {
  if (i >= PASSOS.length) return fimTour();
  passo = i; const p = PASSOS[i];
  const atual = (location.hash.slice(1) || "inicio").split("/")[0];
  if (atual !== p.rota) { location.hash = "#" + p.rota; setTimeout(() => mostrar(p), 380); } else mostrar(p);
}
function mostrar(p) {
  const S = app.estado(); const nome = S && S.config.dona ? app.primeiroNome(S.config.dona) : "";
  $("#tour").classList.add("on");
  $(".tour-texto").innerHTML = p.txt(nome);
  $(".tour-pontos").innerHTML = PASSOS.map((_, k) => `<i class="${k === passo ? "on" : ""}"></i>`).join("");
  $('[data-tour="prox"]').textContent = p.fim ? "bora! 🧁" : "próximo →";
  $('[data-tour="pular"]').style.display = p.fim ? "none" : "";
  const alvo = acharAlvo(p.alvo);
  if (alvo) alvo.scrollIntoView({ block: "center", behavior: "smooth" });
  setTimeout(posicionar, alvo ? 350 : 0);
  const b = $(".tour-balao"); b.classList.remove("pula"); void b.offsetWidth; b.classList.add("pula");
}
function posicionar() {
  if (passo < 0 || !$("#tour.on")) return;
  const alvo = acharAlvo(PASSOS[passo].alvo); const foco = $(".tour-foco"); const b = $(".tour-balao");
  if (!alvo) { foco.style.cssText = "left:50%;top:50%;width:0;height:0"; b.style.cssText = "left:50%;top:50%;transform:translate(-50%,-50%)"; return; }
  const r = alvo.getBoundingClientRect(); const m = 8;
  foco.style.cssText = `left:${r.left - m}px;top:${r.top - m}px;width:${r.width + m * 2}px;height:${r.height + m * 2}px`;
  const bw = Math.min(340, innerWidth - 24); const bh = b.offsetHeight || 170;
  let top = r.bottom + 16; if (top + bh > innerHeight - 12) top = Math.max(12, r.top - bh - 16);
  let left = Math.min(Math.max(12, r.left + r.width / 2 - bw / 2), innerWidth - bw - 12);
  b.style.cssText = `left:${left}px;top:${top}px;width:${bw}px`;
}
function fimTour() {
  const S = app.estado(); $("#tour")?.classList.remove("on"); passo = -1;
  if (S && !S.config.tourVisto) { S.config.tourVisto = new Date().toISOString(); app.salvar(); M.confete(70); }
  if ((location.hash.slice(1) || "inicio").split("/")[0] !== "inicio") location.hash = "#inicio";
}
function iniciarTour() { montarTour(); irPasso(0); }

/* ---------------- conquistas ---------------- */
const CONQUISTAS = [
  { id: "primeiro-pedido", emoji: "🧁", nome: "Primeiro pedido", desc: "Anotou o primeiro pedido no caderninho", ok: (S) => S.pedidos.some((p) => !p.exemplo) },
  { id: "primeiro-site", emoji: "💌", nome: "Chegou pelo site!", desc: "Recebeu um pedido direto do site", ok: (S) => S.pedidos.some((p) => p.siteId) },
  { id: "dez-pedidos", emoji: "🔟", nome: "Dez pedidos", desc: "10 pedidos anotados", ok: (S) => S.pedidos.filter((p) => !p.exemplo && p.status !== "cancelado").length >= 10 },
  { id: "cinquenta", emoji: "🏅", nome: "Cinquentinha", desc: "50 pedidos anotados", ok: (S) => S.pedidos.filter((p) => !p.exemplo && p.status !== "cancelado").length >= 50 },
  { id: "dez-clientes", emoji: "💗", nome: "Dez clientes", desc: "10 clientes no caderninho", ok: (S) => S.clientes.filter((c) => !c.exemplo).length >= 10 },
  { id: "fiel", emoji: "🥹", nome: "Cliente fiel", desc: "Uma cliente voltou pra pedir de novo", ok: (S) => { const n = {}; S.pedidos.filter((p) => !p.exemplo && p.status !== "cancelado").forEach((p) => n[p.clienteId] = (n[p.clienteId] || 0) + 1); return Object.values(n).some((v) => v >= 2); } },
  { id: "lotou", emoji: "🔥", nome: "Fornada lotada", desc: "Preencheu todas as vagas de uma fornada", ok: (S, h) => h.lotou() },
  { id: "mil", emoji: "💰", nome: "Primeiro mil", desc: "R$ 1.000 em vendas num mês", ok: (S, h) => h.vendasMes() >= 1000 },
  { id: "meta", emoji: "🎯", nome: "Meta batida!", desc: "Bateu a meta de vendas do mês", ok: (S, h) => S.config.metaMensal > 0 && h.vendasMes() >= S.config.metaMensal },
  { id: "brinde", emoji: "🎁", nome: "Cartão completo", desc: "Uma cliente completou o cartão fidelidade", ok: (S) => S.clientes.some((c) => (c.brindesUsados || 0) > 0) },
  { id: "fotografa", emoji: "📸", nome: "Fotógrafa", desc: "Colocou foto em 3 doces", ok: (S) => S.produtos.filter((p) => p.foto && !String(p.foto).startsWith("assets/")).length >= 3 },
  { id: "inventora", emoji: "✨", nome: "Inventora", desc: "Trouxe uma ideia nova pro cardápio", ok: (S) => S.produtos.some((p) => String(p.id).startsWith("i-")) }
];
let ajudantes = null;
function conferirConquistas(silencioso) {
  const S = app.estado(); if (!S || !ajudantes) return;
  if (!S.conquistas) silencioso = true; // primeira vez: só registra o que já existia
  S.conquistas = S.conquistas || {}; const novas = [];
  for (const c of CONQUISTAS) if (!S.conquistas[c.id]) { try { if (c.ok(S, ajudantes)) { S.conquistas[c.id] = new Date().toISOString(); novas.push(c); } } catch {} }
  if (!novas.length) return;
  app.salvar(true);
  if (silencioso) return;
  novas.forEach((c, i) => setTimeout(() => mostrarConquista(c), 900 + i * 2600));
}
function mostrarConquista(c) {
  const d = document.createElement("div"); d.className = "conquista-pop";
  d.innerHTML = `<span class="conquista-emoji">${c.emoji}</span><div><small>conquista desbloqueada!</small><b>${c.nome}</b><span>${c.desc}</span></div>`;
  document.body.append(d); M.confete(80);
  requestAnimationFrame(() => d.classList.add("on"));
  setTimeout(() => { d.classList.remove("on"); setTimeout(() => d.remove(), 400); }, 3800);
}
function htmlConquistas() {
  const S = app.estado(); const feitas = S.conquistas || {};
  const n = CONQUISTAS.filter((c) => feitas[c.id]).length;
  return `<div class="card secao fita"><div class="card-titulo"><h2>Conquistas</h2><span class="tag st-confirmado sem-ponto">${n} de ${CONQUISTAS.length}</span></div>
    <div class="conquistas">${CONQUISTAS.map((c) => `<div class="conquista ${feitas[c.id] ? "on" : ""}" title="${c.desc}"><span>${feitas[c.id] ? c.emoji : "🔒"}</span><b>${c.nome}</b><small>${c.desc}</small></div>`).join("")}</div></div>`;
}

/* ---------------- números que contam + entrada ---------------- */
function contar(el) {
  const txt = el.textContent.trim(); const moeda = txt.includes("R$");
  const alvo = parseFloat(txt.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".")); if (!isFinite(alvo) || alvo === 0) return;
  const t0 = performance.now(), dur = 750;
  const fmt = (v) => moeda ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : String(Math.round(v));
  const passo = (t) => { const k = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(alvo * e); if (k < 1) requestAnimationFrame(passo); else el.textContent = txt; };
  requestAnimationFrame(passo);
}

window.DPInterativo = {
  iniciar(api, helpers) { app = api; ajudantes = helpers; conferirConquistas(true); },
  iniciarTour,
  htmlConquistas,
  depoisRender(rota) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (rota === "inicio") $$(".numero strong").forEach(contar);
    const S = app && app.estado();
    if (S && !S.config.tourVisto && passo < 0 && rota === "inicio" && !$("#tour.on")) setTimeout(() => { if (!$("#tour.on")) iniciarTour(); }, 900);
    if (passo >= 0) setTimeout(posicionar, 60);
  },
  depoisSalvar() { clearTimeout(this._t); this._t = setTimeout(() => conferirConquistas(false), 400); }
};
})();

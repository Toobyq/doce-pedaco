/* ============================================================
   Doce Pedaço — site público
   Com a nuvem ligada (config.js → nuvem): lê a vitrine ao vivo
   (cardápio da semana, vagas, pausa) e grava o pedido direto no
   banco, que confere todas as regras. Sem a nuvem: mostra o
   cardápio do config.js e envia o pedido pelo WhatsApp.
   ============================================================ */
(() => {
"use strict";
const CFG = window.DP_CONFIG, F = window.DPFornada, M = window.DPMimos;
const $ = (s, el = document) => el.querySelector(s);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const brl = (n) => (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const z2 = (n) => String(n).padStart(2, "0");
const ddmm = (s) => { const d = F.parse(s); return `${z2(d.getDate())}/${z2(d.getMonth() + 1)}`; };
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const NUVEM = CFG.nuvem || {};
const temNuvem = !!(NUVEM.url && NUVEM.chave);

let V = null;            // vitrine
let filtro = null;       // selo escolhido (vegano, low carb...)
// de onde a cliente veio: ?origem=anuncio, ?utm_source=instagram ou o site anterior
const origem = (() => {
  try {
    const u = new URLSearchParams(location.search);
    let o = u.get("origem") || u.get("utm_source") || u.get("ref") || sessionStorage.getItem("dp-origem") || "";
    if (!o && /instagram/i.test(document.referrer)) o = "instagram";
    else if (!o && /facebook|fb\./i.test(document.referrer)) o = "facebook";
    else if (!o && /google/i.test(document.referrer)) o = "google";
    o = o.toLowerCase().replace(/[^a-z0-9 _-]/g, "").slice(0, 40);
    if (o) sessionStorage.setItem("dp-origem", o);
    const f = u.get("filtro"); if (f) filtro = f.toLowerCase();
    return o;
  } catch { return ""; }
})();
let offset = 0;          // diferença entre o relógio do servidor e o do aparelho
const qtd = {};
let receber = null, dia = null;
const agora = () => new Date(Date.now() + offset);

/* ---------- dados ---------- */
async function rpc(nome, corpo) {
  const h = { apikey: NUVEM.chave, "Content-Type": "application/json" };
  if (/^eyJ/.test(NUVEM.chave)) h.Authorization = `Bearer ${NUVEM.chave}`;
  const r = await fetch(`${NUVEM.url.replace(/\/+$/, "")}/rest/v1/rpc/${nome}`, { method: "POST", headers: h, body: JSON.stringify(corpo || {}) });
  const j = await r.json().catch(() => null);
  if (!r.ok) { const e = new Error((j && (j.message || j.hint)) || `erro ${r.status}`); e.status = r.status; throw e; }
  return j;
}
function vitrineLocal() {
  const fornada = F.config(CFG.fornada);
  const j = F.janela(fornada, agora());
  return {
    local: true, loja: { nome: CFG.nome, instagram: CFG.instagram, whatsapp: CFG.whatsapp }, fornada,
    itens: CFG.cardapio.filter((p) => p.ativo !== false && p.naFornada !== false),
    semana: j.semana, abre: j.abre, fecha: j.fecha, usados: 0, vendidos: {}
  };
}
async function carregar() {
  if (temNuvem) {
    try {
      const v = await rpc("vitrine_publica");
      if (v) {
        offset = Date.parse(v.agora) - Date.now();
        V = { ...v, fornada: F.config(v.fornada), abre: new Date(v.abre), fecha: new Date(v.fecha) };
        return desenhar();
      }
    } catch (e) { console.warn("[vitrine]", e); }
  }
  V = vitrineLocal(); desenhar();
}

/* ---------- situação ---------- */
function situ() {
  const f = V.fornada; const a = agora();
  const vagas = f.limite > 0 ? Math.max(0, f.limite - (V.usados || 0)) : Infinity;
  let estado = "aberto";
  if (a < V.abre) estado = "antes";
  else if (a >= V.fecha) estado = "antes"; // virou a semana: recarrega
  else if (f.pausadoSemana === V.semana) estado = "pausado";
  else if (vagas <= 0) estado = "esgotado";
  return { estado, vagas };
}
const restante = (p) => p.limite ? Math.max(0, Number(p.limite) - Number((V.vendidos || {})[p.id] || 0)) : Infinity;
const fechaTexto = () => V.fornada.estenderQuarta ? `quarta às ${V.fornada.fimQuarta.replace(":00", "h")}` : "terça às 23h59";

/* ---------- desenhar ---------- */
function desenhar() {
  const s = situ(); const f = V.fornada; const n = F.numero(V.semana);
  const ter = F.parse(V.semana); const sab = F.parse(F.addDias(V.semana, 4));
  const loja = V.loja || {};
  document.body.dataset.estado = s.estado;

  // links
  const insta = loja.instagram ? `https://instagram.com/${loja.instagram}` : null;
  const zap = String(loja.whatsapp || "").replace(/\D/g, "");
  for (const [id, url] of [["nav-insta", insta], ["rod-insta", insta], ["rod-zap", zap ? `https://wa.me/${zap}` : null]]) {
    const a = document.getElementById(id); if (!a) continue; if (url) a.href = url; else a.classList.add("hidden");
  }
  if (!insta && !zap) $(".s-rodape-links").classList.add("hidden");

  // hero
  $("#hero-fornada").textContent = `fornada nº ${n} · ${ter.getDate()} a ${sab.getDate()} de ${MESES[sab.getMonth()]}`;
  const fechaDia = new Date(V.fecha.getTime() - 60000);
  $("#selo-data").textContent = `${z2(fechaDia.getDate())} / ${z2(fechaDia.getMonth() + 1)} / ${String(fechaDia.getFullYear()).slice(2)}`;
  const anel = {
    aberto: `pedidos abertos ♡ até ${fechaTexto()} ♡ `,
    antes: "pedidos fechados ♡ abrem na terça ♡ ",
    pausado: "pausadinho ♡ volta na terça ♡ ",
    esgotado: "esgotou ♡ obrigada pelo carinho ♡ "
  }[s.estado];
  $("#anel-texto").textContent = (anel + anel).toUpperCase();
  const vagasTxt = s.vagas !== Infinity ? (s.vagas <= 5 ? `só ${s.vagas} ${s.vagas === 1 ? "vaga" : "vagas"}!` : `restam ${s.vagas} vagas`) : "";
  const post = {
    aberto: [`fecha em ${F.falta(V.fecha, agora())}`, vagasTxt || "corre que é por pouco tempo ♡"],
    antes: [`abre em ${F.falta(V.abre, agora())}`, "terça tem cardápio novinho"],
    pausado: ["fornada completinha 🥹", "volta na terça que vem ♡"],
    esgotado: ["esgotou tudinho!", "obrigada pelo carinho ♡"]
  }[s.estado];
  $("#postit-1").textContent = post[0]; $("#postit-2").textContent = post[1];
  $("#hero-nota").textContent = { aberto: "← os pedidos estão abertos!", antes: "dá uma espiadinha ♡", pausado: "", esgotado: "" }[s.estado];
  $("#hero-cta").textContent = s.estado === "aberto" ? "fazer meu pedido ♡" : "espiar o cardápio";
  $("#topo-cta").textContent = s.estado === "aberto" ? "fazer pedido ♡" : "ver cardápio";

  // semana
  const hojeDow = agora().getDay(); // 0 dom
  const passo = (hojeDow === 2 || (hojeDow === 3 && s.estado === "aberto")) ? 0 : hojeDow === 3 ? 1 : hojeDow >= 4 && hojeDow <= 6 ? 2 : -1;
  const diasTxt = F.diasEntrega(f, V.semana).filter((d) => !d.noite).map((d) => d.rotulo.toLowerCase());
  const formas = [f.retirada && "retirar comigo", f.entrega && "receber em casa"].filter(Boolean).join(" ou ");
  const passos = [
    ["terça", "pedidos abertos", `O dia todinho${f.estenderQuarta ? `, e quarta até ${f.fimQuarta.replace(":00", "h")}` : ""}. O cardápio muda toda semana, então fica de olho!`],
    ["quarta", "mãos na massa", `Tudo feito fresquinho, em pequenas fornadas.${f.entregaQuartaNoite ? " Quem escolher já recebe à noite ♡" : ""}`],
    ["quinta+", "chega até você", `Você escolhe o dia (${diasTxt.join(", ").replace(/, ([^,]*)$/, " ou $1")}) e se prefere ${formas}.`]
  ];
  $("#semana").innerHTML = passos.map(([d, t, p], i) => `<li class="${i === passo ? "agora" : ""}">${i === passo ? '<span class="aqui">estamos aqui!</span>' : ""}
    <span class="dia">${d}<small>${t}</small></span><p>${esc(p)}</p></li>`).join("");

  // aviso + título
  const aviso = $("#aviso");
  const msgs = {
    antes: ["psiu!", `Os pedidos dessa fornada abrem na terça, ${ddmm(V.semana)}. Dá uma espiadinha no que vem por aí ♡`],
    pausado: ["pausadinho!", "A fornada dessa semana já está completinha. Obrigada pelo carinho! Na terça que vem abre de novo ♡"],
    esgotado: ["esgotou!", "Todas as vagas dessa fornada foram preenchidas 🥹 Na terça que vem tem mais ♡"]
  }[s.estado];
  const recado = (f.recadinho || "").trim();
  const zapAviso = String((V.loja || {}).whatsapp || "").replace(/\D/g, "");
  const avisa = zapAviso ? `<a class="btn mini rosa" href="https://wa.me/${zapAviso}?text=${encodeURIComponent("Oi! Quero ser avisada quando a próxima fornada da Doce Pedaço abrir 💗")}" target="_blank" rel="noopener">me avisa quando abrir</a>`
    : (V.loja || {}).instagram ? `<a class="btn mini rosa" href="https://instagram.com/${esc(V.loja.instagram)}" target="_blank" rel="noopener">seguir no instagram</a>` : "";
  if (msgs) { aviso.className = "s-aviso"; aviso.innerHTML = `<span class="mao">${msgs[0]}</span><span style="flex:1">${esc(msgs[1])}</span>${avisa}`; }
  else if (recado) { aviso.className = "s-aviso recado"; aviso.innerHTML = `<span class="mao">recadinho:</span><span>${esc(recado)}</span>`; }
  else if (s.vagas !== Infinity && s.vagas <= 5) { aviso.className = "s-aviso aberto"; aviso.innerHTML = `<span class="mao">corre!</span><span>Só ${s.vagas} ${s.vagas === 1 ? "vaga" : "vagas"} nessa fornada.</span>`; }
  else aviso.className = "s-aviso hidden";
  $("#fornada-sobre").textContent = s.estado === "antes" ? "espiadinha da próxima" : "muda toda semana!";
  $("#fornada-titulo").innerHTML = `O que tem na <em class="doce">fornada nº ${n}</em>`;

  // cardápio
  const pode = s.estado === "aberto";
  const selos = [...new Set(V.itens.flatMap((p) => p.tags || []))];
  if (filtro && !selos.includes(filtro)) filtro = null;
  const itens = V.itens.filter((p) => !filtro || (p.tags || []).includes(filtro));
  const cats = [...new Set(itens.map((p) => p.categoria || "Doces"))];
  $("#cardapio").className = "s-cardapio" + (pode ? "" : " espiadinha");
  $("#cardapio").innerHTML = (selos.length ? `<div class="chips s-filtros"><button type="button" class="chip ${!filtro ? "ativo" : ""}" data-filtro="">tudo</button>${selos.map((t) => `<button type="button" class="chip ${filtro === t ? "ativo" : ""}" data-filtro="${esc(t)}">${t === "vegano" ? "🌱 " : t === "low carb" ? "💚 " : ""}${esc(t)}</button>`).join("")}</div>` : "") +
    (V.itens.length ? cats.map((c) => `<div class="s-cat"><h3>${esc(c)}</h3></div><div class="s-grade">` +
    itens.filter((p) => (p.categoria || "Doces") === c).map((p) => {
      const r = restante(p); const q = qtd[p.id] || 0;
      return `<article class="s-prod ${q ? "sel" : ""} ${p.foto ? "com-foto" : ""}" id="p-${esc(p.id)}">
        ${r !== Infinity && r > 0 && r <= 5 ? `<span class="s-poucos">últimas ${r}!</span>` : ""}
        ${p.foto ? `<div class="s-prod-foto"><img src="${esc(p.foto)}" alt="${esc(p.nome)}" loading="lazy"></div>` : `<div class="s-prod-desenho">${M.desenhoDoProduto(p)}</div>`}
        <h4>${esc(p.nome)}</h4><p>${esc(p.descricao || "")}${(p.tags || []).length ? `<span class="s-tags">${p.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</span>` : ""}</p>
        <div class="s-prod-pe"><span class="s-preco">${brl(p.preco)}</span>
          <div class="s-qtd">${q ? `<button type="button" data-id="${esc(p.id)}" data-d="-1" aria-label="Tirar um ${esc(p.nome)}">−</button><output>${q}</output>` : ""}
          <button type="button" class="add" data-id="${esc(p.id)}" data-d="1" aria-label="Adicionar ${esc(p.nome)}" ${q >= r ? "disabled" : ""}>+</button></div></div>
        ${r === 0 ? '<div class="s-esgotou"><span>esgotou</span></div>' : ""}
      </article>`;
    }).join("") + "</div>").join("") : `<p class="muted">O cardápio dessa fornada ainda está sendo preparado ♡</p>`);

  // galeria de fotos reais
  const gal = (CFG.galeria || []).filter((g) => g && g.foto);
  $("#cozinha").classList.toggle("hidden", !gal.length);
  if (gal.length && !$("#polaroids").children.length) $("#polaroids").innerHTML = gal.map((g) => `<figure class="s-polaroid fita"><img src="${esc(g.foto)}" alt="${esc(g.legenda || "")}" loading="lazy"><figcaption class="mao">${esc(g.legenda || "")}</figcaption></figure>`).join("");

  // depoimentos reais (config.js → depoimentos)
  const dep = (CFG.depoimentos || []).filter((d) => d && d.texto);
  $("#depoimentos").classList.toggle("hidden", !dep.length);
  if (dep.length) $("#dep-lista").innerHTML = dep.map((d) => `<figure class="postit s-dep"><blockquote class="mao">“${esc(d.texto)}”</blockquote><figcaption>${esc(d.nome || "")}</figcaption></figure>`).join("");

  // pedido
  if (!pode) for (const k in qtd) delete qtd[k];
  desenharPedido(pode);
  document.querySelectorAll("[data-desenho]").forEach((el) => { if (!el.innerHTML) el.innerHTML = M.desenho(el.dataset.desenho); });
}

function itensEscolhidos() { return V.itens.filter((p) => qtd[p.id] > 0).map((p) => ({ ...p, qtd: qtd[p.id] })); }
function totais() {
  const it = itensEscolhidos(); const sub = it.reduce((s, p) => s + p.qtd * p.preco, 0);
  const taxa = receber === "entrega" ? Number(V.fornada.taxaEntrega || 0) : 0;
  return { it, n: it.reduce((s, p) => s + p.qtd, 0), sub, taxa, total: sub + taxa };
}
function desenharPedido(pode) {
  const t = totais(); const f = V.fornada;
  $("#pedido").classList.toggle("hidden", !pode || !t.n);
  const sac = $("#sacola"); const antes = sac.classList.contains("on");
  sac.classList.toggle("on", pode && t.n > 0);
  $("#sacola-qtd").textContent = t.n; $("#sacola-txt").textContent = t.n === 1 ? "docinho" : "docinhos"; $("#sacola-total").textContent = brl(t.sub);
  if (antes && t.n) { sac.classList.remove("pulo"); void sac.offsetWidth; sac.classList.add("pulo"); }
  if (!pode || !t.n) return;
  $("#resumo").innerHTML = t.it.map((p) => `<li><span><b>${p.qtd}×</b>${esc(p.nome)}</span><span>${brl(p.qtd * p.preco)}</span></li>`).join("") +
    (t.taxa ? `<li><span>entrega</span><span>${brl(t.taxa)}</span></li>` : "");
  const dias = F.diasEntrega(f, V.semana);
  if (!dias.some((d) => d.data === dia)) dia = dias.find((d) => !d.noite)?.data || dias[0].data;
  $("#dias").innerHTML = dias.map((d) => `<button type="button" class="chip ${d.data === dia ? "ativo" : ""}" data-dia="${d.data}">${d.rotulo}<small>${ddmm(d.data)}${d.noite ? " · a partir das " + d.hora.replace(":00", "h") : ""}</small></button>`).join("");
  const formas = [f.retirada && ["retirada", "vou retirar", "combinamos o lugar"], f.entrega && ["entrega", "quero receber", Number(f.taxaEntrega) ? `+ ${brl(f.taxaEntrega)}` : "em casa"]].filter(Boolean);
  if (!formas.some((x) => x[0] === receber)) receber = formas[0][0];
  $("#receber").innerHTML = formas.map(([id, r, sub]) => `<button type="button" class="chip ${id === receber ? "ativo" : ""}" data-receber="${id}">${r}<small>${sub}</small></button>`).join("");
  $("#linha-end").classList.toggle("hidden", receber !== "entrega");
  $("#total").textContent = brl(t.total);
}

/* ---------- interações ---------- */
document.addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.id) {
    const p = V.itens.find((x) => x.id === b.dataset.id); if (!p) return;
    qtd[p.id] = Math.max(0, Math.min(restante(p), (qtd[p.id] || 0) + Number(b.dataset.d), 30));
    desenhar(); const el = document.getElementById("p-" + p.id); el && el.querySelector(".add")?.focus({ preventScroll: true });
  } else if (b.dataset.filtro !== undefined) { filtro = b.dataset.filtro || null; desenhar(); }
  else if (b.dataset.dia) { dia = b.dataset.dia; desenharPedido(true); }
  else if (b.dataset.receber) { receber = b.dataset.receber; desenharPedido(true); if (receber === "entrega") $("#end").focus(); }
});

function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 3200); }
const ERROS = {
  antes: "Os pedidos dessa fornada ainda não abriram ♡", pausado: "Ai! A fornada acabou de ser pausada 🥹", esgotado: "Ai, as vagas acabaram agorinha 🥹",
  fechado: "Os pedidos estão fechados no momento.", telefone: "Confere o seu WhatsApp? Coloca com DDD ♡", repetido: "Você já fez 3 pedidos nessa fornada. Me chama no WhatsApp ♡",
  dia: "Escolhe um dos dias de entrega ♡", recebimento: "Escolhe se vai retirar ou receber ♡", vazio: "Escolhe pelo menos um docinho ♡", item: "Um dos itens saiu do cardápio. Atualizei pra você ♡", qtd: "Quantidade inválida."
};

$("#form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const erro = (m) => { $("#erro").textContent = m || ""; };
  const t = totais(); const nome = $("#nome").value.trim(); const tel = $("#tel").value.replace(/\D/g, "");
  if (!t.n) return erro(ERROS.vazio);
  if (nome.length < 2) { $("#nome").focus(); return erro("Me conta seu nome ♡"); }
  if (tel.length < 10) { $("#tel").focus(); return erro(ERROS.telefone); }
  if (receber === "entrega" && $("#end").value.trim().length < 5) { $("#end").focus(); return erro("Falta o endereço pra entrega ♡"); }
  erro("");
  const pedido = { nome, telefone: tel, itens: t.it.map((p) => ({ id: p.id, qtd: p.qtd })), entrega_dia: dia, recebimento: receber, endereco: $("#end").value.trim(), obs: $("#obs").value.trim(), origem };
  const dObj = F.diasEntrega(V.fornada, V.semana).find((d) => d.data === dia);
  const msg = [`Oi! Fiz um pedido na Doce Pedaço 💗`, "", ...t.it.map((p) => `• ${p.qtd}x ${p.nome} — ${brl(p.qtd * p.preco)}`), "", `Total: ${brl(t.total)}`, "",
    `Nome: ${nome}`, `Data: ${dObj.rotulo.toLowerCase()}, ${ddmm(dia)}/${dia.slice(0, 4)}`, ...(dObj.noite ? [`Horário: ${dObj.hora}`] : []),
    `Receber: ${receber === "entrega" ? "🛵 Entrega" : "🛍️ Retirada"}`, ...(receber === "entrega" ? [`Endereço: ${pedido.endereco}`] : []), ...(pedido.obs ? [`Obs: ${pedido.obs}`] : [])].join("\n");
  const zap = String((V.loja || {}).whatsapp || "").replace(/\D/g, "");

  if (V.local) {
    if (!zap) return erro("Os pedidos online abrem em breve! Enquanto isso, chama no Instagram ♡");
    window.open(`https://wa.me/${zap}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
    return sucesso(nome, t, dObj, false, zap, msg);
  }
  const btn = $("#enviar"); btn.disabled = true; btn.textContent = "enviando…";
  try {
    await rpc("fazer_pedido", { p: pedido });
    sucesso(nome, t, dObj, true, zap, msg);
  } catch (x) {
    const cod = String(x.message || "").split(":")[0];
    if (cod === "acabou") erro(`Ai, acabou ${x.message.split(":").slice(1).join(":")} 🥹 Diminui ou troca esse item ♡`);
    else erro(ERROS[cod] || "Não consegui enviar agora. Confere a internet e tenta de novo ♡");
    carregar();
  } finally { btn.disabled = false; btn.textContent = "enviar meu pedido ♡"; }
});

function sucesso(nome, t, dObj, gravado, zap, msg) {
  const primeiro = nome.split(/\s+/)[0];
  $("#ok-titulo").textContent = `Obrigada, ${primeiro}! ♡`;
  $("#ok-texto").textContent = gravado
    ? `Seu pedido para ${dObj.rotulo.toLowerCase()} (${ddmm(dObj.data)}) chegou aqui! Vou te chamar no WhatsApp pra combinar o pagamento e ${receber === "entrega" ? "a entrega" : "onde você retira"}.`
    : "Agora é só enviar a mensagem que abriu no WhatsApp. Eu confirmo tudinho por lá!";
  $("#ok-resumo").innerHTML = t.it.map((p) => `<li><span><b>${p.qtd}×</b>${esc(p.nome)}</span><span>${brl(p.qtd * p.preco)}</span></li>`).join("") + `<li><span><b>total</b></span><span><b>${brl(t.total)}</b></span></li>`;
  $("#ok-acoes").innerHTML = (zap ? `<a class="btn zap" href="https://wa.me/${zap}?text=${encodeURIComponent(gravado ? `Oi! Acabei de fazer meu pedido pelo site 💗 (${primeiro}, ${dObj.rotulo.toLowerCase()} ${ddmm(dObj.data)})` : msg)}" target="_blank" rel="noopener">${gravado ? "mandar um oi no WhatsApp" : "abrir o WhatsApp de novo"}</a>` : "") +
    `<button class="btn borda" type="button" id="de-novo">fazer outro pedido</button>`;
  for (const k in qtd) delete qtd[k];
  $("#pedido").classList.add("hidden"); $("#sacola").classList.remove("on"); $("#sucesso").classList.remove("hidden");
  $("#sucesso").scrollIntoView({ behavior: "smooth", block: "start" }); M.confete();
  $("#de-novo").onclick = () => { $("#sucesso").classList.add("hidden"); carregar(); location.hash = "#fornada"; };
  if (gravado) carregar();
}

// some a sacola quando a ficha do pedido já está na tela
if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => $("#sacola").classList.toggle("escondida", e.isIntersecting), { threshold: .15 }).observe($("#pedido"));

carregar();
setInterval(() => { if (document.visibilityState === "visible") temNuvem ? carregar() : desenhar(); }, 60000);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") carregar(); });
})();

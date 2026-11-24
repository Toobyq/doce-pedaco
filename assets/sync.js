/* ============================================================
   Doce Pedaço — sincronização na nuvem (Supabase, plano grátis)
   Computador e iPhone entram na MESMA conta e veem os mesmos
   dados. Sem a nuvem configurada, o app funciona só no aparelho.
   Usa a API REST do Supabase direto (sem biblioteca extra).
   ============================================================ */
(() => {
"use strict";
const NUVEM = (window.DP_CONFIG && window.DP_CONFIG.nuvem) || {};
const URL_BASE = String(NUVEM.url || "").replace(/\/+$/, "");
const CHAVE_API = NUVEM.chave || "";
const K_SESSAO = "docepedaco:sessao";
const K_META = "docepedaco:sync";

const ler = (k, padrao) => { try { return JSON.parse(localStorage.getItem(k)) ?? padrao; } catch { return padrao; } };
const gravar = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch {} };

let app = null;                 // { obter(), substituir(dados), aoMudarStatus(st) }
let sessao = ler(K_SESSAO, null);
let meta = ler(K_META, { versao: 0, pendente: false });
let status = "desligado";       // desligado | sem-login | ok | enviando | offline | erro
let timer = null, ouvindo = false;

const configurado = () => !!(URL_BASE && CHAVE_API);
function mudar(st, detalhe) { status = st; app && app.aoMudarStatus && app.aoMudarStatus(st, detalhe); }
function salvarMeta() { gravar(K_META, meta); }

/* ---------- autenticação ---------- */
async function auth(caminho, corpo) {
  const r = await fetch(`${URL_BASE}/auth/v1/${caminho}`, { method: "POST", headers: { apikey: CHAVE_API, "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(traduzir(j.error_description || j.msg || j.message || j.error || `Erro ${r.status}`));
  return j;
}
function traduzir(m) {
  const t = String(m);
  if (/invalid login/i.test(t)) return "E-mail ou senha incorretos.";
  if (/not confirmed/i.test(t)) return "Confirme o e-mail primeiro (veja a caixa de entrada).";
  if (/already registered|already exists/i.test(t)) return "Esse e-mail já tem conta. Use Entrar.";
  if (/password.*(6|short|weak)/i.test(t)) return "A senha precisa ter pelo menos 6 caracteres.";
  if (/rate limit/i.test(t)) return "Muitas tentativas. Espere um minuto.";
  return t;
}
function guardarSessao(j) {
  sessao = { token: j.access_token, refresh: j.refresh_token, expira: Date.now() + (j.expires_in || 3600) * 1000 - 60000, usuario: j.user && j.user.id, email: j.user && j.user.email };
  gravar(K_SESSAO, sessao);
}
async function token() {
  if (!sessao) return null;
  if (Date.now() < sessao.expira) return sessao.token;
  try { guardarSessao(await auth("token?grant_type=refresh_token", { refresh_token: sessao.refresh })); return sessao.token; }
  catch (e) { if (navigator.onLine) { sessao = null; gravar(K_SESSAO, null); mudar("sem-login"); } throw e; }
}

/* ---------- banco ---------- */
async function rest(metodo, consulta, corpo, extra = {}, tabela = "estado") {
  const t = await token(); if (!t) throw new Error("sem login");
  const r = await fetch(`${URL_BASE}/rest/v1/${tabela}${consulta}`, {
    method: metodo,
    headers: { apikey: CHAVE_API, Authorization: `Bearer ${t}`, "Content-Type": "application/json", Prefer: "return=representation", ...extra },
    body: corpo ? JSON.stringify(corpo) : undefined
  });
  if (!r.ok) throw new Error(`Nuvem respondeu ${r.status}: ${(await r.text()).slice(0, 160)}`);
  const txt = await r.text();
  return txt ? JSON.parse(txt) : [];
}

/* ---------- site: vitrine e pedidos ---------- */
let ultimaVitrine = ler("docepedaco:vitrine-pub", null);
async function publicarVitrine() {
  const v = app.vitrine && app.vitrine(); if (!v) return;
  const j = JSON.stringify(v); if (j === ultimaVitrine) return;
  await rest("POST", "", { id: 1, dados: v }, { Prefer: "resolution=merge-duplicates,return=minimal" }, "vitrine");
  ultimaVitrine = j; gravar("docepedaco:vitrine-pub", j);
}
async function buscarPedidosSite() {
  if (!app.importar) return;
  const lista = await rest("GET", "?importado=eq.false&order=criado_em.asc&select=*", null, {}, "pedidos_site");
  if (!lista.length) return;
  const ids = app.importar(lista);
  if (ids.length) await rest("PATCH", `?id=in.(${ids.join(",")})`, { importado: true }, { Prefer: "return=minimal" }, "pedidos_site");
}
const baixarRemoto = async () => (await rest("GET", `?select=dados,versao,atualizado_em&dono=eq.${sessao.usuario}`))[0] || null;

/* ---------- mesclar (quando os dois aparelhos mudaram ao mesmo tempo) ---------- */
function mesclar(local, remoto) {
  const r = JSON.parse(JSON.stringify(remoto));
  const porId = (a = [], b = []) => {
    const m = new Map(a.map((x) => [x.id, x]));
    for (const x of b) { const y = m.get(x.id); if (!y || (x.atualizadoEm || x.criadoEm || "") >= (y.atualizadoEm || y.criadoEm || "")) m.set(x.id, x); }
    return [...m.values()];
  };
  for (const k of ["pedidos", "clientes", "produtos", "lembretes"]) r[k] = porId(remoto[k], local[k]);
  r.config = { ...remoto.config, ...local.config };
  r.dispensados = { ...remoto.dispensados, ...local.dispensados };
  r.conteudo = { feitos: { ...(remoto.conteudo || {}).feitos, ...(local.conteudo || {}).feitos } };
  if ((local.rotina || {}).semana === (remoto.rotina || {}).semana) r.rotina = { semana: local.rotina.semana, feitos: { ...remoto.rotina.feitos, ...local.rotina.feitos } };
  r.proximoNumero = Math.max(local.proximoNumero || 1, remoto.proximoNumero || 1, ...r.pedidos.map((p) => (p.numero || 0) + 1));
  return r;
}

/* ---------- ciclo de sincronização ---------- */
let rodada = null, deNovo = false, sujo = false;
function sincronizar() {
  if (!configurado() || !sessao) return Promise.resolve();
  if (rodada) { deNovo = true; return rodada; }
  rodada = (async () => {
    if (!navigator.onLine) return mudar("offline");
    mudar("enviando");
    try {
      for (let tentativa = 0; tentativa < 4; tentativa++) {
        sujo = false;
        const remoto = await baixarRemoto();
        const local = app.obter();
        if (!remoto) {
          if (local) { await rest("POST", "", { dados: local, versao: 1 }); meta = { versao: 1, pendente: false }; }
          break;
        }
        if (remoto.versao > meta.versao) {
          if (!(meta.pendente && local)) { meta = { versao: remoto.versao, pendente: false }; app.substituir(remoto.dados); break; }
          // os dois aparelhos mudaram: junta tudo e grava
          const novo = mesclar(local, remoto.dados);
          const r = await rest("PATCH", `?dono=eq.${sessao.usuario}&versao=eq.${remoto.versao}`, { dados: novo, versao: remoto.versao + 1, atualizado_em: new Date().toISOString() });
          if (!r.length) continue; // alguém gravou no meio: tenta de novo
          meta = { versao: remoto.versao + 1, pendente: false }; app.substituir(novo); break;
        }
        if (meta.pendente && local) {
          const r = await rest("PATCH", `?dono=eq.${sessao.usuario}&versao=eq.${meta.versao}`, { dados: local, versao: meta.versao + 1, atualizado_em: new Date().toISOString() });
          if (!r.length) { meta.versao = -1; continue; } // outro aparelho gravou antes: na próxima volta, mescla
          meta = { versao: meta.versao + 1, pendente: false };
        }
        break;
      }
      // pedidos do site → painel; depois publica a vitrine (cardápio, limite, pausa)
      try { await buscarPedidosSite(); await publicarVitrine(); }
      catch (e) { console.warn("[site]", e); }
      if (sujo) { meta.pendente = true; clearTimeout(timer); timer = setTimeout(sincronizar, 1200); } // ela mexeu em algo enquanto sincronizava
      salvarMeta(); mudar(meta.pendente ? "enviando" : "ok");
    } catch (e) {
      console.warn("[sync]", e); mudar(navigator.onLine ? "erro" : "offline", e.message);
    }
  })().finally(() => { rodada = null; if (deNovo) { deNovo = false; sincronizar(); } });
  return rodada;
}

async function subirFoto(blob, nome) {
  const t = await token(); if (!t) throw new Error("sem login");
  const r = await fetch(`${URL_BASE}/storage/v1/object/fotos/${encodeURIComponent(nome)}`, {
    method: "POST", headers: { apikey: CHAVE_API, Authorization: `Bearer ${t}`, "Content-Type": blob.type, "x-upsert": "true", "cache-control": "31536000" }, body: blob });
  if (!r.ok) throw new Error(`foto: ${r.status} ${(await r.text()).slice(0, 120)}`);
  return `${URL_BASE}/storage/v1/object/public/fotos/${encodeURIComponent(nome)}`;
}

window.DPSync = {
  subirFoto,
  tokenAtual: () => token(),
  configurado, status: () => status, email: () => sessao && sessao.email, logado: () => !!sessao,
  iniciar(api) {
    app = api;
    if (!configurado()) return mudar("desligado");
    if (!sessao) return mudar("sem-login");
    sincronizar();
    if (ouvindo) return; ouvindo = true;
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") sincronizar(); });
    addEventListener("online", sincronizar); addEventListener("offline", () => mudar("offline"));
    setInterval(() => { if (document.visibilityState === "visible") sincronizar(); }, 45000);
  },
  /** chamado pelo app sempre que salva algo */
  marcar() {
    if (!configurado() || !sessao) return;
    meta.pendente = true; sujo = true; salvarMeta();
    clearTimeout(timer); timer = setTimeout(sincronizar, 1200);
  },
  agora: sincronizar,
  async entrar(email, senha) {
    guardarSessao(await auth("token?grant_type=password", { email, password: senha }));
    const remoto = await baixarRemoto();
    const local = app.obter();
    if (remoto) {
      if (local && local.pedidos && local.pedidos.some((p) => !p.exemplo)) gravar("docepedaco:antes-da-nuvem", local); // cópia de segurança
      meta = { versao: remoto.versao, pendente: false }; salvarMeta(); app.substituir(remoto.dados);
    } else { meta = { versao: 0, pendente: !!local }; salvarMeta(); }
    this.iniciar(app); return !!remoto;
  },
  async criarConta(email, senha) {
    const j = await auth("signup", { email, password: senha });
    if (j.access_token) { guardarSessao(j); meta = { versao: 0, pendente: true }; salvarMeta(); this.iniciar(app); return "ok"; }
    return "confirmar";
  },
  sair() { sessao = null; gravar(K_SESSAO, null); meta = { versao: 0, pendente: false }; salvarMeta(); mudar("sem-login"); }
};
})();

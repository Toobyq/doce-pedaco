/* ============================================================
   Doce Pedaço — a "fornada" da semana
   Regras do negócio (iguais às do banco, em docs/supabase.sql):
   • Pedidos abrem na TERÇA às 00:00 e vão até o fim da terça.
     Opcional: estender até QUARTA de manhã (hora configurável).
   • Entregas a partir de QUINTA (sempre). Opcional: QUARTA à noite.
     Sexta e sábado são opcionais.
   • Limite de pedidos por fornada + limite por produto (opcional).
   • Pausa: fecha os pedidos da fornada atual na hora. Na terça
     seguinte reabre sozinho.
   ============================================================ */
(() => {
"use strict";
const z2 = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${z2(d.getMonth() + 1)}-${z2(d.getDate())}`;
const parse = (s) => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, m - 1, d); };
const addDias = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };

const PADRAO = {
  limite: 30,               // pedidos por fornada (0 = sem limite)
  estenderQuarta: false,    // pedidos também na quarta de manhã
  fimQuarta: "12:00",       // até que horas na quarta
  entregaQuartaNoite: false,
  horaQuartaNoite: "19:00",
  entregaSexta: true,
  entregaSabado: true,
  retirada: true,
  entrega: true,
  taxaEntrega: 5,
  pausadoSemana: null,      // "AAAA-MM-DD" da terça pausada
  recadinho: ""             // aviso que aparece no site
};
const config = (c) => ({ ...PADRAO, ...(c || {}) });

/** terça da fornada "atual": a desta semana até ela fechar; depois, a da semana seguinte */
function janela(cfg, agora = new Date()) {
  cfg = config(cfg);
  const hoje = iso(agora);
  const dow = (agora.getDay() + 6) % 7;        // 0 = segunda
  let ter = addDias(hoje, 1 - dow);            // terça desta semana
  const calc = (t) => {
    const abre = parse(t);
    const fecha = parse(addDias(t, 1));
    if (cfg.estenderQuarta) { const [h, m] = cfg.fimQuarta.split(":").map(Number); fecha.setHours(h, m || 0, 0, 0); }
    return { semana: t, abre, fecha };
  };
  let j = calc(ter);
  if (agora >= j.fecha) j = calc(addDias(ter, 7));
  return j;
}

/** dias de entrega da fornada */
function diasEntrega(cfg, semana) {
  cfg = config(cfg);
  const d = [];
  if (cfg.entregaQuartaNoite) d.push({ data: addDias(semana, 1), rotulo: "Quarta à noite", curto: "qua", noite: true, hora: cfg.horaQuartaNoite });
  d.push({ data: addDias(semana, 2), rotulo: "Quinta", curto: "qui" });
  if (cfg.entregaSexta) d.push({ data: addDias(semana, 3), rotulo: "Sexta", curto: "sex" });
  if (cfg.entregaSabado) d.push({ data: addDias(semana, 4), rotulo: "Sábado", curto: "sáb" });
  return d;
}

/**
 * Situação dos pedidos agora.
 * usados = pedidos já feitos nesta fornada (site + manuais)
 * → { estado: "aberto" | "antes" | "pausado" | "esgotado", ...janela, vagas }
 */
function situacao(cfg, usados = 0, agora = new Date()) {
  cfg = config(cfg);
  const j = janela(cfg, agora);
  const vagas = cfg.limite > 0 ? Math.max(0, cfg.limite - usados) : Infinity;
  let estado = "aberto";
  if (agora < j.abre) estado = "antes";
  else if (cfg.pausadoSemana === j.semana) estado = "pausado";
  else if (vagas <= 0) estado = "esgotado";
  return { estado, ...j, vagas, limite: cfg.limite, usados };
}

/** "2 dias e 3h", "5h 20min", "12 min" */
function falta(ate, agora = new Date()) {
  let s = Math.max(0, Math.floor((ate - agora) / 1000));
  const d = Math.floor(s / 86400); s -= d * 86400;
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60);
  if (d > 0) return `${d} dia${d > 1 ? "s" : ""}${h ? ` e ${h}h` : ""}`;
  if (h > 0) return `${h}h ${z2(m)}min`;
  return `${Math.max(1, m)} min`;
}

/** número da fornada = semana do ano */
function numero(semana) {
  const d = parse(semana); const ini = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - ini) / 864e5 + ini.getDay() + 1) / 7);
}

window.DPFornada = { PADRAO, config, janela, diasEntrega, situacao, falta, numero, iso, parse, addDias };
})();

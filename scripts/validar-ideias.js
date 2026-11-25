#!/usr/bin/env node
// Confere a estrutura de assets/ideias.js antes de publicar.
// Uso: node scripts/validar-ideias.js   (sai com erro e lista os problemas)
const path = require("path");
global.window = {};
require(path.join(__dirname, "..", "assets", "ideias.js"));
const I = window.DP_IDEIAS;
const erros = [];
const ok = (cond, msg) => { if (!cond) erros.push(msg); };
const url = (u) => typeof u === "string" && /^https:\/\/[^\s]+\.[^\s]+/.test(u);

ok(I && typeof I === "object", "window.DP_IDEIAS não existe");
ok(!isNaN(Date.parse(I.atualizadoEm)), "atualizadoEm inválido");
ok(typeof I.semana === "string" && I.semana.length > 5, "semana vazia");
ok(typeof I.resumo === "string" && I.resumo.length > 20, "resumo vazio ou curto demais");

ok(Array.isArray(I.emAlta) && I.emAlta.length >= 3 && I.emAlta.length <= 9, `emAlta deve ter de 3 a 9 itens (tem ${I.emAlta?.length})`);
const ids = new Set((I.ideias || []).map((i) => i.id));
(I.emAlta || []).forEach((t, k) => {
  const onde = `emAlta[${k}]`;
  ok(typeof t.titulo === "string" && t.titulo.length > 3, `${onde}: falta titulo (fonte colocada no lugar errado? fontes vão em "fontes")`);
  ok(typeof t.texto === "string" && t.texto.length > 20, `${onde}: falta texto`);
  ok(t.fonte && typeof t.fonte.nome === "string", `${onde}: falta fonte.nome`);
  ok(!t.fonte || !t.fonte.url || url(t.fonte.url), `${onde}: fonte.url inválida`);
  ok(!t.ideia || ids.has(t.ideia), `${onde}: ideia "${t.ideia}" não existe na lista de ideias`);
});

ok(Array.isArray(I.fontes) && I.fontes.length >= 3, "fontes deve ter pelo menos 3 itens");
(I.fontes || []).forEach((f, k) => { ok(typeof f.nome === "string" && f.nome, `fontes[${k}]: falta nome`); ok(url(f.url), `fontes[${k}]: url inválida`); });

const ABAS = new Set(["doces", "biscoitos", "salgados", "veganos", "light"]);
ok(Array.isArray(I.ideias) && I.ideias.length >= 25 && I.ideias.length <= 50, `ideias deve ter de 25 a 50 itens (tem ${I.ideias?.length})`);
const vistos = new Set();
(I.ideias || []).forEach((i, k) => {
  const onde = `ideias[${k}] (${i.id})`;
  ok(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(i.id || ""), `${onde}: id inválido`);
  ok(!vistos.has(i.id), `${onde}: id repetido`); vistos.add(i.id);
  ok(ABAS.has(i.aba), `${onde}: aba inválida`);
  for (const c of ["categoria", "nome", "descricao", "dica", "validade"]) ok(typeof i[c] === "string" && i[c].length > 1, `${onde}: falta ${c}`);
  ok(typeof i.emAlta === "boolean", `${onde}: emAlta deve ser true/false`);
  ok(Array.isArray(i.tags), `${onde}: tags deve ser lista`);
  ok(typeof i.preco === "number" && i.preco > 0 && typeof i.custo === "number" && i.custo > 0 && i.custo < i.preco, `${onde}: preco/custo inválidos`);
  ok([1, 2, 3].includes(i.dificuldade), `${onde}: dificuldade deve ser 1, 2 ou 3`);
});
ok(Array.isArray(I.cuidados) && I.cuidados.length >= 2, "cuidados vazio");

if (erros.length) { console.error("✗ ideias.js com problemas:\n- " + erros.join("\n- ")); process.exit(1); }
console.log(`✓ ideias.js ok: ${I.emAlta.length} em alta, ${I.ideias.length} ideias, ${I.fontes.length} fontes`);

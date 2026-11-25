// Confere se as ferramentas do Pedacinho cabem nos limites da API da Anthropic
// para ferramentas "strict" (senão TODA conversa com a IA falha com erro 400).
// Uso: node scripts/conferir-ferramentas.js
const fs = require("fs"), path = require("path");
const raiz = path.join(__dirname, "..");
global.window = global; global.document = { querySelector: () => null };
window.DP_CONFIG = {}; window.DPFornada = {}; window.DPMimos = {};
eval(fs.readFileSync(path.join(raiz, "assets/assistente.js"), "utf8"));
const tools = window.DPAssistente.FERRAMENTAS, rigidas = tools.filter((t) => t.strict);
let uniao = 0, opcionais = 0;
const visita = (s) => {
  if (!s || typeof s !== "object") return;
  for (const [k, p] of Object.entries(s.properties || {})) {
    if (Array.isArray(p.type) || p.anyOf) uniao++;
    if (!(s.required || []).includes(k)) opcionais++;
    visita(p); visita(p.items);
  }
};
rigidas.forEach((t) => visita(t.input_schema));
const fonte = fs.readFileSync(path.join(raiz, "supabase/functions/assistente/index.ts"), "utf8");
const faltam = tools.map((t) => t.name).filter((n) => !fonte.includes(`"${n}"`));
const erros = [];
if (rigidas.length > 20) erros.push(`ferramentas rígidas: ${rigidas.length} (máx. 20)`);
if (uniao > 16) erros.push(`campos que aceitam null nas rígidas: ${uniao} (máx. 16)`);
if (opcionais > 24) erros.push(`campos opcionais nas rígidas: ${opcionais} (máx. 24)`);
if (faltam.length) erros.push(`a função na nuvem não libera: ${faltam.join(", ")}`);
if (erros.length) { console.error("✗ " + erros.join("\n✗ ")); process.exit(1); }
console.log(`✓ ferramentas ok: ${tools.length} no total, ${rigidas.length} rígidas, ${uniao}/16 campos com null, ${opcionais}/24 opcionais`);

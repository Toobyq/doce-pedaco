/* Doce Pedaço — mimos: desenhinhos dos doces e confete */
(() => {
"use strict";
const C = "#3A211C";
const carinha = (x, y, s = 1, cor = C) => `<g transform="translate(${x} ${y}) scale(${s})">
  <circle cx="-5" cy="0" r="1.7" fill="${cor}"/><circle cx="5" cy="0" r="1.7" fill="${cor}"/>
  <path d="M-2.4 3.2q2.4 2.4 4.8 0" stroke="${cor}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <ellipse cx="-9" cy="3.6" rx="2.6" ry="1.6" fill="#F08FA8" opacity=".75"/><ellipse cx="9" cy="3.6" rx="2.6" ry="1.6" fill="#F08FA8" opacity=".75"/></g>`;
const svg = (corpo) => `<svg viewBox="0 0 64 64" fill="none" stroke="${C}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${corpo}</svg>`;

const DESENHOS = {
  cookie: svg(`<path d="M32 11a21 21 0 1 0 20.6 17 6 6 0 0 1-6.6-6.4 6 6 0 0 1-6-6.6A21 21 0 0 0 32 11z" fill="#F2D2A0"/>
    <circle cx="22" cy="22" r="2.4" fill="${C}" stroke="none"/><circle cx="43" cy="40" r="2.6" fill="${C}" stroke="none"/><circle cx="20" cy="42" r="2.2" fill="${C}" stroke="none"/><circle cx="36" cy="20" r="1.8" fill="${C}" stroke="none"/><circle cx="31" cy="47" r="2" fill="${C}" stroke="none"/>
    ${carinha(31, 33)}`),
  brownie: svg(`<path d="M11 26l8-8h34v26l-8 8H11z" fill="#8A5444"/><path d="M11 26h34v26M45 26l8-8" />
    <path d="M11 26c4 4 7-2 11 2s7-2 11 1 8-1 12-3" stroke="#3A211C" fill="none"/><path d="M19 18c3 3 6-1 10 1s7-2 10 0 8 1 14-1" fill="none"/>
    <path d="M14 30c3 2 6-1 9 1" stroke="#C78D7B" stroke-width="1.6"/>${carinha(28, 40, 1, "#FFF")}`),
  bolo: svg(`<path d="M32 9c-2.4 0-3.6 1.6-3 3.6.4 1.6 2 3 3 3.6 1-.6 2.6-2 3-3.6.6-2-.6-3.6-3-3.6z" fill="#F08FA8"/>
    <path d="M14 29c0-4.5 8-7.5 18-7.5S50 24.5 50 29" fill="#FBE4EA"/>
    <path d="M14 29v16c0 2.6 8 4.6 18 4.6S50 47.6 50 45V29" fill="#F6C7D3"/>
    <path d="M14 29c1.6 3.2 3.4 3.2 5 0 1.6 3.2 3.4 3.2 5 0 1.6 3.2 3.4 3.2 5 0 1.6 3.2 3.4 3.2 5 0 1.6 3.2 3.4 3.2 5 0 1.6 3.2 3.4 3.2 5 0 1 2 2 2 3 0" fill="#FFF"/>
    <path d="M9 50c0 2.6 10 4.6 23 4.6S55 52.6 55 50"/>${carinha(32, 39)}`),
  pote: svg(`<rect x="18" y="14" width="28" height="7" rx="3" fill="#F2D2A0"/><path d="M19 21h26v26a7 7 0 0 1-7 7H26a7 7 0 0 1-7-7z" fill="#FFF"/>
    <path d="M19 30h26v6H19zM19 42h26" fill="#8A5444" stroke="none"/><path d="M19 36h26v6H19z" fill="#F6C7D3" stroke="none"/>
    <path d="M19 21h26v26a7 7 0 0 1-7 7H26a7 7 0 0 1-7-7z"/>${carinha(32, 26, .8)}`),
  kit: svg(`<rect x="12" y="26" width="40" height="26" rx="4" fill="#F6C7D3"/><rect x="9" y="19" width="46" height="9" rx="3" fill="#FBE4EA"/>
    <path d="M32 19v33" stroke="#D4668A" stroke-width="5"/><path d="M32 19c-4-8-14-8-12-2 1 3 7 3 12 2zM32 19c4-8 14-8 12-2-1 3-7 3-12 2z" fill="#E496A8"/>${carinha(22, 40, .75)}`),
  salgado: svg(`<path d="M8 34c0-3 2-5 4-5h40c2 0 4 2 4 5l-3 13c-.6 3-3 5-6 5H17c-3 0-5.4-2-6-5z" fill="#F2D2A0"/>
    <path d="M10 33c2-6 4-8 6-5 2-5 4-5 6 0 2-5 4-5 6 0 2-5 4-5 6 0 2-5 4-5 6 0 2-5 4-5 6 0 2-3 4-1 6 5" fill="#F8E7A8"/>
    <circle cx="22" cy="26" r="2" fill="#8FBF73" stroke="none"/><circle cx="40" cy="24" r="2.2" fill="#E0845E" stroke="none"/><circle cx="31" cy="22" r="1.8" fill="#8FBF73" stroke="none"/>
    ${carinha(32, 42)}`),
  coracao: svg(`<path d="M32 52S10 39 10 24a11 11 0 0 1 22-3 11 11 0 0 1 22 3c0 15-22 28-22 28z" fill="#F6C7D3"/>${carinha(32, 30)}`)
};
function desenho(nome) { return DESENHOS[nome] || DESENHOS.coracao; }
function desenhoDoProduto(p) {
  const n = (String(p.categoria || "") + " " + String(p.nome || "")).toLowerCase();
  if (/kit|caixa|presente/.test(n) && !/cookie|brownie/.test(String(p.categoria).toLowerCase())) return desenho("kit");
  if (/salgad|quiche|empad|folhad|p[aã]o de queijo|parmes|torta salgada|kit lanche/.test(n)) return desenho("salgado");
  if (/pote/.test(n)) return desenho("pote");
  if (/cookie/.test(n)) return desenho("cookie");
  if (/brownie/.test(n)) return desenho("brownie");
  if (/bolo|fatia|torta/.test(n)) return desenho("bolo");
  return desenho("coracao");
}

function confete(qtd = 90) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cores = ["#E496A8", "#D4668A", "#FBE4EA", "#F3D98E", "#DCF0E5", "#ECE3F8", "#8A5444"];
  const box = document.createElement("div"); box.className = "confete";
  for (let i = 0; i < qtd; i++) {
    const c = document.createElement("i"); if (i % 3 === 0) c.className = "c";
    c.style.left = Math.random() * 100 + "vw"; c.style.background = cores[i % cores.length];
    c.style.setProperty("--x", (Math.random() * 160 - 80) + "px"); c.style.setProperty("--r", (Math.random() * 900 - 450) + "deg");
    c.style.animationDuration = 1.8 + Math.random() * 1.8 + "s"; c.style.animationDelay = Math.random() * .4 + "s";
    box.append(c);
  }
  document.body.append(box); setTimeout(() => box.remove(), 4200);
}

window.DPMimos = { desenho, desenhoDoProduto, confete };
})();

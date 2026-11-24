/* Doce Pedaço — service worker: deixa o app abrir sem internet.
   Estratégia: mostra a versão guardada e busca a nova em segundo plano. */
const VERSAO = "dp-v7";
const ARQUIVOS = ["./", "index.html", "painel.html", "manifest.webmanifest", "assets/style.css", "assets/app.css", "assets/site.css",
  "assets/config.js", "assets/conteudo.js", "assets/fornada.js", "assets/mimos.js", "assets/ideias.js", "assets/interativo.js", "assets/assistente.js", "assets/artes/brownie-post.jpg", "assets/app.js", "assets/sync.js", "assets/site.js",
  "assets/logo.svg", "assets/icon.svg", "assets/icon-192.png", "assets/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS.map((a) => new Request(a, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  const local = url.origin === location.origin;
  const fonte = url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com");
  if (!local && !fonte) return; // nuvem (sincronização) sempre direto na rede
  // Internet primeiro (sempre a versão mais nova); sem conexão, usa a cópia guardada.
  e.respondWith(caches.open(VERSAO).then((c) =>
    fetch(e.request, local ? { cache: "no-cache" } : undefined)
      .then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; })
      .catch(() => c.match(e.request, { ignoreSearch: local }))
  ));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window" }).then((ws) => ws.length ? ws[0].focus() : self.clients.openWindow("./painel.html#inicio")));
});

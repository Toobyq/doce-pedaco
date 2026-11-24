# Doce Pedaço

Site e sistema de gestão da **Doce Pedaço** (brownies, cookies e bolos). Modelo de **fornada semanal**: pedidos na terça (opcional: quarta de manhã), entregas a partir de quinta (opcional: quarta à noite), com limite de pedidos, limite por produto e pausa.

Identidade "caderninho", derivada da etiqueta (`docs/etiqueta-original.jpg`): papel, fita washi, adesivos, carimbos e bilhetinhos escritos à mão. Feita para a dona se identificar.

HTML/CSS/JS puro, sem build e sem dependências. Banco opcional no Supabase (plano grátis).

## Páginas
| Arquivo | Para quem | O que é |
|---|---|---|
| `index.html` | clientes | Site da fornada: cardápio da semana, vagas, status (aberto/pausado/esgotado/abre terça), pedido |
| `painel.html` | a dona | "Meu caderninho": fornada, pedidos, clientes, agenda com lembretes automáticos, cardápio, divulgação, rotina, resultados, ajustes |
| `pedido.html` | — | Redireciona para o site (link antigo) |

## Código
| Arquivo | O que faz |
|---|---|
| `assets/config.js` | Nome, WhatsApp, Instagram, regras da fornada, cardápio inicial e chaves **públicas** da nuvem |
| `assets/fornada.js` | Regras da semana (janela de pedidos, dias de entrega, situação) |
| `assets/site.js` / `site.css` | Site público |
| `assets/app.js` / `app.css` | Painel |
| `assets/sync.js` | Nuvem: sincroniza o painel, publica a vitrine, importa pedidos do site |
| `assets/mimos.js` | Desenhinhos dos doces (com carinha) e confete |
| `assets/conteudo.js` | Textos: mensagens de WhatsApp, posts, bios, rotina |
| `assets/ideias.js` | Aba **Ideias**: tendências da semana + ideias de doces, biscoitos, salgados, veganos e light/low carb (atualizado toda semana; só este arquivo muda) |
| `assets/og.png` | Imagem de prévia quando o link do site é compartilhado |
| `assets/style.css` | Identidade visual (tokens, botões, carimbos, washi, post-it) |
| `docs/supabase.sql` | Tabelas, regras de acesso e funções do banco |

## Rodar no computador
```bash
cd ~/Developer/"Doce Pedaço"
python3 -m http.server 8765 --bind 127.0.0.1
```
Site: <http://127.0.0.1:8765> · Painel: <http://127.0.0.1:8765/painel.html>

## Links para anúncios e Instagram
O site registra de onde a cliente veio e mostra isso em **Resultados → De onde vieram os pedidos** (precisa da nuvem):
- Bio do Instagram: `https://SEU-SITE/?origem=instagram`
- Anúncio: `https://SEU-SITE/?origem=anuncio` (ou `utm_source=...`)
- Anúncio só de veganos: `https://SEU-SITE/?origem=anuncio&filtro=vegano` (abre o cardápio já filtrado)

## Ligar a nuvem
Passo a passo em `docs/SINCRONIZACAO.md`. Sem a nuvem, o site lê o `config.js` e os pedidos vão pelo WhatsApp (limite e pausa ao vivo precisam da nuvem).

## Publicar (grátis)
GitHub Pages, Netlify ou Cloudflare Pages. Precisa de HTTPS para o iPhone instalar o painel.

## Testes feitos
- `docs/supabase.sql` em Postgres real (PGlite): 22 verificações de regras e permissões.
- Ponta a ponta com um servidor que imita o Supabase: login → vitrine publicada → pedido no site → importado no painel → limite lota → banco recusa → pausa aparece no site.

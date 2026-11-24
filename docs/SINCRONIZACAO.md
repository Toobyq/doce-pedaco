# Ligar a nuvem (grátis): site ao vivo + computador e iPhone

Com a nuvem ligada:
- **Limite e pausa funcionam ao vivo:** o site fecha sozinho quando lota, e o botão "pausar" fecha na hora.
- **Os pedidos do site caem sozinhos** no caderninho (com confete 🎉).
- **Computador e iPhone mostram os mesmos dados.**

Sem ela, o site mostra o cardápio do `assets/config.js` e os pedidos chegam pelo WhatsApp.

Serviço: **Supabase**, plano Free (US$ 0, 500 MB). ⚠️ O plano grátis **pausa o projeto depois de 7 dias sem nenhum acesso**. Com o site recebendo visitas e ela abrindo o painel, isso não acontece. Se acontecer: painel do Supabase → **Restore** (nada se perde).

## 1. Criar o projeto (5 min)
1. <https://supabase.com> → **Start your project** → criar conta (pode ser com o GitHub).
2. **New project** → nome `doce-pedaco` → senha do banco (guarde no gerenciador de senhas) → região **South America (São Paulo)** → **Create**.

## 2. Criar as tabelas e as regras
**SQL Editor → New query** → cole **todo** o conteúdo de [`docs/supabase.sql`](supabase.sql) → **Run**.

Isso cria:
| Tabela/função | Para quê | Quem acessa |
|---|---|---|
| `estado` | os dados do caderninho (pedidos, clientes…) | só a dona |
| `vitrine` | cardápio da semana, limite, pausa | só a dona escreve |
| `pedidos_site` | pedidos feitos no site | só a dona lê |
| `vitrine_publica()` | o que o site mostra | qualquer visitante |
| `fazer_pedido()` | registra um pedido **conferindo as regras no servidor**: horário da fornada, pausa, limite total, limite por produto, dias de entrega, total calculado pelo banco, no máximo 3 pedidos por telefone por fornada | qualquer visitante |

## 3. Login
**Authentication → Sign In / Providers → Email**: ligado. Opcional: desligue **Confirm email**.
Depois que a conta dela for criada (passo 5), desligue **Allow new users to sign up**, para ninguém mais criar conta.

## 4. Colar as chaves no site
**Project Settings → API**: copie a **Project URL** e a chave **anon / publishable**. Em `assets/config.js`:

```js
nuvem: { url: "https://xxxx.supabase.co", chave: "sb_publishable_... ou eyJ..." },
```

> Essa chave é **pública** por natureza e pode ficar no site: quem protege os dados são as regras do passo 2. **Nunca** coloque a chave `service_role` / `secret`.

## 5. Usar
1. No computador: painel → **Ajustes → Computador + iPhone → Entrar ou criar conta**. O que já estiver no computador sobe para a nuvem, e a vitrine do site é publicada.
2. No iPhone: abra o painel → **Já uso em outro aparelho: entrar**.
3. O selinho no topo mostra 🟢 *sincronizado*.

## Como funciona (para quem for mexer no código)
- `assets/sync.js` fala com a API REST do Supabase (sem biblioteca). A cada mudança (e a cada 45 s com o app aberto), ele: sincroniza o `estado` → busca `pedidos_site` não importados → importa (id `site-<uuid>`, então dois aparelhos não duplicam) → marca `importado` → publica a `vitrine` se mudou.
- Conflito entre aparelhos: mescla por `id`, vence o `atualizadoEm` mais recente. Limitação: um item excluído num aparelho pode voltar se o outro aparelho o editou ao mesmo tempo.
- Pedidos lançados à mão no painel contam no limite: a vitrine publica `fornada.manuais` (quantidade de pedidos e de itens da fornada).
- As regras da semana estão em dois lugares que precisam concordar: `assets/fornada.js` (site/painel) e `_janela()` em `docs/supabase.sql` (banco, fuso de São Paulo).

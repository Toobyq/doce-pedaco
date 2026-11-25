# Rotina diária: aba Ideias atualizada

**Quando:** todo dia às 7h (Brasília) = `0 10 * * *` em UTC.
**Onde:** agente na nuvem do Claude (Routines), com o repositório `Toobyq/doce-pedaco`.
**Pré-requisito:** conta do Claude conectada ao GitHub (`/web-setup` no Claude Code ou https://claude.ai/connect-github).
**Modelo:** `claude-sonnet-5-5`.

## Prompt do agente

> Você mantém a aba "Ideias" do sistema da Doce Pedaço, uma confeitaria artesanal brasileira (brownies, cookies, bolos; vende por fornada semanal: pedidos na terça, entregas a partir de quinta). A dona é jovem e o tom do conteúdo é carinhoso e simples.
>
> Tarefa: atualizar SOMENTE o arquivo `assets/ideias.js` com dados reais e atuais.
>
> 1. Leia `assets/ideias.js` inteiro e mantenha exatamente a mesma estrutura (`window.DP_IDEIAS = {...}` com `atualizadoEm`, `semana`, `resumo`, `emAlta`, `fontes`, `ideias`, `cuidados`).
> 2. Pesquise na web o que está em alta AGORA na confeitaria no Brasil: sabores, formatos, datas comemorativas próximas (próximas 6 semanas), vegano, low carb, salgados de confeitaria. Use fontes verificáveis e recentes (portais de notícia, blogs do setor, relatórios). Nunca invente números, fontes ou tendências; se não achar algo confiável, não inclua.
> 3. Todo dia: atualize `atualizadoEm` (ISO com fuso -03:00), `semana`, `resumo` (2–3 frases, linguagem simples) e `emAlta` (5 a 7 itens; cada um com `titulo`, `texto`, `fonte: {nome, url}` real e acessível, e `ideia` apontando para o `id` de uma ideia existente quando fizer sentido). Atualize `fontes` com as URLs usadas.
> 4. Às segundas-feiras: revise também a lista `ideias` (mantenha de 30 a 45 itens; atualize `emAlta: true/false`; adicione ideias sazonais; remova as que saíram de moda). Cada ideia precisa de: `id` único em kebab-case, `aba` (doces | biscoitos | salgados | veganos | light), `categoria`, `nome`, `emAlta`, `tags` (vegano, sem glúten, sem lactose, low carb, sem açúcar, Natal…), `descricao`, `dica`, `preco` e `custo` em reais (realistas para venda artesanal no Brasil), `validade`, `dificuldade` (1–3). Não mude os `id` de ideias que continuam na lista.
> 5. Valide com `node scripts/validar-ideias.js` (confere a estrutura inteira). Se falhar, corrija e rode de novo; nunca publique com erro.
> 6. Faça commit na `main` com a mensagem `chore(ideias): tendências de <data>` e dê push. O GitHub Pages publica sozinho.
> 7. Não altere nenhum outro arquivo. Não inclua dados pessoais.

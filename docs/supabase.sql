-- ============================================================
-- Doce Pedaço — banco no Supabase (plano grátis)
-- Cole TUDO no SQL Editor do Supabase e clique em Run.
-- Pode rodar de novo sem problema (é idempotente).
-- ============================================================

-- 1) Dados do painel (pedidos, clientes...) — 1 linha por conta
create table if not exists public.estado (
  dono uuid primary key default auth.uid() references auth.users on delete cascade,
  dados jsonb not null,
  versao bigint not null default 0,
  atualizado_em timestamptz not null default now()
);
alter table public.estado enable row level security;
drop policy if exists "dono le" on public.estado;
drop policy if exists "dono cria" on public.estado;
drop policy if exists "dono atualiza" on public.estado;
create policy "dono le"       on public.estado for select using (auth.uid() = dono);
create policy "dono cria"     on public.estado for insert with check (auth.uid() = dono);
create policy "dono atualiza" on public.estado for update using (auth.uid() = dono) with check (auth.uid() = dono);

-- 2) Vitrine: o que o site mostra (cardápio da semana, limite, pausa)
create table if not exists public.vitrine (
  id int primary key default 1 check (id = 1),
  dono uuid not null default auth.uid() references auth.users on delete cascade,
  dados jsonb not null,
  atualizado_em timestamptz not null default now()
);
alter table public.vitrine enable row level security;
drop policy if exists "dono cuida da vitrine" on public.vitrine;
create policy "dono cuida da vitrine" on public.vitrine for all
  using (auth.uid() = dono) with check (auth.uid() = dono);
-- (o público NÃO lê a tabela direto: só pela função vitrine_publica)

-- 3) Pedidos feitos pelo site
create table if not exists public.pedidos_site (
  id uuid primary key default gen_random_uuid(),
  numero bigint generated always as identity,
  semana date not null,
  criado_em timestamptz not null default now(),
  nome text not null check (char_length(nome) between 2 and 80),
  telefone text not null check (char_length(telefone) between 10 and 20),
  itens jsonb not null,
  total numeric(10,2) not null,
  entrega_dia date not null,
  recebimento text not null check (recebimento in ('retirada', 'entrega')),
  endereco text check (char_length(endereco) <= 200),
  obs text check (char_length(obs) <= 400),
  importado boolean not null default false
);
alter table public.pedidos_site add column if not exists origem text check (char_length(origem) <= 40); -- instagram, anúncio...
create index if not exists pedidos_site_semana on public.pedidos_site (semana);
alter table public.pedidos_site enable row level security;
drop policy if exists "dono ve" on public.pedidos_site;
drop policy if exists "dono marca" on public.pedidos_site;
drop policy if exists "dono apaga" on public.pedidos_site;
create policy "dono ve"    on public.pedidos_site for select using (exists (select 1 from public.vitrine v where v.dono = auth.uid()));
create policy "dono marca" on public.pedidos_site for update using (exists (select 1 from public.vitrine v where v.dono = auth.uid()));
create policy "dono apaga" on public.pedidos_site for delete using (exists (select 1 from public.vitrine v where v.dono = auth.uid()));
-- (ninguém insere direto: só pela função fazer_pedido, que confere as regras)

-- 4) Janela da fornada (mesma regra do assets/fornada.js), no fuso de São Paulo
create or replace function public._janela(d jsonb, agora timestamptz default now())
returns table (semana date, abre timestamptz, fecha timestamptz)
language plpgsql stable set search_path = public as $$
declare
  hoje date := (agora at time zone 'America/Sao_Paulo')::date;
  ter date := hoje - (extract(isodow from hoje)::int - 2);
  ext boolean := coalesce((d #>> '{fornada,estenderQuarta}')::boolean, false);
  fim time := coalesce(nullif(d #>> '{fornada,fimQuarta}', '')::time, '12:00');
begin
  semana := ter;
  abre := ter::timestamp at time zone 'America/Sao_Paulo';
  fecha := case when ext then ((ter + 1)::timestamp + fim) else (ter + 1)::timestamp end at time zone 'America/Sao_Paulo';
  if agora >= fecha then
    semana := ter + 7; abre := abre + interval '7 days'; fecha := fecha + interval '7 days';
  end if;
  return next;
end $$;

-- quanto já foi pedido na fornada (site + pedidos que ela lançou à mão)
create or replace function public._usados(d jsonb, sem date)
returns table (pedidos int, itens jsonb)
language sql stable set search_path = public as $$
  with site as (
    select i->>'id' as id, sum((i->>'qtd')::int) as q
    from public.pedidos_site p, jsonb_array_elements(p.itens) i
    where p.semana = sem group by 1
  ), manual as (
    select key as id, value::int as q
    from jsonb_each_text(case when d #>> '{fornada,manuais,semana}' = sem::text then coalesce(d #> '{fornada,manuais,itens}', '{}') else '{}' end)
  ), tudo as (
    select id, sum(q)::int as q from (select * from site union all select * from manual) t group by id
  )
  select
    (select count(*)::int from public.pedidos_site where semana = sem)
      + case when d #>> '{fornada,manuais,semana}' = sem::text then coalesce((d #>> '{fornada,manuais,pedidos}')::int, 0) else 0 end,
    coalesce((select jsonb_object_agg(id, q) from tudo), '{}'::jsonb);
$$;

-- 5) O que o site público lê
create or replace function public.vitrine_publica()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v record; j record; u record;
begin
  select * into v from public.vitrine where id = 1;
  if not found then return null; end if;
  select * into j from public._janela(v.dados);
  select * into u from public._usados(v.dados, j.semana);
  return jsonb_build_object(
    'loja', v.dados -> 'loja',
    'fornada', (v.dados -> 'fornada') - 'manuais',
    'itens', v.dados -> 'itens',
    'semana', j.semana, 'abre', j.abre, 'fecha', j.fecha, 'agora', now(),
    'usados', u.pedidos, 'vendidos', u.itens
  );
end $$;

-- 6) Fazer um pedido pelo site (confere TODAS as regras no servidor)
create or replace function public.fazer_pedido(p jsonb)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v record; j record; u record;
  item jsonb; prod jsonb; q int; lim int; total numeric := 0; itens_ok jsonb := '[]'::jsonb;
  dia date; fone text; n bigint; f jsonb;
begin
  select * into v from public.vitrine where id = 1 for update; -- um pedido por vez (limite exato)
  if not found then raise exception 'fechado'; end if;
  f := v.dados -> 'fornada';
  select * into j from public._janela(v.dados);
  if now() < j.abre then raise exception 'antes'; end if;
  if f ->> 'pausadoSemana' = j.semana::text then raise exception 'pausado'; end if;
  select * into u from public._usados(v.dados, j.semana);
  lim := coalesce(nullif(f ->> 'limite', '')::int, 0);
  if lim > 0 and u.pedidos >= lim then raise exception 'esgotado'; end if;

  fone := regexp_replace(coalesce(p ->> 'telefone', ''), '\D', '', 'g');
  if length(fone) < 10 then raise exception 'telefone'; end if;
  if (select count(*) from public.pedidos_site where semana = j.semana and regexp_replace(telefone, '\D', '', 'g') = fone) >= 3 then
    raise exception 'repetido';
  end if;

  for item in select * from jsonb_array_elements(coalesce(p -> 'itens', '[]')) loop
    select x.value into prod from jsonb_array_elements(v.dados -> 'itens') as x where x.value ->> 'id' = item ->> 'id' limit 1;
    if prod is null then raise exception 'item'; end if;
    q := (item ->> 'qtd')::int;
    if q is null or q < 1 or q > 30 then raise exception 'qtd'; end if;
    if nullif(prod ->> 'limite', '') is not null
       and coalesce((u.itens ->> (prod ->> 'id'))::int, 0) + q > (prod ->> 'limite')::int then
      raise exception 'acabou:%', prod ->> 'nome';
    end if;
    total := total + q * (prod ->> 'preco')::numeric;
    itens_ok := itens_ok || jsonb_build_array(jsonb_build_object(
      'id', prod ->> 'id', 'nome', prod ->> 'nome', 'categoria', prod ->> 'categoria', 'preco', (prod ->> 'preco')::numeric, 'qtd', q));
  end loop;
  if jsonb_array_length(itens_ok) = 0 then raise exception 'vazio'; end if;

  dia := (p ->> 'entrega_dia')::date;
  if dia is null or dia < j.semana + 1 or dia > j.semana + 4
     or (dia = j.semana + 1 and not coalesce((f ->> 'entregaQuartaNoite')::boolean, false))
     or (dia = j.semana + 3 and not coalesce((f ->> 'entregaSexta')::boolean, true))
     or (dia = j.semana + 4 and not coalesce((f ->> 'entregaSabado')::boolean, true)) then
    raise exception 'dia';
  end if;
  if (p ->> 'recebimento') not in ('retirada', 'entrega') then raise exception 'recebimento'; end if;
  if p ->> 'recebimento' = 'entrega' then
    if not coalesce((f ->> 'entrega')::boolean, true) then raise exception 'recebimento'; end if;
    total := total + coalesce(nullif(f ->> 'taxaEntrega', '')::numeric, 0);
  end if;

  insert into public.pedidos_site (semana, nome, telefone, itens, total, entrega_dia, recebimento, endereco, obs, origem)
  values (j.semana, left(trim(p ->> 'nome'), 80), fone, itens_ok, total, dia, p ->> 'recebimento',
          nullif(left(trim(coalesce(p ->> 'endereco', '')), 200), ''), nullif(left(trim(coalesce(p ->> 'obs', '')), 400), ''),
          nullif(left(trim(coalesce(p ->> 'origem', '')), 40), ''))
  returning numero into n;
  return jsonb_build_object('numero', n, 'total', total, 'semana', j.semana);
end $$;

-- quem pode chamar o quê
revoke all on function public._janela(jsonb, timestamptz) from public, anon, authenticated;
revoke all on function public._usados(jsonb, date) from public, anon, authenticated;
grant execute on function public.vitrine_publica() to anon, authenticated;
grant execute on function public.fazer_pedido(jsonb) to anon, authenticated;

-- 7) Fotos dos produtos (Supabase Storage): pasta pública "fotos", só a dona envia
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public) values ('fotos', 'fotos', true) on conflict (id) do nothing;
    execute 'drop policy if exists "dona envia fotos" on storage.objects';
    execute 'drop policy if exists "dona troca fotos" on storage.objects';
    execute 'drop policy if exists "dona apaga fotos" on storage.objects';
    execute $p$create policy "dona envia fotos" on storage.objects for insert to authenticated
      with check (bucket_id = 'fotos' and exists (select 1 from public.vitrine v where v.dono = auth.uid()))$p$;
    execute $p$create policy "dona troca fotos" on storage.objects for update to authenticated
      using (bucket_id = 'fotos' and exists (select 1 from public.vitrine v where v.dono = auth.uid()))$p$;
    execute $p$create policy "dona apaga fotos" on storage.objects for delete to authenticated
      using (bucket_id = 'fotos' and exists (select 1 from public.vitrine v where v.dono = auth.uid()))$p$;
  end if;
end $$;

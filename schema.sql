-- =====================================================================
--  Grower · Projeto Estruturação de Plantas (Soja)
--  Esquema do banco no Supabase — cole tudo no SQL Editor e clique em Run.
--  Pode rodar de novo sem perder dados (usa "if not exists" / "or replace").
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Membros e papéis -----------------------------------------
-- admin     : tudo, inclusive cadastrar membros e apagar dados
-- avaliador : vê e envia planilhas e fotos
-- leitor    : só vê
create table if not exists public.membros (
  email     text primary key,
  nome      text,
  papel     text not null default 'leitor' check (papel in ('admin','avaliador','leitor')),
  criado_em timestamptz not null default now()
);

create or replace function public.papel_atual() returns text
language sql stable security definer set search_path = public as $$
  select papel from public.membros where lower(email) = lower(auth.jwt() ->> 'email')
$$;

-- ---------- Cadastro --------------------------------------------------
create table if not exists public.produtores (
  id   uuid primary key default gen_random_uuid(),
  nome text not null unique
);

create table if not exists public.fazendas (
  id          uuid primary key default gen_random_uuid(),
  produtor_id uuid not null references public.produtores(id) on delete cascade,
  nome        text not null,
  municipio   text,
  uf          text,
  unique (produtor_id, nome)
);

create table if not exists public.talhoes (
  id                uuid primary key default gen_random_uuid(),
  fazenda_id        uuid not null references public.fazendas(id) on delete cascade,
  codigo            text not null,
  latitude          numeric,
  longitude         numeric,
  area_ha           numeric,
  cultivar          text,
  data_semeadura    date,
  espacamento_cm    numeric,
  data_aplicacao    date,
  dose_maxcel       text,
  estadio_aplicacao text,
  unique (fazenda_id, codigo)
);

create table if not exists public.tratamentos (
  id   smallint primary key,
  nome text not null unique
);
insert into public.tratamentos values (1,'Maxcel'),(2,'Impulse'),(3,'Stay Up'),(4,'Controle')
on conflict do nothing;

-- ---------- Avaliações (1 linha = ponto × tratamento × estádio) -------
create table if not exists public.avaliacoes (
  id               text primary key,               -- ID_Avaliacao da planilha
  talhao_id        uuid not null references public.talhoes(id) on delete cascade,
  tratamento_id    smallint not null references public.tratamentos(id),
  ponto            smallint,
  data             date,
  estadio          text not null,
  dae              smallint,
  altura_cm        numeric,
  estande_pl_m     numeric,
  ground_cover_pct numeric check (ground_cover_pct between 0 and 100),
  ramos_por_planta numeric,
  foto_arquivo     text,                           -- nome do arquivo na planilha
  foto_path        text,                           -- caminho no bucket 'fotos'
  avaliador        text,
  observacoes      text,
  enviado_por      uuid default auth.uid(),
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now()
);
create index if not exists avaliacoes_talhao_idx on public.avaliacoes (talhao_id, estadio);
create index if not exists avaliacoes_foto_idx   on public.avaliacoes (lower(foto_arquivo));

-- ---------- Visão usada pelo dashboard -------------------------------
create or replace view public.v_avaliacoes with (security_invoker = true) as
select a.id, p.nome produtor, f.nome fazenda, f.municipio, f.uf, t.codigo talhao,
       tr.nome tratamento, a.ponto, a.data, a.estadio, a.dae,
       a.altura_cm, a.estande_pl_m, a.ground_cover_pct, a.ramos_por_planta,
       a.foto_arquivo, a.foto_path, a.avaliador, a.observacoes, a.atualizado_em
from public.avaliacoes a
join public.talhoes t     on t.id = a.talhao_id
join public.fazendas f    on f.id = t.fazenda_id
join public.produtores p  on p.id = f.produtor_id
join public.tratamentos tr on tr.id = a.tratamento_id;

-- ---------- Permissões da API (o projeto não concede acesso automático) ----
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.membros, public.produtores, public.fazendas,
  public.talhoes, public.tratamentos, public.avaliacoes to authenticated;
grant select on public.v_avaliacoes to authenticated;
revoke all on public.membros, public.produtores, public.fazendas, public.talhoes,
  public.tratamentos, public.avaliacoes, public.v_avaliacoes from anon;

-- ---------- Segurança (RLS) ------------------------------------------
alter table public.membros     enable row level security;
alter table public.produtores  enable row level security;
alter table public.fazendas    enable row level security;
alter table public.talhoes     enable row level security;
alter table public.tratamentos enable row level security;
alter table public.avaliacoes  enable row level security;

do $$
declare t text;
begin
  foreach t in array array['produtores','fazendas','talhoes','tratamentos','avaliacoes'] loop
    execute format('drop policy if exists ler on public.%I', t);
    execute format('drop policy if exists gravar on public.%I', t);
    execute format('drop policy if exists alterar on public.%I', t);
    execute format('drop policy if exists apagar on public.%I', t);
    execute format('create policy ler on public.%I for select to authenticated using (public.papel_atual() is not null)', t);
    execute format('create policy gravar on public.%I for insert to authenticated with check (public.papel_atual() in (''admin'',''avaliador''))', t);
    execute format('create policy alterar on public.%I for update to authenticated using (public.papel_atual() in (''admin'',''avaliador''))', t);
    execute format('create policy apagar on public.%I for delete to authenticated using (public.papel_atual() = ''admin'')', t);
  end loop;
end $$;

drop policy if exists ver_membros on public.membros;
drop policy if exists admin_membros on public.membros;
create policy ver_membros on public.membros for select to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email') or public.papel_atual() = 'admin');
create policy admin_membros on public.membros for all to authenticated
  using (public.papel_atual() = 'admin') with check (public.papel_atual() = 'admin');

-- ---------- Importação da planilha (uma chamada, tudo ou nada) -------
create or replace function public.importar_avaliacoes(linhas jsonb) returns integer
language plpgsql security invoker set search_path = public as $$
declare
  r jsonb; v_prod uuid; v_faz uuid; v_tal uuid; v_tr smallint; n integer := 0;
begin
  if public.papel_atual() not in ('admin','avaliador') or public.papel_atual() is null then
    raise exception 'Seu e-mail não tem permissão para enviar dados';
  end if;
  for r in select * from jsonb_array_elements(linhas) loop
    insert into produtores(nome) values (trim(r->>'Produtor'))
      on conflict (nome) do update set nome = excluded.nome returning id into v_prod;
    insert into fazendas(produtor_id, nome, municipio, uf)
      values (v_prod, trim(r->>'Fazenda'), nullif(r->>'Municipio',''), nullif(upper(r->>'UF'),''))
      on conflict (produtor_id, nome) do update
        set municipio = coalesce(excluded.municipio, fazendas.municipio), uf = coalesce(excluded.uf, fazendas.uf)
      returning id into v_faz;
    insert into talhoes(fazenda_id, codigo) values (v_faz, trim(r->>'Talhao'))
      on conflict (fazenda_id, codigo) do update set codigo = excluded.codigo returning id into v_tal;
    select id into v_tr from tratamentos where lower(replace(nome,' ','')) = lower(replace(r->>'Tratamento',' ',''));
    if v_tr is null then raise exception 'Tratamento desconhecido na linha %: %', n+1, r->>'Tratamento'; end if;

    insert into avaliacoes(id, talhao_id, tratamento_id, ponto, data, estadio, dae, altura_cm, estande_pl_m,
                           ground_cover_pct, ramos_por_planta, foto_arquivo, avaliador, observacoes)
    values (r->>'ID_Avaliacao', v_tal, v_tr, (r->>'Ponto')::smallint, (nullif(r->>'Data',''))::date,
            upper(r->>'Estadio'), (r->>'DAE')::smallint, (r->>'Altura_cm')::numeric, (r->>'Estande_pl_m')::numeric,
            (r->>'Ground_Cover_pct')::numeric, (r->>'Ramos_por_planta')::numeric,
            nullif(r->>'Foto_Arquivo',''), nullif(r->>'Avaliador',''), nullif(r->>'Observacoes',''))
    on conflict (id) do update set
      talhao_id = excluded.talhao_id, tratamento_id = excluded.tratamento_id, ponto = excluded.ponto,
      data = excluded.data, estadio = excluded.estadio, dae = excluded.dae, altura_cm = excluded.altura_cm,
      estande_pl_m = excluded.estande_pl_m, ground_cover_pct = excluded.ground_cover_pct,
      ramos_por_planta = excluded.ramos_por_planta, foto_arquivo = coalesce(excluded.foto_arquivo, avaliacoes.foto_arquivo),
      avaliador = excluded.avaliador, observacoes = excluded.observacoes, atualizado_em = now();
    n := n + 1;
  end loop;
  return n;
end $$;

create or replace function public.importar_talhoes(linhas jsonb) returns integer
language plpgsql security invoker set search_path = public as $$
declare r jsonb; v_prod uuid; v_faz uuid; n integer := 0;
begin
  if public.papel_atual() not in ('admin','avaliador') or public.papel_atual() is null then
    raise exception 'Seu e-mail não tem permissão para enviar dados';
  end if;
  for r in select * from jsonb_array_elements(linhas) loop
    insert into produtores(nome) values (trim(r->>'Produtor'))
      on conflict (nome) do update set nome = excluded.nome returning id into v_prod;
    insert into fazendas(produtor_id, nome, municipio, uf)
      values (v_prod, trim(r->>'Fazenda'), nullif(r->>'Municipio',''), nullif(upper(r->>'UF'),''))
      on conflict (produtor_id, nome) do update
        set municipio = coalesce(excluded.municipio, fazendas.municipio), uf = coalesce(excluded.uf, fazendas.uf)
      returning id into v_faz;
    insert into talhoes(fazenda_id, codigo, latitude, longitude, area_ha, cultivar, data_semeadura,
                        espacamento_cm, data_aplicacao, dose_maxcel, estadio_aplicacao)
    values (v_faz, trim(r->>'Talhao'), (r->>'Latitude')::numeric, (r->>'Longitude')::numeric, (r->>'Area_ha')::numeric,
            nullif(r->>'Cultivar',''), (nullif(r->>'Data_Semeadura',''))::date, (r->>'Espacamento_cm')::numeric,
            (nullif(r->>'Data_Aplicacao',''))::date, nullif(r->>'Dose_Maxcel',''), nullif(r->>'Estadio_Aplicacao',''))
    on conflict (fazenda_id, codigo) do update set
      latitude = excluded.latitude, longitude = excluded.longitude, area_ha = excluded.area_ha,
      cultivar = excluded.cultivar, data_semeadura = excluded.data_semeadura,
      espacamento_cm = excluded.espacamento_cm, data_aplicacao = excluded.data_aplicacao,
      dose_maxcel = excluded.dose_maxcel, estadio_aplicacao = excluded.estadio_aplicacao;
    n := n + 1;
  end loop;
  return n;
end $$;

-- Liga fotos já enviadas ao Storage às avaliações pelo nome do arquivo
create or replace function public.vincular_foto(arquivo text, caminho text) returns integer
language sql security invoker set search_path = public as $$
  with u as (update avaliacoes set foto_path = caminho, atualizado_em = now()
             where lower(foto_arquivo) = lower(arquivo) returning 1)
  select count(*)::int from u
$$;

grant execute on function public.papel_atual(), public.importar_avaliacoes(jsonb),
  public.importar_talhoes(jsonb), public.vincular_foto(text,text) to authenticated;

-- ---------- Storage: bucket privado para as fotos --------------------
insert into storage.buckets (id, name, public) values ('fotos','fotos', false)
on conflict (id) do nothing;

drop policy if exists fotos_ler on storage.objects;
drop policy if exists fotos_gravar on storage.objects;
drop policy if exists fotos_alterar on storage.objects;
drop policy if exists fotos_apagar on storage.objects;
create policy fotos_ler on storage.objects for select to authenticated
  using (bucket_id = 'fotos' and public.papel_atual() is not null);
create policy fotos_gravar on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and public.papel_atual() in ('admin','avaliador'));
create policy fotos_alterar on storage.objects for update to authenticated
  using (bucket_id = 'fotos' and public.papel_atual() in ('admin','avaliador'));
create policy fotos_apagar on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and public.papel_atual() = 'admin');

-- ---------- Primeiro administrador -----------------------------------
-- Troque pelo seu e-mail antes de rodar (só na primeira vez):
insert into public.membros (email, nome, papel) values ('SEU_EMAIL_AQUI', 'Administrador', 'admin')
on conflict (email) do update set papel = 'admin';

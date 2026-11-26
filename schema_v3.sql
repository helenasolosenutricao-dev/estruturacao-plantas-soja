-- =====================================================================
--  v3: até 5 amostras (fotos) por fazenda × tratamento × estádio
--  O grau de cover do tratamento = média das amostras.
-- =====================================================================
alter table public.fotos_cobertura add column if not exists amostra smallint not null default 1;
alter table public.fotos_cobertura drop constraint if exists fotos_cobertura_amostra_check;
alter table public.fotos_cobertura add constraint fotos_cobertura_amostra_check check (amostra between 1 and 10);

do $$
declare c text;
begin
  for c in select conname from pg_constraint
           where conrelid = 'public.fotos_cobertura'::regclass and contype = 'u' loop
    execute format('alter table public.fotos_cobertura drop constraint %I', c);
  end loop;
end $$;
alter table public.fotos_cobertura
  add constraint fotos_cobertura_amostra_key unique (fazenda_id, tratamento_id, estadio, amostra);

drop view if exists public.v_grau_cover;
drop view if exists public.v_cobertura;
create view public.v_cobertura with (security_invoker = true) as
select c.id, p.id produtor_id, p.nome produtor, f.id fazenda_id, f.nome fazenda, f.municipio, f.uf,
       tr.nome tratamento, c.estadio, c.amostra, c.data, c.dae, c.foto_path, c.mapa_path,
       c.cobertura_pct, c.indice_medio, c.limiar, c.atualizado_em
from public.fotos_cobertura c
join public.fazendas f on f.id = c.fazenda_id
join public.produtores p on p.id = f.produtor_id
join public.tratamentos tr on tr.id = c.tratamento_id;

grant select on public.v_cobertura to authenticated;
revoke all on public.v_cobertura from anon;

-- Média por tratamento (grau de cover) — útil para relatórios e exportação
create or replace view public.v_grau_cover with (security_invoker = true) as
select produtor_id, produtor, fazenda_id, fazenda, tratamento, estadio,
       count(*) as amostras,
       round(avg(cobertura_pct), 2) as grau_cover_medio,
       round(stddev_samp(cobertura_pct), 2) as desvio_padrao,
       min(data) as data, round(avg(dae)) as dae
from public.v_cobertura
group by produtor_id, produtor, fazenda_id, fazenda, tratamento, estadio;

grant select on public.v_grau_cover to authenticated;
revoke all on public.v_grau_cover from anon;

-- Foto geral (todas as parcelas juntas) por fazenda × estádio
create table if not exists public.fotos_gerais (
  id            uuid primary key default gen_random_uuid(),
  fazenda_id    uuid not null references public.fazendas(id) on delete cascade,
  estadio       text not null,
  data          date,
  dae           smallint,
  foto_path     text not null,
  mapa_path     text,
  cobertura_pct numeric check (cobertura_pct between 0 and 100),
  limiar        numeric,
  enviado_por   uuid default auth.uid(),
  atualizado_em timestamptz not null default now(),
  unique (fazenda_id, estadio)
);
grant select, insert, update, delete on public.fotos_gerais to authenticated;
revoke all on public.fotos_gerais from anon;
alter table public.fotos_gerais enable row level security;
drop policy if exists ler on public.fotos_gerais;
drop policy if exists gravar on public.fotos_gerais;
drop policy if exists alterar on public.fotos_gerais;
drop policy if exists apagar on public.fotos_gerais;
create policy ler on public.fotos_gerais for select to authenticated using (public.papel_atual() is not null);
create policy gravar on public.fotos_gerais for insert to authenticated with check (public.papel_atual() in ('admin','avaliador'));
create policy alterar on public.fotos_gerais for update to authenticated using (public.papel_atual() in ('admin','avaliador'));
create policy apagar on public.fotos_gerais for delete to authenticated using (public.papel_atual() = 'admin');

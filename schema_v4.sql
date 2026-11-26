-- =====================================================================
--  v4: 3 pontos por tratamento × 5 medições por ponto
--  planta = nº da medição (1–5): altura da planta n e plantas contadas no metro n
-- =====================================================================
alter table public.plantas add column if not exists ponto smallint not null default 1;
alter table public.plantas drop constraint if exists plantas_ponto_check;
alter table public.plantas add constraint plantas_ponto_check check (ponto between 1 and 10);

do $$
declare c text;
begin
  for c in select conname from pg_constraint
           where conrelid = 'public.plantas'::regclass and contype = 'u' loop
    execute format('alter table public.plantas drop constraint %I', c);
  end loop;
end $$;
alter table public.plantas
  add constraint plantas_ponto_key unique (fazenda_id, tratamento_id, estadio, ponto, planta);

drop view if exists public.v_plantas;
create view public.v_plantas with (security_invoker = true) as
select pl.id, p.id produtor_id, p.nome produtor, f.id fazenda_id, f.nome fazenda, f.municipio, f.uf,
       f.espacamento_cm, tr.nome tratamento, pl.estadio, pl.data, pl.dae, pl.ponto, pl.planta,
       pl.altura_cm, pl.estande_pl_m, pl.observacoes, pl.atualizado_em
from public.plantas pl
join public.fazendas f on f.id = pl.fazenda_id
join public.produtores p on p.id = f.produtor_id
join public.tratamentos tr on tr.id = pl.tratamento_id;
grant select on public.v_plantas to authenticated;
revoke all on public.v_plantas from anon;

create or replace function public.importar_plantas(linhas jsonb) returns integer
language plpgsql security invoker set search_path = public as $$
declare r jsonb; v_faz uuid; v_tr smallint; v_dae smallint; v_emerg date; n integer := 0;
begin
  if public.papel_atual() is null or public.papel_atual() not in ('admin','avaliador') then
    raise exception 'Seu usuário não tem permissão para enviar dados';
  end if;
  for r in select * from jsonb_array_elements(linhas) loop
    n := n + 1;
    v_faz := null;
    select f.id, f.data_emergencia into v_faz, v_emerg
      from fazendas f join produtores p on p.id = f.produtor_id
     where lower(trim(p.nome)) = lower(trim(r->>'Produtor')) and lower(trim(f.nome)) = lower(trim(r->>'Fazenda'));
    if v_faz is null then
      raise exception 'Linha %: fazenda "%" do produtor "%" não está cadastrada', n + 1, r->>'Fazenda', r->>'Produtor';
    end if;
    v_tr := null;
    select id into v_tr from tratamentos where lower(replace(nome,' ','')) = lower(replace(r->>'Tratamento',' ',''));
    if v_tr is null then raise exception 'Linha %: tratamento desconhecido "%"', n + 1, r->>'Tratamento'; end if;
    v_dae := nullif(r->>'DAE','')::smallint;
    if v_dae is null and v_emerg is not null and nullif(r->>'Data','') is not null then
      v_dae := ((r->>'Data')::date - v_emerg);
    end if;
    insert into plantas(fazenda_id, tratamento_id, estadio, data, dae, ponto, planta, altura_cm, estande_pl_m, observacoes)
    values (v_faz, v_tr, upper(trim(r->>'Estadio')), nullif(r->>'Data','')::date, v_dae,
            coalesce(nullif(r->>'Ponto','')::smallint, 1), (r->>'Planta')::smallint,
            nullif(r->>'Altura_cm','')::numeric, nullif(r->>'Estande_pl_m','')::numeric, nullif(r->>'Observacoes',''))
    on conflict (fazenda_id, tratamento_id, estadio, ponto, planta) do update set
      data = excluded.data, dae = excluded.dae, altura_cm = excluded.altura_cm,
      estande_pl_m = excluded.estande_pl_m, observacoes = excluded.observacoes,
      enviado_por = auth.uid(), atualizado_em = now();
  end loop;
  return n;
end $$;
grant execute on function public.importar_plantas(jsonb) to authenticated;

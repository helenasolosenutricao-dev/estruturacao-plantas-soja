-- =====================================================================
--  v6: até 3 fotos por ponto (3 pontos × 3 fotos = 9 fotos por tratamento)
--  vale para Ground Cover (fotos_cobertura) e plantas inteiras (fotos_plantas)
--  coluna arquivo = nome do arquivo original enviado (aparece embaixo da foto)
-- =====================================================================
alter table public.fotos_cobertura add column if not exists foto smallint not null default 1;
alter table public.fotos_cobertura add column if not exists arquivo text;
alter table public.fotos_plantas add column if not exists arquivo text;
alter table public.fotos_gerais add column if not exists arquivo text;
alter table public.fotos_cobertura drop constraint if exists fotos_cobertura_foto_check;
alter table public.fotos_cobertura add constraint fotos_cobertura_foto_check check (foto between 1 and 10);
alter table public.fotos_plantas add column if not exists foto smallint not null default 1;
alter table public.fotos_plantas drop constraint if exists fotos_plantas_foto_check;
alter table public.fotos_plantas add constraint fotos_plantas_foto_check check (foto between 1 and 10);

do $$
declare c text;
begin
  for c in select conname from pg_constraint where conrelid = 'public.fotos_cobertura'::regclass and contype = 'u' loop
    execute format('alter table public.fotos_cobertura drop constraint %I', c);
  end loop;
  for c in select conname from pg_constraint where conrelid = 'public.fotos_plantas'::regclass and contype = 'u' loop
    execute format('alter table public.fotos_plantas drop constraint %I', c);
  end loop;
end $$;
alter table public.fotos_cobertura add constraint fotos_cobertura_ponto_foto_key unique (fazenda_id, tratamento_id, estadio, amostra, foto);
alter table public.fotos_plantas add constraint fotos_plantas_ponto_foto_key unique (fazenda_id, tratamento_id, estadio, ponto, foto);

drop view if exists public.v_grau_cover;
drop view if exists public.v_cobertura;
create view public.v_cobertura with (security_invoker = true) as
select c.id, p.id produtor_id, p.nome produtor, f.id fazenda_id, f.nome fazenda, f.municipio, f.uf,
       tr.nome tratamento, c.estadio, c.amostra, c.foto, c.data, c.dae, c.foto_path, c.mapa_path,
       c.cobertura_pct, c.indice_medio, c.limiar, c.arquivo, c.atualizado_em
from public.fotos_cobertura c
join public.fazendas f on f.id = c.fazenda_id
join public.produtores p on p.id = f.produtor_id
join public.tratamentos tr on tr.id = c.tratamento_id;
grant select on public.v_cobertura to authenticated;
revoke all on public.v_cobertura from anon;

create view public.v_grau_cover with (security_invoker = true) as
select produtor_id, produtor, fazenda_id, fazenda, tratamento, estadio,
       count(*) as fotos, count(distinct amostra) as pontos,
       round(avg(cobertura_pct), 2) as grau_cover_medio,
       round(stddev_samp(cobertura_pct), 2) as desvio_padrao,
       min(data) as data, round(avg(dae)) as dae
from public.v_cobertura
group by produtor_id, produtor, fazenda_id, fazenda, tratamento, estadio;
grant select on public.v_grau_cover to authenticated;
revoke all on public.v_grau_cover from anon;

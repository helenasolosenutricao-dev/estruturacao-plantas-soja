-- =====================================================================
--  v5: fotos das plantas inteiras (3 plantas sobre o pano) por fazenda × tratamento × estádio × ponto
--  As fotos de Ground Cover passam a ser identificadas por ponto (coluna amostra = nº do ponto).
-- =====================================================================
create table if not exists public.fotos_plantas (
  id            uuid primary key default gen_random_uuid(),
  fazenda_id    uuid not null references public.fazendas(id) on delete cascade,
  tratamento_id smallint not null references public.tratamentos(id),
  estadio       text not null,
  ponto         smallint not null default 1 check (ponto between 1 and 10),
  data          date,
  dae           smallint,
  foto_path     text not null,
  enviado_por   uuid default auth.uid(),
  atualizado_em timestamptz not null default now(),
  unique (fazenda_id, tratamento_id, estadio, ponto)
);
grant select, insert, update, delete on public.fotos_plantas to authenticated;
revoke all on public.fotos_plantas from anon;
alter table public.fotos_plantas enable row level security;
drop policy if exists ler on public.fotos_plantas;
drop policy if exists gravar on public.fotos_plantas;
drop policy if exists alterar on public.fotos_plantas;
drop policy if exists apagar on public.fotos_plantas;
create policy ler on public.fotos_plantas for select to authenticated using (public.papel_atual() is not null);
create policy gravar on public.fotos_plantas for insert to authenticated with check (public.papel_atual() in ('admin','avaliador'));
create policy alterar on public.fotos_plantas for update to authenticated using (public.papel_atual() in ('admin','avaliador'));
create policy apagar on public.fotos_plantas for delete to authenticated using (public.papel_atual() = 'admin');

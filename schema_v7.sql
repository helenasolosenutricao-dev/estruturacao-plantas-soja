-- =====================================================================
--  v7: quadros de comparação com 1 foto por tratamento
--      tipo 'individual' = planta individual · tipo 'grupo' = foto em grupo
--  + retirada do tratamento Impulse (id 2), que saiu do experimento
-- =====================================================================
create table if not exists public.fotos_comparacao (
  id            uuid primary key default gen_random_uuid(),
  fazenda_id    uuid not null references public.fazendas(id) on delete cascade,
  tratamento_id smallint not null references public.tratamentos(id),
  estadio       text not null,
  tipo          text not null check (tipo in ('individual','grupo')),
  data          date,
  dae           smallint,
  foto_path     text not null,
  arquivo       text,
  enviado_por   uuid default auth.uid(),
  atualizado_em timestamptz not null default now(),
  unique (fazenda_id, tratamento_id, estadio, tipo)
);
grant select, insert, update, delete on public.fotos_comparacao to authenticated;
revoke all on public.fotos_comparacao from anon;
alter table public.fotos_comparacao enable row level security;
drop policy if exists ler on public.fotos_comparacao;
drop policy if exists gravar on public.fotos_comparacao;
drop policy if exists alterar on public.fotos_comparacao;
drop policy if exists apagar on public.fotos_comparacao;
create policy ler on public.fotos_comparacao for select to authenticated using (public.papel_atual() is not null);
create policy gravar on public.fotos_comparacao for insert to authenticated with check (public.papel_atual() in ('admin','avaliador'));
create policy alterar on public.fotos_comparacao for update to authenticated using (public.papel_atual() in ('admin','avaliador'));
create policy apagar on public.fotos_comparacao for delete to authenticated using (public.papel_atual() = 'admin');

-- Impulse fora do experimento (não havia nenhum dado lançado com ele)
delete from public.plantas          where tratamento_id = 2;
delete from public.fotos_cobertura  where tratamento_id = 2;
delete from public.fotos_plantas    where tratamento_id = 2;
delete from public.fotos_comparacao where tratamento_id = 2;
delete from public.avaliacoes       where tratamento_id = 2;
delete from public.tratamentos      where id = 2;

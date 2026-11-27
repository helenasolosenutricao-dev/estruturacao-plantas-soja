-- v8: medidas da planta pela trena (altura, raiz, pontos marcados) nas fotos de plantas
alter table public.fotos_comparacao add column if not exists medidas jsonb;
alter table public.fotos_plantas    add column if not exists medidas jsonb;

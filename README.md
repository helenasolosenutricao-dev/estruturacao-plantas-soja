# Estruturação de Plantas · Soja — Dashboard

Dashboard da Grower para o projeto de estruturação de plantas de soja (tratamentos **Maxcel**, **Stay Up** e **Controle**) em áreas de produtores.

- **Front-end:** site estático (HTML + JS) publicado no GitHub Pages.
- **Banco:** Supabase (Postgres + Storage para fotos + login por link no e-mail).

## Arquivos

| Arquivo | O que é |
|---|---|
| `index.html`, `app.js`, `style.css` | O dashboard |
| `config.js` | URL e chave *anon* do projeto Supabase |
| `schema.sql` | Tabelas, regras de acesso (RLS), funções de importação e bucket de fotos |
| `Modelo_Avaliacoes_Estruturacao_Soja.xlsx` | Planilha modelo de envio |

## Como funciona

1. A pessoa entra com o e-mail (recebe um link, sem senha).
2. Só e-mails cadastrados na tabela `membros` veem dados:
   - `admin`: tudo, inclusive cadastrar membros;
   - `avaliador`: vê e envia planilhas e fotos;
   - `leitor`: só vê.
3. **Enviar planilha:** lê as abas `Avaliacoes` (obrigatória) e `Cadastro_Talhoes` (opcional). Produtores, fazendas e talhões são criados automaticamente. Reenviar o mesmo `ID_Avaliacao` atualiza a linha.
4. **Enviar fotos:** as fotos vão para o bucket privado `fotos` e são ligadas à avaliação cujo `Foto_Arquivo` tem o mesmo nome de arquivo.

## Configuração (uma vez)

1. Supabase → **SQL Editor** → colar `schema.sql`, trocar `SEU_EMAIL_AQUI` pelo e-mail do administrador → **Run**.
2. Supabase → **Authentication → URL Configuration**: em *Site URL* e *Redirect URLs*, colocar o endereço do GitHub Pages.
3. Copiar *Project URL* e *anon public key* (Settings → API) para `config.js`.
4. GitHub → **Settings → Pages** → *Deploy from a branch* → `main` / root.

> O envio de e-mail embutido do Supabase tem limite baixo por hora. Para muitos usuários, configure um SMTP próprio em Authentication → SMTP Settings.

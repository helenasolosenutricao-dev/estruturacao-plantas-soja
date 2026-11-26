// Supabase Edge Function: gerenciar-usuario
// Só administradores (tabela membros, papel = 'admin') podem criar contas, definir senhas, mudar papéis e remover usuários.
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const env = (...names: string[]) => names.map((n) => Deno.env.get(n)).find((v) => v && !v.startsWith("{"));
    const anonKey = env("SUPABASE_ANON_KEY", "SUPABASE_PUBLISHABLE_KEY");
    const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY");
    if (!anonKey || !serviceKey) {
      const names = Object.keys(Deno.env.toObject()).filter((n) => n.startsWith("SUPABASE_"));
      return json({ erro: "Chaves do servidor não encontradas. Variáveis disponíveis: " + names.join(", ") }, 500);
    }
    const auth = req.headers.get("Authorization") ?? "";
    const token = auth.replace(/^Bearer\s+/i, "");
    const asUser = createClient(url, anonKey, {
      global: { headers: { Authorization: auth } },
      auth: { persistSession: false },
    });
    const { data: papel, error: pe } = await asUser.rpc("papel_atual");
    if (pe || papel !== "admin") return json({ erro: "Apenas administradores podem gerenciar usuários." }, 403);

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { acao, email: raw, nome, papel: novo, senha } = await req.json();
    const email = String(raw ?? "").trim().toLowerCase();
    if (!email) return json({ erro: "Informe o e-mail." }, 400);

    const achar = async () => {
      for (let page = 1; page < 50; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) throw error;
        const u = data.users.find((x) => (x.email ?? "").toLowerCase() === email);
        if (u) return u;
        if (data.users.length < 1000) return null;
      }
      return null;
    };

    if (acao === "remover") {
      const { data: eu } = await asUser.auth.getUser(token);
      if ((eu?.user?.email ?? "").toLowerCase() === email) return json({ erro: "Você não pode remover a si mesma." }, 400);
      await admin.from("membros").delete().eq("email", email);
      const u = await achar();
      if (u) await admin.auth.admin.deleteUser(u.id);
      return json({ ok: true });
    }

    if (!["admin", "avaliador", "leitor"].includes(novo)) return json({ erro: "Papel inválido." }, 400);
    if (senha && String(senha).length < 6) return json({ erro: "A senha precisa ter pelo menos 6 caracteres." }, 400);

    let u = await achar();
    if (!u) {
      if (!senha) return json({ erro: "Defina uma senha para o novo usuário." }, 400);
      const { data, error } = await admin.auth.admin.createUser({ email, password: senha, email_confirm: true });
      if (error) return json({ erro: error.message }, 400);
      u = data.user;
    } else if (senha) {
      const { error } = await admin.auth.admin.updateUserById(u.id, { password: senha });
      if (error) return json({ erro: error.message }, 400);
    }
    const { error: me } = await admin.from("membros").upsert({ email, nome: nome || null, papel: novo });
    if (me) return json({ erro: me.message }, 400);
    return json({ ok: true });
  } catch (e) {
    return json({ erro: String((e as Error)?.message ?? e) }, 500);
  }
});

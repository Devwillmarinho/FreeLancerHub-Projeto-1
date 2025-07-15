"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect(
      "/auth/login?message=Não foi possível autenticar o usuário."
    );
  }

  return redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // Por padrão, o Supabase envia um e-mail de confirmação.
  // Você pode desativar isso nas configurações do seu projeto Supabase se desejar.
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Você pode adicionar dados adicionais aqui, como user_type, nome, etc.
      // Esses dados são armazenados em `raw_user_meta_data` na tabela auth.users.
      // Você precisará de um gatilho (trigger) no banco de dados para copiar esses dados
      // para a sua tabela public.users.
      // emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return redirect(
      "/auth/login?message=Não foi possível cadastrar o usuário."
    );
  }

  return redirect(
    "/auth/login?message=Verifique seu e-mail para confirmar o cadastro."
  );
}

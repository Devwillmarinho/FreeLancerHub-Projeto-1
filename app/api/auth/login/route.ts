import { NextResponse } from 'next/server';
import { supabase } from "@/lib/supabaseClient";
import { z } from 'zod';

// Schema de validação para os dados de login
const loginSchema = z.object({
  email: z.string().email({ message: "O email fornecido é inválido." }),
  password: z.string().min(1, { message: "A senha não pode estar em branco." }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: "Dados de login inválidos.",
        issues: validation.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const { email, password } = validation.data;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message === 'Invalid login credentials') {
        return NextResponse.json({ error: "Email ou senha inválidos." }, { status: 401 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Retorna o session data no response (para o front salvar o token nos cookies/localstorage)
    return NextResponse.json({
      message: "Login realizado com sucesso!",
      session: data.session
    });

  } catch (error) {
    console.error("Erro interno do servidor no login:", error);
    return NextResponse.json({ error: "Ocorreu um erro inesperado." }, { status: 500 });
  }
}

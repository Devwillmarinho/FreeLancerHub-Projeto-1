import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
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

    // Se a validação falhar, retorna um erro claro.
    if (!validation.success) {
      return NextResponse.json({ error: "Dados de login inválidos.", issues: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, password } = validation.data;

    // Usa o helper de Route Handler para interagir com o Supabase no backend.
    // Isso é crucial para que o cookie de sessão seja definido corretamente.
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Tenta fazer o login com email e senha.
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Se o Supabase retornar um erro, trata-o.
    if (error) {
      if (error.message === 'Invalid login credentials') {
        return NextResponse.json({ error: "Email ou senha inválidos." }, { status: 401 });
      }
      // Para outros erros, retorna a mensagem de erro do Supabase.
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Se o login for bem-sucedido, retorna uma mensagem de sucesso.
    return NextResponse.json({ message: "Login realizado com sucesso!" });

  } catch (error) {
    // Captura erros inesperados no servidor.
    console.error("Erro interno do servidor no login:", error);
    return NextResponse.json({ error: "Ocorreu um erro inesperado." }, { status: 500 });
  }
}

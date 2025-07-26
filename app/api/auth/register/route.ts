import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

// Schema de validação com Zod para garantir que os dados estão corretos
const registerSchema = z.object({
  email: z.string().email({ message: "Email inválido." }),
  password: z.string().min(8, { message: "A senha deve ter no mínimo 8 caracteres." }),
  name: z.string().min(1, { message: "O nome é obrigatório." }),
  user_type: z.enum(['freelancer', 'company']),
  company_name: z.string().optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Dados de registro inválidos.", issues: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, password, name, user_type, company_name, bio, skills } = validation.data;

    // Criar o usuário no Supabase Auth, passando todos os dados do perfil
    // para que o gatilho possa criar o perfil completo de uma só vez.
    const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          user_type: user_type,
          company_name: user_type === 'company' ? company_name : null,
          bio: bio,
          skills: skills,
        },
      },
    });

    if (signUpError) {
      if (signUpError.message.includes("User already registered")) {
        return NextResponse.json({ error: "Este email já está cadastrado." }, { status: 409 });
      }
      console.error("Erro no Supabase signUp:", signUpError);
      return NextResponse.json({ error: signUpError.message }, { status: 500 });
    }

    if (!signUpData.user) {
        return NextResponse.json({ error: "Não foi possível criar o usuário." }, { status: 500 });
    }

    return NextResponse.json({ message: "Usuário criado com sucesso!", user: signUpData.user }, { status: 201 });

  } catch (error) {
    console.error("Erro interno do servidor no registro:", error);
    return NextResponse.json({ error: "Ocorreu um erro inesperado." }, { status: 500 });
  }
}
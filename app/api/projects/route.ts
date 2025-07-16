import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const createProjectSchema = z.object({
  title: z.string().min(5, 'O título deve ter pelo menos 5 caracteres.'),
  description: z.string().min(20, 'A descrição deve ter pelo menos 20 caracteres.'),
  budget: z.number().positive('O orçamento deve ser um número positivo.'),
  required_skills: z.array(z.string()).min(1, 'Pelo menos uma habilidade é necessária.'),
});

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // Obter o usuário logado para autorização
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // A VERIFICAÇÃO QUE FALTAVA:
  // Só permite a criação do projeto se o tipo de usuário for 'company'.
  if (user.user_metadata.user_type !== 'company') {
    return NextResponse.json(
      { error: 'Apenas empresas podem criar projetos.' },
      { status: 403 }
    );
  }

  const body = await request.json();

  // Validar os dados
  const validation = createProjectSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { errors: validation.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Inserir no banco de dados
  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...validation.data,
      company_id: user.id, // Associar o projeto à empresa logada
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

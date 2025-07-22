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

/**
 * GET: Lista todos os projetos.
 * A segurança é garantida pelas Políticas de RLS (Row Level Security) no Supabase.
 * - Usuários autenticados podem ver todos os projetos.
 */
export async function GET(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // A RLS já filtra os dados, então a query é simples.
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Falha ao buscar projetos' }, { status: 500 });
  }

  return NextResponse.json({ data: projects }, { status: 200 });
}

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

  // A verificação de `user_metadata` foi removida.
  // A política de RLS no banco de dados é a fonte de verdade para autorização.
  // Se um não-empresa tentar inserir, o Supabase retornará um erro de violação de RLS.
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
  const { data: newProject, error } = await supabase
    .from('projects')
    .insert({
      ...validation.data,
      company_id: user.id, // Associar o projeto à empresa logada
    })
    .select()
    .single();

  if (error) {
    // Verifica se o erro é de violação de RLS para dar uma mensagem mais clara
    if (error.code === '42501') {
      return NextResponse.json(
        { error: 'Apenas empresas podem criar projetos.' },
        { status: 403 } // 403 Forbidden
      );
    }
    console.error('Project creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: newProject }, { status: 201 });
}

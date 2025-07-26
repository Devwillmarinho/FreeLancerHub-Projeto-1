import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase'; // Supabase Admin para operações seguras no backend

// Schema de validação do projeto com mensagens personalizadas
const createProjectSchema = z.object({
  title: z.string().min(5, 'O título deve ter pelo menos 5 caracteres.'),
  description: z.string().min(20, 'A descrição deve ter pelo menos 20 caracteres.'),
  budget: z.number().positive('O orçamento deve ser um número positivo.'),
  required_skills: z.array(z.string()).min(1, 'Pelo menos uma habilidade é necessária.'),
});

// GET: lista todos os projetos ordenados por criação
export async function GET(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // Verifica sessão
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // Busca projetos
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar projetos:', error);
    return NextResponse.json({ error: 'Falha ao buscar projetos' }, { status: 500 });
  }

  return NextResponse.json({ data: projects }, { status: 200 });
}

// POST: cria um novo projeto (somente empresas)
export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // Obtém usuário logado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // Valida dados do body
  const body = await request.json();
  const validation = createProjectSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { errors: validation.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Busca perfil com supabaseAdmin (confiável)
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('user_type, company_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.error('Erro ao buscar perfil:', profileError);
    return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 });
  }

  // Verifica tipo e associação a empresa
  if (profile.user_type !== 'company') {
    return NextResponse.json(
      { error: 'Apenas empresas podem criar projetos.' },
      { status: 403 }
    );
  }
  if (!profile.company_id) {
    return NextResponse.json(
      { error: 'Usuário não está associado a nenhuma empresa.' },
      { status: 400 }
    );
  }

  // Insere projeto no banco
  const { data: newProject, error: insertError } = await supabase
    .from('projects')
    .insert({
      ...validation.data,
      company_id: profile.company_id,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Erro ao criar projeto:', insertError);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ data: newProject }, { status: 201 });
}

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { authMiddleware, requireUserType } from '@/middleware/auth';
import type { NextRequestWithUser } from '@/types'; // Este tipo é usado por POST e DELETE

// Schema de validação para criar projetos
const createProjectSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório.'),
  description: z.string().min(1, 'A descrição é obrigatória.'),
  budget: z.number().positive('O orçamento deve ser um número positivo.'),
  required_skills: z.array(z.string()).min(1, 'Pelo menos uma habilidade é necessária.'),
});

// Query padrão de projeto com empresa
const projectWithCompanyQuery = `
  id, title, description, budget, deadline, status, required_skills,
  company:profiles!company_id(
    id,
    full_name,
    company_name,
    avatar_url
  )
`;

// GET - Listar Projetos
export async function GET(request: Request) {
  // Usamos o createRouteHandlerClient para criar um cliente que respeita
  // as políticas de RLS do usuário autenticado.
  // Isso substitui o uso do supabaseAdmin, que ignora todas as políticas.
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    // A consulta agora será filtrada automaticamente pela RLS no banco de dados.
    // Uma empresa verá apenas seus projetos.
    // Um freelancer verá projetos abertos e os que lhe foram atribuídos.
    const { data, error } = await supabase
      .from('projects')
      .select(projectWithCompanyQuery)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar projetos:', error);
      return NextResponse.json({ error: 'Falha ao buscar projetos.' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Erro interno do servidor:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

// POST - Criar Projeto
// O POST já usa o middleware requireUserType, que é correto para controle de acesso.
// Para operações de escrita (POST, DELETE), usar o supabaseAdmin é aceitável
// DESDE QUE você faça as verificações de permissão manualmente, como o middleware já faz.
import { supabaseAdmin } from '@/lib/supabase';
export async function POST(request: NextRequestWithUser) {
  const authResult = await requireUserType(['company'])(request);
  if (authResult) return authResult;

  const user = request.user!;

  const body = await request.json();
  const validation = createProjectSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Dados do projeto inválidos.", issues: validation.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const { data: newProject, error: insertError } = await supabaseAdmin
      .from('projects')
      .insert({
        ...validation.data,
        company_id: user.id, // A empresa é o próprio usuário autenticado.
      })
      .select(projectWithCompanyQuery)
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ data: newProject }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar projeto:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}

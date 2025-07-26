import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { authMiddleware, requireUserType } from '@/middleware/auth';
import type { NextRequestWithUser } from '@/types';

// Schema de validação para criar projetos
const createProjectSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório.'),
  description: z.string().min(1, 'A descrição é obrigatória.'),
  budget: z.number().positive('O orçamento deve ser um número positivo.'),
  required_skills: z.array(z.string()).min(1, 'Pelo menos uma habilidade é necessária.'),
});

// Query padrão de projeto com empresa
const projectWithCompanyQuery = `
  *,
  company:company_id(
    id,
    full_name:company_name
  )
`;

// GET - Listar Projetos
export async function GET(request: NextRequestWithUser) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;

  try {
    const { data, error } = await supabaseAdmin
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

  if (!user.company_id) {
    return NextResponse.json({ error: "Usuário não está associado a uma empresa." }, { status: 400 });
  }

  try {
    const { data: newProject, error: insertError } = await supabaseAdmin
      .from('projects')
      .insert({
        ...validation.data,
        company_id: user.company_id, // associando corretamente à empresa do usuário
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

// DELETE - Deletar Projeto
export async function DELETE(request: NextRequestWithUser) {
  const authResult = await requireUserType(['company'])(request);
  if (authResult) return authResult;

  const user = request.user!;
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('id');

  if (!projectId) {
    return NextResponse.json({ error: 'ID do projeto é obrigatório.' }, { status: 400 });
  }

  try {
    const { data: project, error: fetchError } = await supabaseAdmin
      .from('projects')
      .select('id, company_id')
      .eq('id', projectId)
      .single();

    if (fetchError || !project) {
      return NextResponse.json({ error: 'Projeto não encontrado.' }, { status: 404 });
    }

    if (project.company_id !== user.company_id) {
      return NextResponse.json({ error: 'Você não tem permissão para deletar este projeto.' }, { status: 403 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ message: 'Projeto deletado com sucesso.' });
  } catch (error: any) {
    console.error('Erro ao deletar projeto:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}

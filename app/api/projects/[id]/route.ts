import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { authMiddleware, requireUserType } from '@/middleware/auth';
import type { NextRequestWithUser } from '@/types';

export async function DELETE(request: NextRequestWithUser, { params }: { params: { id: string } }) {
  const authResult = await requireUserType(['company'])(request);
  if (authResult) return authResult;

  const user = request.user!;
  const projectId = params.id;

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

    if (project.company_id !== user.id) {
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

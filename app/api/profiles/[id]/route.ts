import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { authMiddleware } from '@/middleware/auth';
import { NextRequestWithUser } from '@/types';

// Schema de validação para os dados do perfil
const profileUpdateSchema = z.object({
  full_name: z.string().min(1, 'O nome não pode estar vazio.'),
  company_name: z.string().optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
});

export async function PUT(request: NextRequestWithUser, { params }: { params: { id: string } }) {
  // 1. Autentica o usuário
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;

  const profileId = params.id;
  const user = request.user;

  // 2. Garante que o usuário só pode editar seu próprio perfil
  if (user.id !== profileId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = profileUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos.', issues: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { full_name, company_name, bio, skills } = validation.data;

    // 3. Atualiza o perfil no banco de dados
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ full_name, company_name, bio, skills })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: 'Perfil atualizado com sucesso!', data });
  } catch (error: any) {
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}


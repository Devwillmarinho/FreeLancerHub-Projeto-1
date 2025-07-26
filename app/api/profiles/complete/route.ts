import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { authMiddleware } from '@/middleware/auth';
import { NextRequestWithUser } from '@/types';

const completeProfileSchema = z.object({
  user_type: z.enum(['freelancer', 'company']),
});

export async function POST(request: NextRequestWithUser) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;

  const user = request.user;

  try {
    const body = await request.json();
    const validation = completeProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos.', issues: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { user_type } = validation.data;

    // O gatilho já deve ter criado a linha do perfil.
    // Nós apenas atualizamos o tipo de usuário.
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ user_type: user_type })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: 'Perfil completado com sucesso!', data });
  } catch (error: any) {
    console.error('Erro ao completar perfil:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}


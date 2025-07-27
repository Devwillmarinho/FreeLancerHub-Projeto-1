import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { authMiddleware } from '@/middleware/auth';
import { NextRequestWithUser } from '@/types';

const completeProfileSchema = z.object({
  user_type: z.enum(['freelancer', 'company']),
});

export async function POST(request: NextRequestWithUser) {
  // 1. Autenticação
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;

  const user = request.user;

  // 2. Verifica se o user veio corretamente (para o TS parar de reclamar)
  if (!user) {
    return NextResponse.json({ error: 'Usuário não autenticado.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = completeProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos.', issues: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { user_type } = validation.data;

    // 3. Atualiza o tipo do usuário no perfil
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ user_type })
      .eq('id', user.id)
      .select()
      .single();

    if (profileError) {
      console.error('Erro ao atualizar perfil:', profileError);
      throw profileError;
    }

    // 4. Se o usuário for do tipo company, cria a empresa e associa o company_id
    if (user_type === 'company') {
      // Verifica se a empresa já existe
      const { data: existingCompany, error: companyFetchError } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('id', user.id)
        .single();

      if (companyFetchError && companyFetchError.code !== 'PGRST116') {
        console.error('Erro ao buscar empresa:', companyFetchError);
        return NextResponse.json({ error: 'Erro ao verificar empresa.' }, { status: 500 });
      }

      // Se não existir, cria a empresa com o mesmo ID do usuário
      if (!existingCompany) {
        const { error: companyInsertError } = await supabaseAdmin
          .from('companies')
          .insert({ id: user.id, company_name: profileData.full_name || 'Minha Empresa' });

        if (companyInsertError) {
          console.error('Erro ao criar empresa:', companyInsertError);
          return NextResponse.json({ error: 'Erro ao criar empresa.' }, { status: 500 });
        }
      }

      // Atualiza o profile com o company_id igual ao user.id
      const { error: companyIdUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({ company_id: user.id })
        .eq('id', user.id);

      if (companyIdUpdateError) {
        console.error('Erro ao atualizar company_id no perfil:', companyIdUpdateError);
        return NextResponse.json({ error: 'Erro ao associar empresa ao perfil.' }, { status: 500 });
      }
    }

    return NextResponse.json({ message: 'Perfil completado com sucesso!', data: profileData });
  } catch (error: any) {
    console.error('Erro ao completar perfil:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}

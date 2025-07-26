import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { NextRequestWithUser } from '@/types';

export async function authMiddleware(request: NextRequestWithUser) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Pega usuário autenticado
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or expired session.' },
        { status: 401 }
      );
    }

    // Busca perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Forbidden: User profile not found.' },
        { status: 403 }
      );
    }

    // Busca company_id
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', authUser.id)
      .maybeSingle(); // <- IMPORTANTE

    if (companyError) {
      console.error('Erro ao buscar company:', companyError);
      return NextResponse.json(
        { error: 'Erro ao buscar empresa' },
        { status: 500 }
      );
    }

    const companyId = company?.id ?? null;

    // Injeta user com perfil e company_id no request
    request.user = {
      ...authUser,
      ...profile,
      company_id: companyId,
    };

    return null;
  } catch (e) {
    console.error('Erro inesperado no middleware de autenticação:', e);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

type UserType = 'freelancer' | 'company';

export const requireUserType = (allowedTypes: UserType[]) => {
  return async (request: NextRequestWithUser) => {
    const authResponse = await authMiddleware(request);
    if (authResponse) return authResponse;

    const user = request.user;

    if (!user || !user.user_type) {
      return NextResponse.json(
        { error: 'Usuário não autenticado.' },
        { status: 401 }
      );
    }

    if (!allowedTypes.includes(user.user_type as UserType)) {
      return NextResponse.json(
        { error: 'Acesso negado para este tipo de usuário.' },
        { status: 403 }
      );
    }

    return null;
  };
};

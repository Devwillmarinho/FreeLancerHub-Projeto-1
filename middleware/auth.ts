import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { NextRequestWithUser } from '@/types';

/**
 * Middleware de autenticação para rotas de API.
 * Em vez de validar o token do cabeçalho, criamos um cliente Supabase no lado do servidor
 * com os cookies da requisição. Isso permite que o Supabase gerencie a sessão de forma segura
 * e lide com a atualização de tokens automaticamente.
 */
export async function authMiddleware(request: NextRequestWithUser): Promise<NextResponse | null> {
  try {
    // Cria um cliente Supabase que pode ler os cookies da requisição.
    const supabase = createRouteHandlerClient({ cookies });

    // Tenta obter a sessão do usuário a partir dos cookies.
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      // Se houver um erro ou nenhum usuário, a sessão é inválida.
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or expired session.' },
        { status: 401 }
      );
    }

    // Após autenticar, busca o perfil completo do usuário no banco de dados.
    // Isso é crucial para ter acesso a campos como 'user_type', 'full_name', etc.
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      // O usuário está autenticado, mas não tem um perfil.
      // Isso pode acontecer logo após o cadastro ou se houver uma inconsistência.
      return NextResponse.json({ error: 'Forbidden: User profile not found.' }, { status: 403 });
    }

    // Anexa um objeto de usuário combinado (auth + perfil) à requisição.
    // Isso resolve o erro de tipo, pois o objeto agora contém todas as propriedades esperadas.
    request.user = { ...authUser, ...profile };

    // Retorna null para permitir que a requisição prossiga para a rota da API.
    return null;
  } catch (e) {
    console.error('Erro inesperado no middleware de autenticação:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const requireUserType = (allowedTypes: Array<'freelancer' | 'company'>) => {
  return async (request: NextRequestWithUser): Promise<NextResponse | null> => {
    const authResult = await authMiddleware(request);
    if (authResult) {
      return authResult;
    }

    // O perfil completo já foi buscado pelo `authMiddleware` e está em `request.user`.
    // Não é necessário fazer outra chamada ao banco de dados aqui.
    const user = request.user;

    if (!user || !user.user_type || !allowedTypes.includes(user.user_type as any)) {
      return NextResponse.json({ error: 'Acesso negado para este tipo de usuário.' }, { status: 403 });
    }

    return null;
  };
}

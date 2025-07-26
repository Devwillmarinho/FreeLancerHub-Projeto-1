import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Validação para criação de empresa (se precisar passar o nome via body)
const companySchema = z.object({
  company_name: z.string().min(1, 'O nome da empresa é obrigatório.'),
});

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  // 1. Obter usuário logado
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Usuário não autenticado.' }, { status: 401 });
  }

  // 2. Verificar se já existe empresa associada ao user
  const { data: existingCompany, error: fetchError } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // ignora erro de row not found
    console.error('Erro ao buscar empresa:', fetchError);
    return NextResponse.json({ error: 'Erro ao buscar empresa.' }, { status: 500 });
  }

  if (existingCompany) {
    // Empresa já existe, retornar ela.
    return NextResponse.json({ data: existingCompany }, { status: 200 });
  }

  // 3. Se não existe, criar uma nova empresa.
  const body = await request.json();
  const validation = companySchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: 'Dados inválidos.', issues: validation.error.flatten().fieldErrors }, { status: 400 });
  }

  const { company_name } = validation.data;

  const { data: newCompany, error: insertError } = await supabase
    .from('companies')
    .insert({
      user_id: user.id,
      company_name,
    })
    .select('*')
    .single();

  if (insertError) {
    console.error('Erro ao criar empresa:', insertError);
    return NextResponse.json({ error: 'Erro ao criar empresa.' }, { status: 500 });
  }

  return NextResponse.json({ data: newCompany }, { status: 201 });
}

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

const companySchema = z.object({
  company_name: z.string().min(1, 'O nome da empresa é obrigatório.'),
  description: z.string().optional(),
  location: z.string().optional(),
  website_url: z.string().url().optional(),
});

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const validation = companySchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Dados inválidos.', issues: validation.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Verificar se o usuário já tem uma empresa
  const { data: existingCompany } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (existingCompany) {
    return NextResponse.json({ error: 'Empresa já cadastrada.' }, { status: 400 });
  }

  // Cadastrar a empresa
  const { data: newCompany, error: insertError } = await supabase
    .from('companies')
    .insert({ ...validation.data, user_id: user.id })
    .select()
    .single();

  if (insertError) {
    console.error('Erro ao criar empresa:', insertError);
    return NextResponse.json({ error: 'Erro ao criar empresa.' }, { status: 500 });
  }

  return NextResponse.json({ data: newCompany }, { status: 201 });
}

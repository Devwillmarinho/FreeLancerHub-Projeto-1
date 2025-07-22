import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase' // 1. Importar o cliente Admin

export async function POST(request: Request) {
  const { email, password, name, user_type, company_name, skills } = await request.json()

  // Validação básica dos dados recebidos
  if (!email || !password || !user_type) {
    return NextResponse.json({ error: 'Email, password, and user_type are required.' }, { status: 400 });
  }

  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  // Passo 1: Criar o usuário no sistema de autenticação do Supabase
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) {
    console.error('Auth SignUp Error:', authError)
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  if (!authData.user) {
    return NextResponse.json({ error: 'User could not be created.' }, { status: 500 });
  }

  // Passo 2: Inserir os dados do perfil na tabela pública correspondente
  let profileError;
  // Usar o cliente ADMIN para esta operação, pois ele ignora o RLS.
  // Isso é seguro porque só estamos executando isso no servidor após uma criação de usuário bem-sucedida.
  if (user_type === 'freelancer') {
    const { error } = await supabaseAdmin.from('freelancers').insert({
      id: authData.user.id, // Usar o mesmo ID do usuário autenticado
      full_name: name,
      skills: skills || [], // Garante que seja um array
    });
    profileError = error;
  } else if (user_type === 'company') {
    const { error } = await supabaseAdmin.from('companies').insert({
      id: authData.user.id,
      company_name: company_name || name,
    });
    profileError = error;
  }

  if (profileError) {
    console.error('Profile Creation Error:', profileError);
    // Importante: se a criação do perfil falhar, devemos deletar o usuário recém-criado
    // para não deixar um "usuário órfão" no sistema de autenticação.
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: `User was created but profile creation failed: ${profileError.message}` }, { status: 500 });
  }

  return NextResponse.json({ user: authData.user, message: 'Registration successful!' }, { status: 201 })
}
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password, name, user_type, company_name, skills } = await request.json()
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Os dados aqui vão para a tabela `users` do Supabase Auth
      data: {
        name,
        user_type,
        company_name, // Será nulo para freelancers
        skills,         // Será nulo para empresas
      },
    },
  })

  if (authError) {
    console.error('Erro no registro:', authError)
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  return NextResponse.json({ user: authData.user }, { status: 201 })
}
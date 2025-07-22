import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
  }

  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Log do erro para depuração no servidor, mas retorna uma mensagem genérica para o cliente
    console.error('Login Error:', error.message);
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  return NextResponse.json({ message: 'Login successful', user: data.user }, { status: 200 })
}
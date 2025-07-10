import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { generateToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { googleToken, user_type } = await request.json()

    if (!googleToken || !user_type) {
      return NextResponse.json({ error: "Google token and user type are required" }, { status: 400 })
    }

    // Verificar token do Google (simulado - em produção usar Google API)
    const googleUser = await verifyGoogleToken(googleToken)
    if (!googleUser) {
      return NextResponse.json({ error: "Invalid Google token" }, { status: 401 })
    }

    // Verificar se usuário já existe
    let { data: user, error } = await supabaseAdmin.from("users").select("*").eq("google_id", googleUser.id).single()

    if (!user) {
      // Criar novo usuário
      const { data: newUser, error: createError } = await supabaseAdmin
        .from("users")
        .insert({
          email: googleUser.email,
          name: googleUser.name,
          user_type,
          google_id: googleUser.id,
          avatar_url: googleUser.picture,
        })
        .select()
        .single()

      if (createError) {
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
      }

      user = newUser
    }

    // Gerar token
    const token = generateToken(user)

    // Remover dados sensíveis
    const { password_hash, ...userWithoutPassword } = user

    return NextResponse.json({
      data: {
        user: userWithoutPassword,
        token,
      },
      message: "Google login successful",
    })
  } catch (error) {
    console.error("Google login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Função simulada para verificar token do Google
async function verifyGoogleToken(token: string) {
  // Em produção, usar a biblioteca oficial do Google
  // const { OAuth2Client } = require('google-auth-library');
  // const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  // Simulação para desenvolvimento
  return {
    id: "google_user_123",
    email: "user@gmail.com",
    name: "Google User",
    picture: "https://example.com/avatar.jpg",
  }
}

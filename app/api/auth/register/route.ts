import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { hashPassword, generateToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validação manual dos dados (adaptação do express-validator)
    const { email, password, name, user_type, company_name, bio, skills } = body

    if (!email || !password || !name || !user_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    if (!["company", "freelancer"].includes(user_type)) {
      return NextResponse.json({ error: "Invalid user type" }, { status: 400 })
    }

    // Verificar se o email já existe
    const { data: existingUser } = await supabaseAdmin.from("users").select("id").eq("email", email).single()

    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    // Hash da senha
    const passwordHash = await hashPassword(password)

    // Criar usuário
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .insert({
        email,
        password_hash: passwordHash,
        name,
        user_type,
        company_name: user_type === "company" ? company_name : null,
        bio,
        skills: user_type === "freelancer" ? skills : null,
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    // Gerar token
    const token = generateToken(user)

    // Remover senha do retorno
    const { password_hash, ...userWithoutPassword } = user

    return NextResponse.json({
      data: {
        user: userWithoutPassword,
        token,
      },
      message: "User registered successfully",
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

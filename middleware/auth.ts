import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, hasPermission } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function authMiddleware(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "")

  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 401 })
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }

  // Verificar se o usuário ainda existe e está ativo
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", decoded.id)
    .eq("is_active", true)
    .single()

  if (error || !user) {
    return NextResponse.json({ error: "User not found or inactive" }, { status: 401 })
  }
  // Adicionar usuário ao request
  ;(request as any).user = user
  return null
}

export function requirePermissions(permissions: string[]) {
  return async (request: NextRequest) => {
    const authResult = await authMiddleware(request)
    if (authResult) return authResult

    const user = (request as any).user
    if (!hasPermission(user.user_type, permissions)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    return null
  }
}

export function requireUserType(userTypes: string[]) {
  return async (request: NextRequest) => {
    const authResult = await authMiddleware(request)
    if (authResult) return authResult

    const user = (request as any).user
    if (!userTypes.includes(user.user_type)) {
      return NextResponse.json({ error: "Access denied for this user type" }, { status: 403 })
    }

    return null
  }
}

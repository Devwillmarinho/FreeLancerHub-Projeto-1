export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireUserType } from "@/middleware/auth";
import { NextRequestWithUser } from "@/types";


// Rota para administradores listarem todos os usuários
export async function GET(request: NextRequestWithUser) {
  // 1. Autenticação e verificação se o usuário é admin
  const authResult = await requireUserType(["admin"])(request);
  if (authResult) {
    return authResult; // Retorna erro se não for admin ou não estiver autenticado
  }

  try {
    // 2a. Buscar todos os perfis da sua tabela pública
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, company_name, user_type, avatar_url")
      .order("full_name", { ascending: true });

    if (profilesError) {
      throw profilesError; // Será pego pelo catch principal
    }

    // 2b. Buscar todos os usuários da API de administração de autenticação (método mais seguro)
    const {
      data: { users: authUsers },
      error: authError,
    } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      throw authError; // Será pego pelo catch principal
    }

    // 3. Unir os dados no código usando um Map para eficiência
    const usersById = new Map(authUsers.map((u) => [u.id, u]));

    const formattedUsers = profiles.map((p) => {
      const authUser = usersById.get(p.id);
      return {
        ...p,
        email: authUser?.email || "N/A",
      };
    });

    return NextResponse.json({ data: formattedUsers });
  } catch (error: any) {
    console.error("Erro interno na API de usuários:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

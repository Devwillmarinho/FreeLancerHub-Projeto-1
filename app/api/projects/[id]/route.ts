import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { authMiddleware } from "@/middleware/auth";
import { NextRequestWithUser } from "@/types";

export async function DELETE(
  request: NextRequestWithUser,
  { params }: { params: { id: string } }
) {
  const authResult = await authMiddleware(request);
  if (authResult) return authResult;

  const projectId = params.id;
  const user = request.user;

  try {
    // 1. Verifica se o projeto existe e se o usuário é o dono
    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("company_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
    }

    // Apenas o dono da empresa ou um admin pode deletar o projeto
    if (project.company_id !== user.id && user.user_type !== "admin") {
      return NextResponse.json({ error: "Acesso negado. Você não tem permissão para deletar este projeto." }, { status: 403 });
    }

    // 2. Tenta deletar o projeto
    // AVISO: Isso irá falhar se houver propostas, mensagens, etc., ligadas a este projeto
    // e a constraint de chave estrangeira não estiver como ON DELETE CASCADE.
    // É uma boa prática deletar primeiro os dados relacionados ou configurar o CASCADE no seu banco.
    const { error: deleteError } = await supabaseAdmin
      .from("projects")
      .delete()
      .eq("id", projectId);

    // 3. **Ponto crucial**: Verifica se houve um erro na deleção
    if (deleteError) {
      console.error("Erro ao deletar projeto:", deleteError);
      // Retorna o erro do banco de dados para o cliente
      return NextResponse.json({ error: `Falha ao deletar o projeto: ${deleteError.message}` }, { status: 500 });
    }

    return NextResponse.json({ message: "Projeto deletado com sucesso." });

  } catch (error: any) {
    console.error("Erro inesperado na rota DELETE /api/projects/[id]:", error);
    return NextResponse.json({ error: error.message || "Erro interno do servidor." }, { status: 500 });
  }
}

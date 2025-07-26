import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireUserType } from "@/middleware/auth";
import { NextRequestWithUser } from "@/types";

export async function PUT(request: NextRequestWithUser, { params }: { params: { id: string } }) {
  // Garante que apenas empresas podem aceitar propostas
  const authResult = await requireUserType(["company"])(request);
  if (authResult) return authResult;

  const proposalId = params.id;
  const user = request.user;

  try {
    const { status } = await request.json();

    if (status !== 'accepted') {
      return NextResponse.json({ error: "Ação inválida. Apenas 'accepted' é permitido." }, { status: 400 });
    }

    // Chama a função do PostgreSQL que atualiza a proposta e o projeto de forma atômica
    const { data, error } = await supabaseAdmin.rpc('update_proposal_status', {
      proposal_id_to_update: proposalId,
      new_status: 'accepted',
      company_id_check: user.id
    });

    if (error || !data) {
      return NextResponse.json({ error: "Proposta não encontrada ou você não tem permissão para aceitá-la." }, { status: 404 });
    }

    return NextResponse.json({ message: "Proposta aceita com sucesso!", data });

  } catch (error) {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
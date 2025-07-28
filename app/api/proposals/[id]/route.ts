import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireUserType } from "@/middleware/auth";
import { NextRequestWithUser } from "@/types";
import { z } from "zod";

const updateProposalSchema = z.object({
  status: z.enum(["accepted", "rejected"], {
    required_error: "O novo status é obrigatório.",
    invalid_type_error: "Status inválido. Deve ser 'accepted' ou 'rejected'.",
  }),
});

export async function PUT(request: NextRequestWithUser, { params }: { params: { id: string } }) {
  // 1. Apenas usuários do tipo 'company' podem aceitar/rejeitar propostas.
  const authResult = await requireUserType(["company"])(request);
  if (authResult) {
    return authResult;
  }

  const proposalId = params.id;
  const user = request.user;

  try {
    // 2. Validar o corpo da requisição
    const body = await request.json();
    const validation = updateProposalSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Dados inválidos.", issues: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { status } = validation.data;

    // 3. Chamar a função do banco de dados que atualiza a proposta e o projeto atomicamente.
    // Esta função já existe no seu `database-schema.sql`!
    const { data: updatedProposal, error } = await supabaseAdmin.rpc("update_proposal_status", {
      proposal_id_to_update: proposalId,
      new_status: status,
      company_id_check: user.id, // Garante que apenas a empresa dona do projeto pode fazer a alteração.
    });

    if (error) {
      console.error("Erro ao atualizar proposta via RPC:", error);
      return NextResponse.json({ error: "Falha ao atualizar a proposta. Verifique se você é o dono do projeto." }, { status: 500 });
    }

    return NextResponse.json({ data: updatedProposal, message: `Proposta ${status === 'accepted' ? 'aceita' : 'rejeitada'} com sucesso!` });
  } catch (error: any) {
    console.error("Erro interno na API de propostas [PUT]:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { requireUserType } from "@/middleware/auth";
import { NextRequestWithUser } from "@/types";

// Zod schema for review creation
const createReviewSchema = z.object({
  contract_id: z.string().uuid("ID do contrato inválido."),
  reviewed_id: z.string().uuid("ID do usuário avaliado inválido."),
  rating: z.number().min(1, "A nota deve ser no mínimo 1.").max(5, "A nota deve ser no máximo 5."),
  comment: z.string().trim().min(1, "O comentário não pode estar vazio se for fornecido.").max(1000, "O comentário não pode exceder 1000 caracteres.").optional().nullable(),
});

export async function POST(request: NextRequestWithUser) {
  // 1. Authenticate and get user
  const authResult = await requireUserType(["freelancer", "company"])(request);
  if (authResult) return authResult;

  const reviewerId = request.user.id;

  try {
    // 2. Validate request body
    const body = await request.json();
    const validation = createReviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: "Dados inválidos.",
        issues: validation.error.issues
      }, { status: 400 });
    }

    const { contract_id, reviewed_id, rating, comment } = validation.data;

    // 3. Perform business logic checks
    // a. Check if the contract exists, is completed, and if the reviewer/reviewed are part of it
    const { data: contract, error: contractError } = await supabaseAdmin
      .from("contracts")
      .select("id, company_id, freelancer_id, is_completed")
      .eq("id", contract_id)
      .single();

    if (contractError || !contract) {
      return NextResponse.json({ error: "Contrato não encontrado." }, { status: 404 });
    }

    if (!contract.is_completed) {
      return NextResponse.json({ error: "O contrato ainda não foi concluído." }, { status: 403 });
    }

    // Check if the reviewer and the reviewed user are the correct parties in the contract
    const isReviewerValid = contract.company_id === reviewerId || contract.freelancer_id === reviewerId;
    const isReviewedValid = contract.company_id === reviewed_id || contract.freelancer_id === reviewed_id;

    if (!isReviewerValid) {
        return NextResponse.json({ error: "Você não faz parte deste contrato." }, { status: 403 });
    }
    if (!isReviewedValid) {
        return NextResponse.json({ error: "O usuário avaliado não faz parte deste contrato." }, { status: 403 });
    }
    if (reviewerId === reviewed_id) {
        return NextResponse.json({ error: "Você não pode avaliar a si mesmo." }, { status: 400 });
    }

    // b. Check if the user has already reviewed this contract
    const { data: existingReview, error: existingReviewError } = await supabaseAdmin
      .from("reviews")
      .select("id")
      .eq("contract_id", contract_id)
      .eq("reviewer_id", reviewerId)
      .maybeSingle();

    if (existingReviewError) throw existingReviewError;

    if (existingReview) {
      return NextResponse.json({ error: "Você já avaliou este contrato." }, { status: 409 }); // 409 Conflict
    }

    // 4. Insert the new review
    const { data: newReview, error: insertError } = await supabaseAdmin
      .from("reviews")
      .insert({ contract_id, reviewer_id: reviewerId, reviewed_id, rating, comment })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ data: newReview, message: "Avaliação enviada com sucesso!" }, { status: 201 });

  } catch (error: any) {
    console.error("Erro ao criar avaliação:", error);
    return NextResponse.json({ error: error.message || "Erro interno do servidor." }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
        return NextResponse.json({ error: "ID do usuário é obrigatório." }, { status: 400 });
    }

    try {
        const { data, error } = await supabaseAdmin.from('reviews').select(`id, rating, comment, created_at, reviewer:profiles!reviewer_id(full_name, avatar_url)`).eq('reviewed_id', userId).order('created_at', { ascending: false });
        if (error) throw error;
        return NextResponse.json({ data });
    } catch (error: any) {
        console.error("Erro ao buscar avaliações:", error);
        return NextResponse.json({ error: error.message || "Erro interno do servidor." }, { status: 500 });
    }
}
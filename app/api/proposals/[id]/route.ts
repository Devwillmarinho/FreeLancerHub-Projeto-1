import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateProposalSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
})

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const proposalId = params.id
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const validation = updateProposalSchema.safeParse(await request.json())
  if (!validation.success) {
    return NextResponse.json({ errors: validation.error.flatten().fieldErrors }, { status: 400 })
  }

  const { status } = validation.data

  // Iniciar uma transação para garantir a consistência dos dados
  const { data: updatedProposal, error } = await supabase.rpc('update_proposal_status', {
    proposal_id_to_update: proposalId,
    new_status: status,
    company_id_check: user.id
  })

  if (error) {
    // O erro pode vir da RLS (se o usuário não for a empresa dona do projeto) ou da função
    console.error('Erro ao atualizar proposta:', error)
    return NextResponse.json({ error: 'Falha ao atualizar a proposta. Verifique suas permissões.' }, { status: 403 })
  }
  
  if (!updatedProposal) {
    return NextResponse.json({ error: 'Proposta não encontrada ou você não tem permissão.' }, { status: 404 })
  }

  return NextResponse.json(updatedProposal)
}


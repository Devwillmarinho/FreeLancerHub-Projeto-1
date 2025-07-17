import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { message, conversationId } = await request.json()
  const supabase = createRouteHandlerClient({ cookies })

  // 1. Obter a sessão do usuário (se logado)
  const { data: { session } } = await supabase.auth.getSession();

  // 2. Salvar a mensagem do usuário no banco
  const { error: messageError } = await supabase
    .from('support_messages')
    .insert({
      content: message,
      conversation_id: conversationId,
      sender_type: 'user',
    })

  if (messageError) {
    return NextResponse.json({ error: messageError.message }, { status: 500 })
  }

  // 3. Chamar a Edge Function 'chat-ai' para obter a resposta da IA
  const { data: functionResponse, error: functionError } = await supabase.functions.invoke('chat-ai', {
    body: { message, conversationId },
  })

  if (functionError) {
    return NextResponse.json({ error: functionError.message }, { status: 500 })
  }

  return functionResponse;
}
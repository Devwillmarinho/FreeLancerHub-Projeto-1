import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { OpenAIStream, StreamingTextResponse } from "https://esm.sh/ai@3.1.1"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.2"
import OpenAI from "https://esm.sh/openai@4.29.1"

// Inicializa o cliente OpenAI
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
})

serve(async (req) => {
  const { message, conversationId } = await req.json()

  // 1. Criar cliente Supabase para salvar a mensagem da IA
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  )

  // 2. Chamar a API da OpenAI para gerar a resposta
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    stream: true,
    messages: [
      {
        role: "system",
        content:
          "Você é um assistente prestativo da plataforma FreelanceHub. Seja breve e direto.",
      },
      { role: "user", content: message },
    ],
  })

  // 3. Criar o stream de resposta
  const stream = OpenAIStream(response, {
    // Quando o stream terminar, salve a resposta completa no banco de dados
    async onFinal(completion) {
      await supabaseAdmin.from("support_messages").insert({
        content: completion,
        conversation_id: conversationId,
        sender_type: "ai",
      })
    },
  })

  // 4. Retornar o stream para o frontend
  return new StreamingTextResponse(stream)
})
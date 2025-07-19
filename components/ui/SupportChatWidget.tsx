"use client"

import { useState, useEffect, useRef } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from "@/components/ui/button"
import { createClient } from '@supabase/supabase-js'
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Send, X, Bot } from "lucide-react"
import { useChat } from "ai/react"

export function SupportChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const { messages, input, handleInputChange, handleSubmit, setMessages } = useChat({
    api: "/api/support-chat",
  })
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClientComponentClient()

  // Efeito para rolar para o final do chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Efeito para buscar mensagens e iniciar conversa
  // Este useEffect agora também irá popular o estado do Vercel AI SDK
  useEffect(() => {
    const initConversation = async () => {
      // Lógica para criar ou recuperar uma conversationId (pode usar localStorage)
      let convId = localStorage.getItem("support_conversation_id")
      if (!convId) {
        const { data, error } = await supabase
          .from("support_conversations")
          .insert({})
          .select()
          .single()
        if (data) {
          convId = data.id
          if (convId) {
            localStorage.setItem("support_conversation_id", convId)
          }
        }
      }
      setConversationId(convId)

      // Se tivermos um ID de conversa, buscamos o histórico de mensagens
      if (convId) {
        const { data: existingMessages, error } = await supabase
          .from("support_messages")
          .select("*")
          .eq("conversation_id", convId)
          .order("created_at", { ascending: true })

        if (error) {
          console.error("Erro ao buscar mensagens:", error);
        } else if (existingMessages) {
          // Popula o estado do `useChat` com o histórico
          const formattedMessages = existingMessages.map(msg => ({
            id: msg.id.toString(),
            role: msg.sender_type === "user" ? "user" : "assistant" as "user" | "assistant",
            content: msg.content,
          }));
          setMessages(formattedMessages);
        }
      }
    }
    if(isOpen) {
        initConversation();
    }
  }, [isOpen])

  // Efeito para ouvir mensagens em tempo real
  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`support_chat_${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as {
            id: string | number
            sender_type: "user" | "assistant"
            content: string
          }

          // Apenas adiciona a mensagem se for do assistente, para evitar duplicar a do usuário
          if (newMessage.sender_type === "assistant") {
            setMessages((prev) => [
              ...prev,
              { id: newMessage.id.toString(), role: "assistant", content: newMessage.content },
            ])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, supabase, setMessages])

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <Card className="w-80 h-96 flex flex-col shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between p-4 bg-gray-50 border-b">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-blue-600" />
              <CardTitle className="text-lg">Assistente Virtual</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-end gap-2 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
              }`}>
                {msg.role !== "user" && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 shrink-0">
                    <Bot className="h-5 w-5 text-blue-600"/>
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </CardContent>
          <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
            <Input value={input} onChange={handleInputChange} placeholder="Digite sua mensagem..." />
            <Button type="submit" size="icon"><Send className="h-4 w-4" /></Button>
          </form>
        </Card>
      )}
      <Button onClick={() => setIsOpen(!isOpen)} size="icon" className="rounded-full w-16 h-16 bg-gradient-to-tr from-blue-600 to-purple-600 text-white shadow-xl hover:scale-110 transition-transform">
        {isOpen ? <X className="h-8 w-8" /> : <MessageSquare className="h-8 w-8" />}
      </Button>
    </div>
  )
}
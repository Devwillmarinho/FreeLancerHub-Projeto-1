import { NextResponse } from "next/server"
import { z } from "zod"
import { formidable } from "formidable"
import fs from "node:fs/promises"
import { supabaseAdmin, supabase } from "@/lib/supabase" // Usando o client do Supabase
import { authMiddleware } from "@/middleware/auth"
import { NextRequestWithUser } from "@/types"

// Função para processar formulários com arquivos
async function parseFormData(req: NextRequestWithUser) {
  return new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
    const form = formidable({})
    form.parse(req as any, (err, fields, files) => {
      if (err) {
        reject(err)
      }
      resolve([fields, files])
    })
  })
}

// Schema de validação com Zod
const messageSchema = z.object({
  project_id: z.string().uuid("ID do projeto inválido."),
  content: z.string().min(1, "O conteúdo da mensagem não pode estar vazio."),
})

// Função para LER mensagens de um projeto
export async function GET(request: NextRequestWithUser) {
  const authResult = await authMiddleware(request)
  if (authResult) return authResult

  try {
    const user = request.user
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("project_id")

    if (!projectId) {
      return NextResponse.json({ error: "O ID do projeto é obrigatório." }, { status: 400 })
    }

    // Verificar se o usuário faz parte do projeto
    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("company_id, freelancer_id")
      .eq("id", projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 })
    }

    const isParticipant = project.company_id === user.id || project.freelancer_id === user.id || user.user_type === "admin"
    if (!isParticipant) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
    }

    // Buscar mensagens
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from("messages")
      .select(`*, sender:profiles(id, full_name, avatar_url, user_type)`)
      .eq("project_id", projectId)
      .order("created_at", { ascending: true })

    if (messagesError) throw messagesError

    return NextResponse.json({ data: messages })
  } catch (error: any) {
    console.error("API Message GET Error:", error)
    return NextResponse.json({ error: error.message || "Erro interno do servidor." }, { status: 500 })
  }
}

// Função para ENVIAR mensagem
export async function POST(request: NextRequestWithUser) {
  const authResult = await authMiddleware(request)
  if (authResult) return authResult

  try {
    const user = request.user
    const [fields, files] = await parseFormData(request)

    const validation = messageSchema.safeParse({
      project_id: fields.project_id?.[0],
      content: fields.content?.[0],
    })

    if (!validation.success) {
      return NextResponse.json({ error: "Dados inválidos.", issues: validation.error.flatten().fieldErrors }, { status: 400 })
    }

    const { project_id, content } = validation.data

    // Verificar se o usuário faz parte do projeto
    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("company_id, freelancer_id")
      .eq("id", project_id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 })
    }

    const isParticipant = project.company_id === user.id || project.freelancer_id === user.id || user.user_type === "admin"
    if (!isParticipant) {
      return NextResponse.json({ error: "Acesso negado. Você não faz parte deste projeto." }, { status: 403 })
    }

    // Lógica de upload de arquivo
    let fileUrl: string | undefined = undefined
    let fileName: string | undefined = undefined
    const uploadedFile = files.attachment?.[0]

    if (uploadedFile) {
      const fileContent = await fs.readFile(uploadedFile.filepath)
      const uniqueFileName = `${Date.now()}-${uploadedFile.originalFilename}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(uniqueFileName, fileContent, {
          contentType: uploadedFile.mimetype || "application/octet-stream",
          upsert: false,
        })

      if (uploadError) throw new Error("Falha ao fazer upload do arquivo.")

      const { data: publicUrlData } = supabase.storage.from("project-files").getPublicUrl(uploadData.path)
      fileUrl = publicUrlData.publicUrl
      fileName = uploadedFile.originalFilename

      await fs.unlink(uploadedFile.filepath)
    }

    // Inserir mensagem no banco
    const { data: newMessage, error: insertError } = await supabaseAdmin
      .from("messages")
      .insert({
        project_id,
        sender_id: user.id,
        content,
        file_url: fileUrl,
        file_name: fileName,
      })
      .select("*, sender:profiles(id, full_name, avatar_url)")
      .single()

    if (insertError) throw insertError

    return NextResponse.json({ data: newMessage, message: "Mensagem enviada." }, { status: 201 })
  } catch (error: any) {
    console.error("API Message POST Error:", error)
    return NextResponse.json({ error: error.message || "Erro interno do servidor." }, { status: 500 })
  }
}

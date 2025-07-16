import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { formidable } from "formidable";
import fs from "node:fs/promises";
import path from "node:path";
import prisma from "@/lib/prisma"; // Assumindo que seu Prisma Client está em /lib
import { supabase } from "@/lib/supabaseClient"; // Assumindo que seu Supabase Client está em /lib

// Helper para obter o ID do usuário a partir do token (adapte conforme sua implementação de autenticação)
import { getUserIdFromRequest } from "@/lib/auth-helpers";

// IMPORTANTE: Desativa o bodyParser padrão do Next.js para esta rota específica.
// Isso é necessário para que o formidable consiga processar o fluxo do formulário.
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    // 1. Autenticar o usuário
    const senderId = await getUserIdFromRequest(req);
    if (!senderId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 2. Processar o formulário com 'formidable'
    const form = formidable();
    const [fields, files] = await form.parse(req as any);

    // Extrair os campos de texto do formulário
    const projectId = fields.projectId?.[0];
    const content = fields.content?.[0];

    if (!projectId || !content) {
      return NextResponse.json(
        { error: "ID do projeto e conteúdo da mensagem são obrigatórios." },
        { status: 400 }
      );
    }

    // 3. Lidar com o upload do arquivo, se existir
    let fileUrl: string | null = null;
    let fileName: string | null = null;
    const uploadedFile = files.attachment?.[0];

    if (uploadedFile) {
      // Ler o arquivo do caminho temporário
      const fileContent = await fs.readFile(uploadedFile.filepath);
      const uniqueFileName = `${Date.now()}-${uploadedFile.originalFilename}`;

      // Fazer o upload para o Supabase Storage
      // Certifique-se de ter um bucket chamado 'project-files' no seu Supabase.
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("project-files") // Nome do seu bucket
        .upload(uniqueFileName, fileContent, {
          contentType: uploadedFile.mimetype || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase Upload Error:", uploadError);
        throw new Error("Falha ao fazer upload do arquivo.");
      }

      // Obter a URL pública do arquivo
      const { data: publicUrlData } = supabase.storage
        .from("project-files")
        .getPublicUrl(uploadData.path);

      fileUrl = publicUrlData.publicUrl;
      fileName = uploadedFile.originalFilename;

      // Opcional: remover o arquivo temporário
      await fs.unlink(uploadedFile.filepath);
    }

    // 4. Salvar a mensagem no banco de dados com Prisma
     const newMessage = await prisma.message.create({
      data: {
        project_id: projectId,
        sender_id: senderId,
        content,
        file_url: fileUrl,
        file_name: fileName,
      },
      include: {
        // Incluir dados do remetente para exibir no frontend
        sender: {
          select: { name: true, avatar_url: true },
        },
      },
    });

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error: any) {
    console.error("API Message POST Error:", error);
    return NextResponse.json(
      { error: error.message || "Ocorreu um erro interno no servidor." },
      { status: 500 }
    );
  }
}

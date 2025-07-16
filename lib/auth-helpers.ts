import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

/**
 * Define a interface do payload (dados) que esperamos dentro do nosso token JWT.
 * Isso nos ajuda a ter autocompletar e segurança de tipos.
 */
interface UserPayload {
  id: string;
  user_type: "admin" | "company" | "freelancer";
  iat: number;
  exp: number;
}

/**
 * Extrai e valida o token JWT do cabeçalho de uma requisição Next.js.
 * Se o token for válido, retorna o ID do usuário.
 * @param req O objeto da requisição (NextRequest)
 * @returns O ID do usuário (string) ou null se a autenticação falhar.
 */
export function getUserIdFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return null; // Nenhum cabeçalho de autorização
  }

  const token = authHeader.split(" ")[1]; // Espera o formato "Bearer <token>"
  if (!token) {
    return null; // Token não encontrado
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error(
        "JWT_SECRET não está definido nas variáveis de ambiente."
      );
    }

    const decoded = jwt.verify(token, jwtSecret) as UserPayload;
    return decoded.id;
  } catch (error) {
    console.error("Falha na verificação do JWT:", error);
    return null; // Token inválido ou expirado
  }
}

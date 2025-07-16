// lib/authorization.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { verify } from 'jsonwebtoken';

// Defina uma interface para o payload do seu token
interface TokenPayload {
  id: string;
  user_type: 'admin' | 'company' | 'freelancer';
  iat: number;
  exp: number;
}

// Higher-Order Function para criar o middleware
export const withAuthorization = (
  handler: (req: NextApiRequest, res: NextApiResponse) => void,
  allowedRoles: Array<'admin' | 'company' | 'freelancer'>
) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const { authorization } = req.headers;

      if (!authorization) {
        return res.status(401).json({ error: 'Token não fornecido.' });
      }

      // Extrai o token (formato: "Bearer TOKEN")
      const token = authorization.split(' ')[1];

      // Aqui você adicionaria sua chave secreta do JWT
      const decoded = verify(token, process.env.JWT_SECRET as string) as TokenPayload;
      
      // Adiciona os dados do usuário à requisição para uso posterior
      // @ts-ignore
      req.user = { id: decoded.id, user_type: decoded.user_type };

      if (!allowedRoles.includes(decoded.user_type)) {
        return res.status(403).json({ error: 'Acesso negado. Permissões insuficientes.' });
      }

      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
  };
};
import { createMocks } from 'node-mocks-http';
import registerHandler from '@/pages/api/auth/register';

// Mock do Prisma Client
const mockCreateUser = jest.fn();
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: {
      findUnique: jest.fn().mockResolvedValue(null), // Simula que o usuário não existe
      create: mockCreateUser,
    },
  })),
}));

// Mock do bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

describe('/api/auth/register', () => {
  it('deve registrar um novo usuário com dados válidos', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        name: 'Test Freelancer',
        email: 'test@example.com',
        password: 'password123',
        user_type: 'freelancer',
      },
    });

    await registerHandler(req, res);

    expect(res._getStatusCode()).toBe(201);
    expect(mockCreateUser).toHaveBeenCalledWith(expect.objectContaining({ data: { email: 'test@example.com' } }));
  });

  // TODO: Adicionar mais testes: email já existe, senha curta, dados faltando, etc.
});

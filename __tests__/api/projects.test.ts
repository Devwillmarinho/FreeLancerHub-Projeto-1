import { createMocks } from 'node-mocks-http';
import projectHandler from '@/pages/api/projects';

// Mock do Prisma e Supabase
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    project: {
      create: jest.fn().mockResolvedValue({ id: 'mock-project-id', title: 'Test Project' }),
    },
    user: {
      findUnique: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

jest.mock('@supabase/auth-helpers-nextjs', () => ({
    createServerSupabaseClient: jest.fn(() => ({
        auth: {
            getSession: jest.fn().mockResolvedValue({ data: { session: { user: { id: 'test-company-id' } } } }),
        },
    })),
}));

describe('/api/projects', () => {
  it('deve retornar 403 se um não-empresa tentar criar um projeto', async () => {
    // Arrange
    const { req, res } = createMocks({
      method: 'POST',
      body: { title: 'Projeto Inválido' /* ... outros dados ... */ },
    });

    // Mock para retornar um usuário que não é empresa
    const { PrismaClient } = require('@prisma/client');
    new PrismaClient().user.findUnique.mockResolvedValue({ id: 'test-user', user_type: 'freelancer' });
    
    await projectHandler(req, res);

    expect(res._getStatusCode()).toBe(403);
    expect(JSON.parse(res._getData())).toEqual(expect.objectContaining({ error: 'Apenas empresas podem criar projetos.' }));
  });
  
  // ... outros testes para sucesso na criação, dados inválidos, etc.
});

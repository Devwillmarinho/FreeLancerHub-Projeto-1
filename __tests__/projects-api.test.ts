/**
 * @jest-environment node
 */
import { POST as createProject } from '@/app/api/projects/route'
import { createRequest } from 'node-mocks-http'

// Mock do cliente Supabase para não depender do serviço real nos testes
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-company-id' } } }),
    },
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: { id: 'new-project-id' }, error: null }),
        })),
      })),
    })),
  }),
}))

describe('API /api/projects', () => {
  it('deve retornar erro 400 (Bad Request) se o corpo da requisição for inválido', async () => {
    const invalidBody = {
      title: 'tst', // Menor que o mínimo de 5
      description: 'short desc', // Menor que o mínimo de 20
      budget: -100, // Não é positivo
      required_skills: [], // Vazio
    }

    const req = createRequest({
      method: 'POST',
      json: () => Promise.resolve(invalidBody),
    })

    const res = await createProject(req as any)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.errors).toHaveProperty('title')
    expect(json.errors).toHaveProperty('description')
    expect(json.errors).toHaveProperty('budget')
    expect(json.errors).toHaveProperty('required_skills')
  })

  // Adicione mais testes: para sucesso, para usuário não autorizado, etc.
})
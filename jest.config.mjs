// jest.config.ts
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  // Se você quiser ativar setup para testes (descomente se usar)
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Defina o ambiente como 'node' para testes de rotas/API
  testEnvironment: 'node',

  // 🔧 Corrige imports com @/
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  // 🔍 Garante que o Jest resolva arquivos a partir da raiz do projeto
  moduleDirectories: ['node_modules', '<rootDir>'],
}

export default createJestConfig(customJestConfig)

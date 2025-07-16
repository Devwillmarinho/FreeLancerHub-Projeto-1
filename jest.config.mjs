import nextJest from 'next/jest.js'
 
const createJestConfig = nextJest({
  // Forneça o caminho para seu aplicativo Next.js para carregar arquivos next.config.js e .env em seu ambiente de teste
  dir: './',
})
 
// Adicione qualquer configuração personalizada a ser passada para o Jest
/** @type {import('jest').Config} */
const customJestConfig = {
  // Adicionar mais opções de configuração antes de cada teste ser executado
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // É importante definir o ambiente como 'node' para testar rotas de API
  testEnvironment: 'node',
}
 
// createJestConfig é exportado desta forma para garantir que next/jest possa carregar a configuração do Next.js que é assíncrona
export default createJestConfig(customJestConfig)
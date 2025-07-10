# Sistema de Gestão de Freelancers e Projetos

**Dupla:** [Will Marinho] e [Douglas Treloso]

**Projeto:** Sistema de Gestão de Freelancers e Projetos

## Tecnologias Utilizadas

### Backend

- **Node.js** - Runtime JavaScript
- **Next.js 15** - Framework full-stack
- **PostgreSQL** - Banco de dados relacional
- **Supabase** - Backend-as-a-Service
- **JWT** - Autenticação por token
- **OAuth 2.0** - Autenticação social (Google)
- **Express Validator** - Validação de dados
- **Jest** - Framework de testes
- **Bcrypt** - Hash de senhas

### Frontend

- **React 18** - Biblioteca de interface
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS
- **Shadcn/ui** - Componentes de interface

### Deploy e Produção

- **Supabase** - Banco de dados em produção

## Funcionalidades

### Tipos de Usuários

1. **Admin** - Modera a plataforma
2. **Empresa** - Cria projetos e contrata freelancers
3. **Freelancer** - Se candidata e trabalha nos projetos

### Recursos Principais

- ✅ CRUD de projetos e propostas
- ✅ Sistema de mensagens e arquivos por projeto
- ✅ Status do projeto (em andamento, finalizado, etc.)
- ✅ Sistema de avaliações após conclusão
- ✅ Sistema de contratos simulado
- ✅ Dois tipos de autenticação (JWT + OAuth Google)
- ✅ Autorização baseada em permissões
- ✅ Validação de dados completa
- ✅ Testes unitários com Jest
- ✅ API RESTful documentada

## Como Executar

\`\`\`bash

# Instalar dependências

npm install

# Configurar variáveis de ambiente

cp .env.example .env.local

# Executar testes

npm test

# Executar em desenvolvimento

npm run dev

# Build para produção

npm run build
npm start
\`\`\`

## Estrutura do Projeto

\`\`\`
├── app/
│ ├── api/ # API Routes (Backend)
│ ├── auth/ # Páginas de autenticação
│ ├── dashboard/ # Dashboard dos usuários
│ └── projects/ # Páginas de projetos
├── components/ # Componentes React
├── lib/ # Utilitários e configurações
├── middleware/ # Middlewares de autenticação
├── tests/ # Testes unitários
└── types/ # Definições TypeScript
\`\`\`

## API Endpoints

### Autenticação

- \`POST /api/auth/login\` - Login com email/senha
- \`POST /api/auth/register\` - Registro de usuário
- \`POST /api/auth/google\` - Login com Google OAuth

### Projetos

- \`GET /api/projects\` - Listar projetos
- \`POST /api/projects\` - Criar projeto
- \`PUT /api/projects/[id]\` - Atualizar projeto
- \`DELETE /api/projects/[id]\` - Deletar projeto

### Propostas

- \`GET /api/proposals\` - Listar propostas
- \`POST /api/proposals\` - Criar proposta
- \`PUT /api/proposals/[id]\` - Atualizar proposta

### Mensagens

- \`GET /api/messages/[projectId]\` - Mensagens do projeto
- \`POST /api/messages\` - Enviar mensagem

## Deploy

a definir

## Licença

MIT License

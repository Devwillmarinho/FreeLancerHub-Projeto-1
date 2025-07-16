# Estágio 1: Instalação de dependências
FROM node:18-alpine AS deps
# Instala o libc6-compat para o Next.js funcionar corretamente no Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copia os manifestos de pacotes e instala as dependências
COPY package.json package-lock.json* ./
RUN npm ci

# Estágio 2: Build da aplicação
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Define os argumentos que podem ser passados durante o build.
# Use os nomes das suas variáveis de ambiente do Supabase.
# Geralmente, as que são expostas ao cliente começam com NEXT_PUBLIC_.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
# Adicione o argumento para a chave secreta
ARG SUPABASE_KEY
# Adiciona o argumento para a URL do banco de dados do Prisma
ARG DATABASE_URL

# Define as variáveis de ambiente para o processo de build
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
# Torne a chave secreta disponível para o build
ENV SUPABASE_KEY=$SUPABASE_KEY
ENV DATABASE_URL=$DATABASE_URL

# Corrige o formato do ENV para remover o aviso
ENV NEXT_TELEMETRY_DISABLED=1

# Gera o Prisma Client antes do build
RUN npx prisma generate

RUN npm run build

# Estágio 3: Produção
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia os arquivos da build standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
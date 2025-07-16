-- Criação das tabelas do sistema de freelancers

-- Enum para tipos de usuário
CREATE TYPE user_type AS ENUM ('admin', 'company', 'freelancer');

-- Enum para status de projeto
CREATE TYPE project_status AS ENUM ('draft', 'open', 'in_progress', 'completed', 'cancelled');

-- Enum para status de proposta
CREATE TYPE proposal_status AS ENUM ('pending', 'accepted', 'rejected');

-- Tabela de usuários
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    user_type user_type NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    skills TEXT[], -- Array de habilidades para freelancers
    company_name VARCHAR(255), -- Para empresas
    google_id VARCHAR(255) UNIQUE, -- Para OAuth Google
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de projetos
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    budget DECIMAL(10,2) NOT NULL,
    deadline DATE,
    status project_status DEFAULT 'draft',
    required_skills TEXT[] NOT NULL,
    company_id UUID REFERENCES users(id) ON DELETE CASCADE,
    freelancer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de propostas
CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    freelancer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    proposed_budget DECIMAL(10,2) NOT NULL,
    estimated_duration INTEGER, -- em dias
    status proposal_status DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(project_id, freelancer_id)
);

-- Tabela de mensagens
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    file_url TEXT,
    file_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de contratos
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    company_id UUID REFERENCES users(id) ON DELETE CASCADE,
    freelancer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    budget DECIMAL(10,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    terms TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de avaliações
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reviewed_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    -- Adicionado campo para comentário da avaliação
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(contract_id, reviewer_id)
);

-- Índices para performance
CREATE INDEX idx_projects_company_id ON projects(company_id);
CREATE INDEX idx_projects_freelancer_id ON projects(freelancer_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_proposals_project_id ON proposals(project_id);
CREATE INDEX idx_proposals_freelancer_id ON proposals(freelancer_id);
CREATE INDEX idx_messages_project_id ON messages(project_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas de Segurança (Row Level Security)

-- Habilitar RLS para todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;


-- Usuários podem ver a si mesmos e outros usuários públicos
CREATE POLICY "Users can view themselves and public profiles" ON users
FOR SELECT USING (auth.uid() = id OR is_active = true);

-- Apenas empresas autenticadas podem criar projetos
CREATE POLICY "Companies can create projects" ON projects
FOR INSERT WITH CHECK (auth.uid() in (select id from users where user_type = 'company'));

-- Todos podem ver projetos abertos ('open')
CREATE POLICY "Anyone can view open projects" ON projects
FOR SELECT USING (true); -- Permite que todos vejam todos os projetos por padrão

-- Empresas só podem atualizar seus próprios projetos
CREATE POLICY "Companies can update their own projects" ON projects
FOR UPDATE USING (auth.uid() = company_id);

-- Freelancers podem se candidatar a projetos abertos
CREATE POLICY "Freelancers can create proposals for open projects" ON proposals
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  (SELECT user_type FROM users WHERE id = auth.uid()) = 'freelancer' AND
  (SELECT status FROM projects WHERE id = project_id) = 'open'
);

-- Usuários envolvidos em um projeto podem ver as propostas
CREATE POLICY "Involved users can see proposals" ON proposals
FOR SELECT USING (auth.uid() = freelancer_id OR auth.uid() = (SELECT company_id FROM projects WHERE id = project_id));

-- Policies para o Supabase Storage
-- Cria o bucket para arquivos de projetos
-- (Execute este comando uma vez manualmente no editor SQL do Supabase)
-- INSERT INTO storage.buckets (id, name) VALUES ('project_files', 'project_files');

-- Usuários autenticados podem fazer upload no bucket de arquivos
CREATE POLICY "Authenticated users can upload files" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'project_files');

-- Usuários autenticados podem ler arquivos do bucket
CREATE POLICY "Authenticated users can read files" ON storage.objects
FOR SELECT TO authenticated USING (bucket_id = 'project_files');

-- Função para atualizar o status da proposta e do projeto atomicamente
CREATE OR REPLACE FUNCTION update_proposal_status(
    proposal_id_to_update UUID,
    new_status proposal_status,
    company_id_check UUID
)
RETURNS proposals AS $$
DECLARE
    updated_proposal proposals;
    target_project_id UUID;
    freelancer_to_assign_id UUID;
BEGIN
    -- Atualiza a proposta e retorna os dados
    UPDATE proposals
    SET status = new_status
    WHERE id = proposal_id_to_update
      AND project_id IN (SELECT id FROM projects WHERE company_id = company_id_check)
    RETURNING *, project_id, freelancer_id INTO updated_proposal, target_project_id, freelancer_to_assign_id;

    -- Se a proposta foi aceita, atualiza o projeto
    IF new_status = 'accepted' AND updated_proposal IS NOT NULL THEN
        UPDATE projects
        SET status = 'in_progress',
            freelancer_id = freelancer_to_assign_id
        WHERE id = target_project_id;
    END IF;

    RETURN updated_proposal;
END;
$$ LANGUAGE plpgsql;

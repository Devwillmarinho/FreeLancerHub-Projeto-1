-- Enum para status de projeto
CREATE TYPE public.project_status AS ENUM ('draft', 'open', 'in_progress', 'completed', 'cancelled');

-- Enum para status de proposta
CREATE TYPE public.proposal_status AS ENUM ('pending', 'accepted', 'rejected');

-- Tabela de perfis públicos, ligada à autenticação do Supabase
-- Esta tabela substitui a tabela 'users' antiga.
-- NOTA: A tabela 'profiles' e o tipo 'user_type' já devem ter sido criados pelo script de correção anterior.
-- Se você resetar o banco, pode descomentar as linhas abaixo para recriá-los.
/*
CREATE TYPE public.user_type AS ENUM ('company', 'freelancer');

CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  company_name text,
  avatar_url text,
  user_type public.user_type,
  bio text,
  skills text[],
  updated_at timestamp with time zone DEFAULT now()
);
*/

-- Tabela de projetos
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    budget DECIMAL(10,2) NOT NULL,
    deadline DATE,
    status public.project_status DEFAULT 'draft',
    required_skills TEXT[] NOT NULL,
    company_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    freelancer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de propostas
CREATE TABLE public.proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    freelancer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    proposed_budget DECIMAL(10,2) NOT NULL,
    estimated_duration INTEGER, -- em dias
    status public.proposal_status DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(project_id, freelancer_id)
);

-- Tabela de mensagens
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    file_url TEXT,
    file_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de contratos
CREATE TABLE public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    freelancer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    budget DECIMAL(10,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    terms TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de avaliações
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewed_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(contract_id, reviewer_id)
);

-- Índices para performance
CREATE INDEX idx_projects_company_id ON public.projects(company_id);
CREATE INDEX idx_projects_freelancer_id ON public.projects(freelancer_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_proposals_project_id ON public.proposals(project_id);
CREATE INDEX idx_proposals_freelancer_id ON public.proposals(freelancer_id);
CREATE INDEX idx_messages_project_id ON public.messages(project_id);
CREATE INDEX idx_profiles_user_type ON public.profiles(user_type);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Políticas de Segurança (Row Level Security)

-- Habilitar RLS para todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Apenas empresas autenticadas podem criar projetos
CREATE POLICY "Companies can create projects" ON public.projects
FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE user_type = 'company'));

-- Todos podem ver projetos abertos ('open')
CREATE POLICY "Anyone can view open projects" ON public.projects
FOR SELECT USING (true);

-- Empresas só podem atualizar seus próprios projetos
CREATE POLICY "Companies can update their own projects" ON public.projects
FOR UPDATE USING (auth.uid() = company_id);

-- Freelancers podem se candidatar a projetos abertos
CREATE POLICY "Freelancers can create proposals for open projects" ON public.proposals
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  (SELECT user_type FROM public.profiles WHERE id = auth.uid()) = 'freelancer' AND
  (SELECT status FROM public.projects WHERE id = project_id) = 'open'
);

-- Usuários envolvidos em um projeto podem ver as propostas
CREATE POLICY "Involved users can see proposals" ON public.proposals
FOR SELECT USING (auth.uid() = freelancer_id OR auth.uid() = (SELECT company_id FROM public.projects WHERE id = project_id));

-- Policies para o Supabase Storage
-- (O bucket deve ser criado manualmente ou por um script de setup)

-- Usuários autenticados podem fazer upload no bucket de arquivos
CREATE POLICY "Authenticated users can upload files" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'project_files');

-- Usuários autenticados podem ler arquivos do bucket
CREATE POLICY "Authenticated users can read files" ON storage.objects
FOR SELECT TO authenticated USING (bucket_id = 'project_files');

-- Função para atualizar o status da proposta e do projeto atomicamente
CREATE OR REPLACE FUNCTION public.update_proposal_status(
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
    UPDATE public.proposals
    SET status = new_status
    WHERE id = proposal_id_to_update
      AND project_id IN (SELECT id FROM public.projects WHERE company_id = company_id_check)
    RETURNING *, project_id, freelancer_id INTO updated_proposal, target_project_id, freelancer_to_assign_id;

    -- Se a proposta foi aceita, atualiza o projeto
    IF new_status = 'accepted' AND updated_proposal IS NOT NULL THEN
        UPDATE public.projects
        SET status = 'in_progress',
            freelancer_id = freelancer_to_assign_id
        WHERE id = target_project_id;
    END IF;

    RETURN updated_proposal;
END;
$$ LANGUAGE plpgsql;

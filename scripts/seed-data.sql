-- Dados de exemplo para o sistema

-- NOTA: Este script assume que você já criou os seguintes usuários
-- através da sua aplicação ou do painel do Supabase:
-- - 'empresa1@test.com' (type: company)
-- - 'empresa2@test.com' (type: company)
-- - 'freelancer1@test.com' (type: freelancer)
-- - 'freelancer2@test.com' (type: freelancer)
-- Este script irá falhar se os usuários não existirem em `auth.users` e `public.profiles`.

DO $$
DECLARE
    company1_id uuid;
    company2_id uuid;
    freelancer1_id uuid;
    freelancer2_id uuid;
    project1_id uuid;
    project2_id uuid;
    project3_id uuid;
    contract_id uuid;
BEGIN
    -- Obter IDs dos usuários a partir da tabela de perfis
    SELECT id INTO company1_id FROM public.profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'empresa1@test.com');
    SELECT id INTO company2_id FROM public.profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'empresa2@test.com');
    SELECT id INTO freelancer1_id FROM public.profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'freelancer1@test.com');
    SELECT id INTO freelancer2_id FROM public.profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'freelancer2@test.com');

    -- Verificar se os usuários foram encontrados
    IF company1_id IS NULL OR company2_id IS NULL OR freelancer1_id IS NULL OR freelancer2_id IS NULL THEN
        RAISE EXCEPTION 'Um ou mais usuários de teste não foram encontrados. Crie-os primeiro.';
    END IF;

    -- Atualizar skills dos freelancers
    UPDATE public.profiles SET skills = ARRAY['JavaScript', 'React', 'Node.js', 'PostgreSQL'] 
    WHERE id = freelancer1_id;

    UPDATE public.profiles SET skills = ARRAY['UI/UX Design', 'Figma', 'Adobe Creative Suite', 'Prototyping'] 
    WHERE id = freelancer2_id;

    -- Inserir projetos de exemplo
    INSERT INTO public.projects (title, description, budget, deadline, status, required_skills, company_id) VALUES
    ('Desenvolvimento de E-commerce', 'Preciso de um e-commerce completo com carrinho de compras, pagamento e área administrativa.', 15000.00, CURRENT_DATE + INTERVAL '60 days', 'open', ARRAY['JavaScript', 'React', 'Node.js', 'PostgreSQL'], company1_id)
    RETURNING id INTO project1_id;

    INSERT INTO public.projects (title, description, budget, deadline, status, required_skills, company_id) VALUES
    ('Redesign de Interface Mobile', 'Redesign completo do aplicativo mobile com foco em UX/UI moderno.', 8000.00, CURRENT_DATE + INTERVAL '30 days', 'open', ARRAY['UI/UX Design', 'Figma', 'Mobile Design'], company2_id)
    RETURNING id INTO project2_id;

    INSERT INTO public.projects (title, description, budget, deadline, status, required_skills, company_id) VALUES
    ('Sistema de Gestão Interna', 'Sistema web para gestão de funcionários e processos internos.', 25000.00, CURRENT_DATE + INTERVAL '90 days', 'draft', ARRAY['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'], company1_id)
    RETURNING id INTO project3_id;

    -- Inserir propostas de exemplo
    INSERT INTO public.proposals (project_id, freelancer_id, message, proposed_budget, estimated_duration, status) VALUES
    (project1_id, freelancer1_id, 'Tenho experiência sólida em desenvolvimento de e-commerce. Posso entregar um sistema completo com todas as funcionalidades solicitadas.', 14000.00, 45, 'pending');

    INSERT INTO public.proposals (project_id, freelancer_id, message, proposed_budget, estimated_duration, status) VALUES
    (project2_id, freelancer2_id, 'Especialista em design mobile com portfolio robusto. Posso criar uma interface moderna e intuitiva.', 7500.00, 25, 'accepted');

    -- Atualizar projeto com freelancer aceito
    UPDATE public.projects 
    SET freelancer_id = freelancer2_id,
        status = 'in_progress'
    WHERE id = project2_id;

    -- Inserir contrato de exemplo
    INSERT INTO public.contracts (project_id, company_id, freelancer_id, budget, start_date, terms) VALUES
    (project2_id, company2_id, freelancer2_id, 7500.00, CURRENT_DATE, 'Contrato para redesign de interface mobile. Prazo de 25 dias. Pagamento em 2 parcelas: 50% no início e 50% na entrega.')
    RETURNING id INTO contract_id;

    -- Inserir mensagens de exemplo
    INSERT INTO public.messages (project_id, sender_id, content) VALUES
    (project2_id, company2_id, 'Olá! Gostei da sua proposta. Podemos conversar sobre os detalhes do projeto?');

    INSERT INTO public.messages (project_id, sender_id, content) VALUES
    (project2_id, freelancer2_id, 'Claro! Estou disponível para uma reunião. Quando seria melhor para vocês?');

END $$;

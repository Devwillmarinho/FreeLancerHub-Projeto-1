-- Dados de exemplo para o sistema

-- Inserir usuários de exemplo
INSERT INTO users (email, password_hash, name, user_type, bio, company_name) VALUES
('admin@freelance.com', '$2b$10$rOzJqQjQjQjQjQjQjQjQjO', 'Admin Sistema', 'admin', 'Administrador da plataforma', NULL),
('empresa1@test.com', '$2b$10$rOzJqQjQjQjQjQjQjQjQjO', 'João Silva', 'company', 'CEO da empresa', 'Tech Solutions LTDA'),
('empresa2@test.com', '$2b$10$rOzJqQjQjQjQjQjQjQjQjO', 'Maria Santos', 'company', 'Diretora de TI', 'Digital Innovations'),
('freelancer1@test.com', '$2b$10$rOzJqQjQjQjQjQjQjQjQjO', 'Carlos Developer', 'freelancer', 'Desenvolvedor Full Stack com 5 anos de experiência', NULL),
('freelancer2@test.com', '$2b$10$rOzJqQjQjQjQjQjQjQjQjO', 'Ana Designer', 'freelancer', 'Designer UX/UI especializada em interfaces modernas', NULL);

-- Atualizar skills dos freelancers
UPDATE users SET skills = ARRAY['JavaScript', 'React', 'Node.js', 'PostgreSQL'] 
WHERE email = 'freelancer1@test.com';

UPDATE users SET skills = ARRAY['UI/UX Design', 'Figma', 'Adobe Creative Suite', 'Prototyping'] 
WHERE email = 'freelancer2@test.com';

-- Inserir projetos de exemplo
INSERT INTO projects (title, description, budget, deadline, status, required_skills, company_id) 
SELECT 
    'Desenvolvimento de E-commerce',
    'Preciso de um e-commerce completo com carrinho de compras, pagamento e área administrativa.',
    15000.00,
    CURRENT_DATE + INTERVAL '60 days',
    'open',
    ARRAY['JavaScript', 'React', 'Node.js', 'PostgreSQL'],
    id
FROM users WHERE email = 'empresa1@test.com';

INSERT INTO projects (title, description, budget, deadline, status, required_skills, company_id) 
SELECT 
    'Redesign de Interface Mobile',
    'Redesign completo do aplicativo mobile com foco em UX/UI moderno.',
    8000.00,
    CURRENT_DATE + INTERVAL '30 days',
    'open',
    ARRAY['UI/UX Design', 'Figma', 'Mobile Design'],
    id
FROM users WHERE email = 'empresa2@test.com';

INSERT INTO projects (title, description, budget, deadline, status, required_skills, company_id) 
SELECT 
    'Sistema de Gestão Interna',
    'Sistema web para gestão de funcionários e processos internos.',
    25000.00,
    CURRENT_DATE + INTERVAL '90 days',
    'draft',
    ARRAY['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'],
    id
FROM users WHERE email = 'empresa1@test.com';

-- Inserir propostas de exemplo
INSERT INTO proposals (project_id, freelancer_id, message, proposed_budget, estimated_duration, status)
SELECT 
    p.id,
    f.id,
    'Tenho experiência sólida em desenvolvimento de e-commerce. Posso entregar um sistema completo com todas as funcionalidades solicitadas.',
    14000.00,
    45,
    'pending'
FROM projects p, users f 
WHERE p.title = 'Desenvolvimento de E-commerce' 
AND f.email = 'freelancer1@test.com';

INSERT INTO proposals (project_id, freelancer_id, message, proposed_budget, estimated_duration, status)
SELECT 
    p.id,
    f.id,
    'Especialista em design mobile com portfolio robusto. Posso criar uma interface moderna e intuitiva.',
    7500.00,
    25,
    'accepted'
FROM projects p, users f 
WHERE p.title = 'Redesign de Interface Mobile' 
AND f.email = 'freelancer2@test.com';

-- Atualizar projeto com freelancer aceito
UPDATE projects 
SET freelancer_id = (SELECT id FROM users WHERE email = 'freelancer2@test.com'),
    status = 'in_progress'
WHERE title = 'Redesign de Interface Mobile';

-- Inserir contrato de exemplo
INSERT INTO contracts (project_id, company_id, freelancer_id, budget, start_date, terms)
SELECT 
    p.id,
    c.id,
    f.id,
    7500.00,
    CURRENT_DATE,
    'Contrato para redesign de interface mobile. Prazo de 25 dias. Pagamento em 2 parcelas: 50% no início e 50% na entrega.'
FROM projects p, users c, users f
WHERE p.title = 'Redesign de Interface Mobile'
AND c.email = 'empresa2@test.com'
AND f.email = 'freelancer2@test.com';

-- Inserir mensagens de exemplo
INSERT INTO messages (project_id, sender_id, content)
SELECT 
    p.id,
    c.id,
    'Olá! Gostei da sua proposta. Podemos conversar sobre os detalhes do projeto?'
FROM projects p, users c
WHERE p.title = 'Redesign de Interface Mobile'
AND c.email = 'empresa2@test.com';

INSERT INTO messages (project_id, sender_id, content)
SELECT 
    p.id,
    f.id,
    'Claro! Estou disponível para uma reunião. Quando seria melhor para vocês?'
FROM projects p, users f
WHERE p.title = 'Redesign de Interface Mobile'
AND f.email = 'freelancer2@test.com';

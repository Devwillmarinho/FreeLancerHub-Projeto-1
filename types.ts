import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email?: string; // O email pode vir do objeto de autenticação
  user_type: 'company' | 'freelancer' | 'admin' | null;
  full_name: string | null;
  company_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  skills: string[] | null;
}

// Estendendo o NextRequest para incluir o user autenticado
import type { NextRequest } from 'next/server';

export interface NextRequestWithUser extends NextRequest {
  user: UserProfile & User; // Middleware deve garantir que o usuário exista
}

// Tipos de dados do Dashboard
export interface DashboardProject {
  id: string;
  title: string;
  budget: number;
  deadline: string | null;
  status: string;
  freelancer_id: string | null;
  company: {
    id: string;
    full_name: string | null;
    company_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface DashboardProposal {
  id: string;
  project: { title: string };
  freelancer: { full_name: string };
  status: string;
  message: string;
  proposed_budget: number;
}

export interface DashboardContract {
  id: string;
  project: { title: string };
  freelancer: { full_name: string };
  status: string;
  budget: number;
}

export interface AdminUser extends UserProfile {
  email: string; // Garante que o email esteja presente na visão do admin
}

import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  user_type: 'company' | 'freelancer';
  full_name?: string;
  // adicione aqui outros campos do perfil que você usa
  // ...
  company_id?: string | null;
}

// Estendendo o NextRequest para incluir o user autenticado
import type { NextRequest } from 'next/server';

export interface NextRequestWithUser extends NextRequest {
  user?: UserProfile & User;
}

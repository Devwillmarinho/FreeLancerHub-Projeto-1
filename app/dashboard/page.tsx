import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClientPage from './DashboardClientPage'
import { UserProfile } from '@/types'

// Força a página a ser sempre renderizada dinamicamente, desabilitando o cache.
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/auth/login')
  }

  // Busca o perfil do usuário na sua tabela 'profiles'
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    console.error("Erro ao buscar perfil ou perfil não encontrado:", error);
    // Se o perfil não for encontrado, redireciona para o login com uma mensagem de erro
    return redirect('/auth/login?error=profile_not_found')
  }

  // Monta o objeto de perfil para passar para o componente cliente
  const userProfile: UserProfile = profile

  return (
    <DashboardClientPage
      userEmail={user.email}
      profile={userProfile}
      userType={userProfile.user_type}
    />
  )
}

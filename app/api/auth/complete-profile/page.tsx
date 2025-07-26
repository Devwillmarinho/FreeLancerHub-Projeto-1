'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, Building, AlertCircle } from 'lucide-react';

type UserType = 'freelancer' | 'company';

export default function CompleteProfilePage() {
  const [userType, setUserType] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Verifica se o usuário está logado, senão redireciona para o login
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
      }
    };
    checkSession();
  }, [supabase, router]);

  const handleSubmit = async () => {
    if (!userType) {
      setError('Por favor, selecione um tipo de conta.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão não encontrada.');

      const response = await fetch('/api/profiles/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ user_type: userType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao completar o perfil.');
      }

      // Redireciona para o dashboard após completar o perfil com sucesso
      router.push('/dashboard');
      router.refresh(); // Força a recarga para obter os novos dados do servidor
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Complete seu Perfil</CardTitle>
          <CardDescription>Para continuar, por favor, escolha o tipo da sua conta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Button variant={userType === 'freelancer' ? 'default' : 'outline'} className="h-24 text-lg" onClick={() => setUserType('freelancer')}>
              <User className="mr-2 h-6 w-6" />
              Freelancer
            </Button>
            <Button variant={userType === 'company' ? 'default' : 'outline'} className="h-24 text-lg" onClick={() => setUserType('company')}>
              <Building className="mr-2 h-6 w-6" />
              Empresa
            </Button>
          </div>
          <Button onClick={handleSubmit} disabled={loading || !userType} className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? 'Salvando...' : 'Continuar para o Dashboard'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


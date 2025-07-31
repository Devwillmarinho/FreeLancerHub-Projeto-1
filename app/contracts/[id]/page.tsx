import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Briefcase, User, Building, DollarSign, Calendar, Star } from 'lucide-react';

// This is a server component
export default async function ContractDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const contractId = params.id;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/auth/login');
  }

  // Fetch contract details
  const { data: contract, error } = await supabase
    .from('contracts')
    .select(`
      id,
      budget,
      start_date,
      end_date,
      is_completed,
      project:projects!inner(id, title, description, required_skills),
      company:profiles!company_id(id, full_name, company_name, avatar_url),
      freelancer:profiles!freelancer_id(id, full_name, avatar_url)
    `)
    .eq('id', contractId)
    .single();

  if (error || !contract) {
    console.error('Error fetching contract:', error);
    notFound();
  }

  // Security check: ensure the logged-in user is part of this contract
  const userId = session.user.id;
  if (userId !== contract.company.id && userId !== contract.freelancer.id) {
    // Or redirect to an unauthorized page
    return (
        <div className="container mx-auto p-4 text-center">
            <h1 className="text-2xl font-bold text-red-500">Acesso Negado</h1>
            <p>Você não tem permissão para ver este contrato.</p>
            <Link href="/dashboard">
                <Button className="mt-4">Voltar ao Dashboard</Button>
            </Link>
        </div>
    );
  }
  
  // Fetch review for this contract
  const { data: review } = await supabase
    .from('reviews')
    .select('rating, comment, reviewer:profiles!reviewer_id(full_name)')
    .eq('contract_id', contractId)
    .maybeSingle();


  return (
    <div className="min-h-screen bg-muted/40">
      <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>

        <Card className="w-full">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl lg:text-3xl">{contract.project.title}</CardTitle>
                <CardDescription className="mt-1">Detalhes do Contrato #{contract.id.substring(0, 8)}</CardDescription>
              </div>
              <Badge variant={contract.is_completed ? 'default' : 'secondary'} className={`text-sm ${contract.is_completed ? 'bg-green-600' : 'bg-yellow-500'} text-white`}>
                {contract.is_completed ? 'Concluído' : 'Em Andamento'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Project Details */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold border-b pb-2">Sobre o Projeto</h3>
              <p className="text-muted-foreground">{contract.project.description}</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center text-sm">
                  <DollarSign className="h-4 w-4 mr-2 text-primary" />
                  <span>Orçamento: <span className="font-bold">R$ {contract.budget.toLocaleString('pt-BR')}</span></span>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-primary" />
                  <span>Início: <span className="font-bold">{new Date(contract.start_date).toLocaleDateString('pt-BR')}</span></span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Habilidades Necessárias:</h4>
                <div className="flex flex-wrap gap-2">
                  {contract.project.required_skills.map(skill => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Parties Involved */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company */}
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={contract.company.avatar_url ?? undefined} />
                    <AvatarFallback>{(contract.company.company_name || 'C').substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">{contract.company.company_name}</h4>
                    <p className="text-sm text-muted-foreground">Empresa Contratante</p>
                  </div>
                </CardHeader>
              </Card>
              {/* Freelancer */}
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={contract.freelancer.avatar_url ?? undefined} />
                    <AvatarFallback>{(contract.freelancer.full_name || 'F').substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">{contract.freelancer.full_name}</h4>
                    <p className="text-sm text-muted-foreground">Freelancer Contratado</p>
                  </div>
                </CardHeader>
              </Card>
            </div>

            {/* Review Section */}
            {contract.is_completed && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold border-b pb-2">Avaliação Final</h3>
                {review ? (
                  <Card className="bg-muted/50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold">Avaliação de {review.reviewer.full_name}</p>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-5 w-5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground italic">"{review.comment}"</p>
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-muted-foreground text-center py-4">Ainda não há uma avaliação para este contrato.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

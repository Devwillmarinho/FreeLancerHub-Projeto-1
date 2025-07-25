'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { DollarSign, Calendar, Users, Loader2, Send, CheckCircle } from 'lucide-react';
import Link from 'next/link';

// Tipos para os dados recebidos do servidor
type Project = {
  id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string | null;
  status: string;
  required_skills: string[];
  company: {
    id: string;
    full_name: string;
    company_name: string;
    avatar_url: string;
  };
  proposals: Proposal[];
};

type Proposal = {
  id: string;
  message: string;
  proposed_budget: number;
  status: string;
  freelancer: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
};

type UserProfile = {
  id: string;
  user_type: 'freelancer' | 'company';
} | null;

type Session = {
  user: { id: string };
  access_token: string;
} | null;

interface ProjectDetailsClientPageProps {
  project: Project;
  session: Session;
  userProfile: UserProfile;
}

export default function ProjectDetailsClientPage({ project, session, userProfile }: ProjectDetailsClientPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccepting, setIsAccepting] = useState<string | null>(null);
  const [proposalMessage, setProposalMessage] = useState('');
  const [proposalBudget, setProposalBudget] = useState('');

  const isOwner = session?.user.id === project.company.id;
  const isFreelancer = userProfile?.user_type === 'freelancer';
  const hasAlreadyProposed = project.proposals.some(p => p.freelancer.id === session?.user.id);

  const handleSendProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          project_id: project.id,
          message: proposalMessage,
          proposed_budget: Number(proposalBudget),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao enviar proposta.');
      }

      toast({ title: "Sucesso!", description: "Sua proposta foi enviada." });
      router.refresh(); // Recarrega os dados do servidor para mostrar a proposta enviada
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptProposal = async (proposalId: string) => {
    if (!session) return;
    setIsAccepting(proposalId);
    try {
      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status: 'accepted' }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao aceitar proposta.');
      }

      toast({ title: "Sucesso!", description: "Proposta aceita! O projeto foi atualizado." });
      router.refresh();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: 'destructive' });
    } finally {
      setIsAccepting(null);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <Button variant="outline" onClick={() => router.back()} className="mb-8">Voltar</Button>
      <div className="grid md:grid-cols-3 gap-8">
        {/* Coluna Principal */}
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">{project.title}</CardTitle>
              <CardDescription>Publicado por {project.company.company_name}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Habilidades Necessárias</h3>
                <div className="flex flex-wrap gap-2">
                  {project.required_skills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção de Propostas */}
          {isOwner && (
            <Card>
              <CardHeader>
                <CardTitle>Propostas Recebidas ({project.proposals.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.proposals.length > 0 ? project.proposals.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={p.freelancer.avatar_url} />
                        <AvatarFallback>{p.freelancer.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{p.freelancer.full_name}</p>
                        <p className="text-sm text-gray-500">Orçamento: R$ {p.proposed_budget.toLocaleString()}</p>
                      </div>
                    </div>
                    {project.status === 'open' && (
                      <Button size="sm" onClick={() => handleAcceptProposal(p.id)} disabled={!!isAccepting}>
                        {isAccepting === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aceitar'}
                      </Button>
                    )}
                  </div>
                )) : <p>Nenhuma proposta recebida ainda.</p>}
              </CardContent>
            </Card>
          )}

          {/* Formulário de Proposta */}
          {isFreelancer && !isOwner && project.status === 'open' && (
            hasAlreadyProposed ? (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6 flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <p className="font-medium text-green-800">Você já enviou uma proposta para este projeto.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Enviar sua Proposta</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSendProposal} className="space-y-4">
                    <div>
                      <Label htmlFor="message">Sua mensagem de apresentação</Label>
                      <Textarea id="message" value={proposalMessage} onChange={e => setProposalMessage(e.target.value)} placeholder="Descreva por que você é a pessoa certa para este projeto..." required />
                    </div>
                    <div>
                      <Label htmlFor="budget">Seu orçamento (R$)</Label>
                      <Input id="budget" type="number" value={proposalBudget} onChange={e => setProposalBudget(e.target.value)} placeholder="12000" required />
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      {isSubmitting ? 'Enviando...' : 'Enviar Proposta'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )
          )}
        </div>

        {/* Coluna Lateral */}
        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Orçamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Orçamento</span>
                <span className="font-bold text-lg text-green-600">R$ {project.budget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Prazo</span>
                <span className="font-semibold">{project.deadline ? new Date(project.deadline).toLocaleDateString('pt-BR') : 'Flexível'}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Sobre a Empresa</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={project.company.avatar_url} />
                <AvatarFallback>{project.company.company_name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{project.company.company_name}</p>
                <p className="text-sm text-gray-500">{project.company.full_name}</p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

"use client";

import { useTheme } from "next-themes";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Calendar, DollarSign, Loader2, Send, CheckCircle, AlertTriangle, Sun, Moon } from "lucide-react";
import { Database } from "@/types/supabase";

type Project = Database['public']['Tables']['projects']['Row'] & {
  company: Database['public']['Tables']['profiles']['Row'] | null;
};

type Profile = Database['public']['Tables']['profiles']['Row'];

interface ProjectDetailsClientPageProps {
  project: Project;
  userProfile: Profile | null;
  hasExistingProposal: boolean;
}

export default function ProjectDetailsClientPage({ project, userProfile, hasExistingProposal }: ProjectDetailsClientPageProps) {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const { toast } = useToast();
  const { setTheme, theme } = useTheme();

  const [proposalMessage, setProposalMessage] = useState("");
  const [proposedBudget, setProposedBudget] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(hasExistingProposal);

  // A condição para mostrar o formulário
  const canSubmitProposal = userProfile?.user_type === 'freelancer' && project.status === 'open';
  const isAssignedFreelancer = userProfile?.id === project.freelancer_id;

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitProposal || isSubmitted) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: "Não autenticado", variant: "destructive" });
      return;
    }

    setIsLoading(true);
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
          proposed_budget: Number(proposedBudget),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        // Trata o erro específico de proposta já enviada
        if (response.status === 409) {
            throw new Error("Você já enviou uma proposta para este projeto.");
        }
        throw new Error(result.error || 'Falha ao enviar proposta.');
      }

      toast({ title: "Sucesso!", description: "Sua proposta foi enviada." });
      setIsSubmitted(true);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    if (status === 'open') return 'default';
    if (status === 'in_progress') return 'default'; // Base para amarelo
    if (status === 'completed') return 'default'; // Base para cinza
    return 'destructive';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-6">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Alternar tema</span>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl font-bold">{project.title}</CardTitle>
                <CardDescription className="flex items-center space-x-2 mt-2">
                  <Avatar className="h-6 w-6"><AvatarImage src={project.company?.avatar_url ?? undefined} /><AvatarFallback>{(project.company?.company_name || 'C').substring(0, 1)}</AvatarFallback></Avatar>
                  <span>Publicado por {project.company?.company_name || 'Empresa'}</span>
                </CardDescription>
              </div>
              <Badge
                variant={getStatusVariant(project.status)}
                className={`capitalize text-lg px-4 py-1 ${project.status === 'open' ? 'bg-green-600 hover:bg-green-700 text-white' : ''} ${project.status === 'in_progress' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : ''} ${project.status === 'completed' ? 'bg-slate-500 hover:bg-slate-600 text-white' : ''}`}
              >
                {project.status.replace('_', ' ')}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-muted/50 rounded-lg"><p className="text-sm text-muted-foreground">Orçamento</p><p className="text-lg font-semibold flex items-center justify-center"><DollarSign className="h-5 w-5 mr-1" /> {project.budget.toLocaleString('pt-BR')}</p></div>
              <div className="p-4 bg-muted/50 rounded-lg"><p className="text-sm text-muted-foreground">Prazo</p><p className="text-lg font-semibold flex items-center justify-center"><Calendar className="h-5 w-5 mr-1" /> {project.deadline ? new Date(project.deadline).toLocaleDateString('pt-BR') : 'Não definido'}</p></div>
              <div className="p-4 bg-muted/50 rounded-lg"><p className="text-sm text-muted-foreground">Habilidades</p><div className="flex flex-wrap gap-1 justify-center mt-1">{project.required_skills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}</div></div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">Descrição do Projeto</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{project.description}</p>
            </div>

            {/* --- LÓGICA PRINCIPAL AQUI --- */}
            {canSubmitProposal && (
              <div className="border-t pt-6">
                {isSubmitted ? (
                  <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 rounded-lg">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-green-800 dark:text-green-300">Proposta Enviada!</h3>
                    <p className="text-muted-foreground mt-2">A empresa foi notificada. Você pode acompanhar o status na sua área de "Minhas Propostas".</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitProposal} className="space-y-4">
                    <h3 className="text-xl font-semibold">Envie sua Proposta</h3>
                    <div className="space-y-2">
                      <Label htmlFor="proposalMessage">Sua Mensagem</Label>
                      <Textarea
                        id="proposalMessage"
                        placeholder="Apresente-se, destaque sua experiência relevante e por que você é a pessoa certa para este projeto."
                        rows={5}
                        value={proposalMessage}
                        onChange={(e) => setProposalMessage(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="proposedBudget">Seu Orçamento (R$)</Label>
                      <Input
                        id="proposedBudget"
                        type="number"
                        placeholder="Ex: 14000"
                        value={proposedBudget}
                        onChange={(e) => setProposedBudget(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={isLoading} className="w-full">
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      {isLoading ? 'Enviando...' : 'Enviar Proposta'}
                    </Button>
                  </form>
                )}
              </div>
            )}

            {/* Mensagem para empresas ou freelancers que não podem se candidatar */}
            {userProfile?.user_type === 'company' && (
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded-lg">
                    <p className="text-blue-800 dark:text-blue-300">Esta é a visualização do seu projeto. As propostas recebidas aparecerão no seu dashboard.</p>
                </div>
            )}

            {project.status !== 'open' && userProfile?.user_type === 'freelancer' && !isAssignedFreelancer && (
                 <Alert variant="default" className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-500/30 text-yellow-800 dark:text-yellow-300">
                    <AlertTriangle className="h-4 w-4 !text-yellow-800 dark:!text-yellow-300" />
                    <AlertTitle>Propostas Encerradas</AlertTitle>
                    <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                      Este projeto não está mais aceitando novas propostas, pois já se encontra {project.status === 'in_progress' ? 'em andamento' : 'finalizado'}.
                    </AlertDescription>
                  </Alert>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}

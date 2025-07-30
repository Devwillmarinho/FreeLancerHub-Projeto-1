"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Corrigido para importação correta
import { Button } from "@/components/ui/button"; // Corrigido: 'button' em minúsculo
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CardFooter } from "@/components/ui/card";
import {
  Briefcase,
  Users,
  DollarSign,
  TrendingUp,
  Plus,
  Calendar,
  MessageSquare,
  Star,
  User,
  Settings,
  Camera,
  Bell,
  LogOut,
  Edit,
  Trash2,
  Trash,
  Eye,
  Send,
  Filter,
  Search,
  Loader2,
  CheckCircle,
  Moon,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";
import { DashboardProject, DashboardProposal, DashboardContract, AdminUser, UserProfile } from "@/types";

// Props que o componente receberá do "porteiro" (page.tsx)
interface DashboardClientPageProps {
  userEmail: string | undefined;
  profile: UserProfile;
  userType: 'freelancer' | 'company' | 'admin' | null;
}

type EditableProfile = {
  full_name: string;
  company_name?: string | null;
  bio: string | null;
  skills: string[];
}

export default function DashboardClientPage({ userEmail, profile, userType }: DashboardClientPageProps) {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const { toast } = useToast();
  const { setTheme, theme } = useTheme();

  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [editableProfile, setEditableProfile] = useState<EditableProfile>({
    full_name: profile?.full_name ?? '',
    company_name: profile?.company_name ?? '',
    bio: profile?.bio ?? '',
    skills: profile?.skills ?? [],
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    budget: "",
    deadline: "",
    skills: "",
    category: "",
  });
  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [proposals, setProposals] = useState<DashboardProposal[]>([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(true);
  const [contracts, setContracts] = useState<DashboardContract[]>([]);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isLoadingContracts, setIsLoadingContracts] = useState(true);
  const [myGigs, setMyGigs] = useState<DashboardProject[]>([]);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [browseProjects, setBrowseProjects] = useState<DashboardProject[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [updatingProposalId, setUpdatingProposalId] = useState<string | null>(null);
  const [viewingProposal, setViewingProposal] = useState<DashboardProposal | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<DashboardProject | null>(null);


  const stats = [
    {
      title: "Projetos Ativos",
      value: "12",
      icon: Briefcase,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "+2 este mês",
    },
    {
      title: "Propostas Recebidas",
      value: "48",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: "+8 novas",
    },
    {
      title: "Valor em Contratos",
      value: "R$ 25.000",
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: "+15% vs mês anterior",
    },
    {
      title: "Taxa de Sucesso",
      value: "94%",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      change: "+2% este trimestre",
    },
  ];

  // Lógica para calcular o número de projetos ativos com base no tipo de usuário
  const activeProjectsCount = () => {
    if (userType === 'company') {
      // Para empresas, conta todos os projetos que não estão finalizados ou cancelados.
      return projects.filter(p => p.status === 'draft' || p.status === 'open' || p.status === 'in_progress').length;
    }
    // Para freelancers, conta apenas os projetos que estão de fato em andamento.
    // Usamos 'myGigs' que já contém os projetos do freelancer.
    return myGigs.filter(p => p.status === 'in_progress').length;
  };

  // Estatísticas dinâmicas
  const dynamicStats = [
    {
      ...stats[0],
      value: isLoadingProjects ? <Loader2 className="h-6 w-6 animate-spin" /> : activeProjectsCount().toString(),
      title: userType === 'company' ? 'Projetos Ativos' : 'Projetos em Andamento',
    },
    {
      ...stats[1],
      value: isLoadingProposals ? <Loader2 className="h-6 w-6 animate-spin" /> : proposals.length.toString(),
      title: userType === 'company' ? 'Propostas Recebidas' : 'Propostas Enviadas',
    },
    {
      ...stats[2],
      value: isLoadingContracts ? <Loader2 className="h-6 w-6 animate-spin" /> : `R$ ${contracts.reduce((sum, c) => sum + c.budget, 0).toLocaleString('pt-BR')}`,
    },
    {
      ...stats[3], // Taxa de sucesso é algo que vou botar só no futuro. to sem paciencia de fazer isso agora kkk.
    }
  ];

  // Filtra os projetos com base na busca e no status
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    if (status === 'open' || status === 'active') return 'default';
    if (status === 'in_progress') return 'default'; // Usaremos 'default' como base para o amarelo
    if (status === 'pending') return 'secondary';
    if (status === 'completed') return 'default'; // Usaremos 'default' como base para o cinza
    return 'destructive';
  }

  // A busca de dados agora é simplificada, pois as políticas de segurança (RLS)
  // do Supabase já filtram os dados no backend.
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile?.id) {
        toast({ title: "Sessão expirada", description: "Por favor, faça login novamente.", variant: "destructive" });
        router.push('/auth/login');
        return;
      }

      setIsLoadingProjects(true);
      setIsLoadingProposals(true);
      setIsLoadingContracts(true);
      if (userType === 'admin') setIsLoadingUsers(true);

      try {
        // Pedimos os projetos diretamente ao Supabase.
        // As regras de RLS que acabamos de criar vai filtrar os resultados no automático.
        let projectsQuery = supabase
          .from('projects')
          .select(`
            id, title, budget, deadline, status, freelancer_id,
            company:profiles!company_id(id, full_name, company_name, avatar_url)
          `)
          .order('created_at', { ascending: false });

        // Adicionei um filtro explícito para garantir que a empresa veja apenas seus projetos.
        // Isso funciona como uma camada extra de segurança e clareza, além do RLS no meu ponto de vista.
        if (userType === 'company') {
          projectsQuery = projectsQuery.eq('company_id', profile.id);
        }

        const { data: projectsData, error: projectsError } = await projectsQuery;

        // Busca as propostas através da API, que já tem a lógica de permissão correta.
        const { data: { session: apiSession } } = await supabase.auth.getSession();
        if (!apiSession) {
          throw new Error('Sessão não encontrada para chamada de API.');
        }
        const proposalsResponse = await fetch('/api/proposals', {
          headers: {
            Authorization: `Bearer ${apiSession.access_token}`,
          },
        });
        if (!proposalsResponse.ok) {
          throw new Error('Falha ao buscar propostas.');
        }
        const proposalsPayload = await proposalsResponse.json();
        const proposalsData = proposalsPayload.data || [];

        const { data: contractsData, error: contractsError } = await supabase.from('contracts').select(`*, project:projects(title), company:profiles!company_id(id, company_name), freelancer:profiles!freelancer_id(id, full_name)`);

        if (projectsError || contractsError) {
          throw projectsError || contractsError;
        }

        setProjects(projectsData || []);
        setProposals(proposalsData);
        setContracts(contractsData || []);

        // Adiciona uma verificação para garantir que cada projeto no array é um objeto válido,
        // filtrando qualquer item que seja `null` ou `undefined`.
        const validProjects = (projectsData || []).filter(p => p);

        if (userType === 'freelancer') {
          // Para freelancers, separamos os projetos abertos dos que já são dele.
          setMyGigs(validProjects.filter(p => p.freelancer_id === profile.id));
          setBrowseProjects(validProjects.filter(p => p.status === 'open' && p.freelancer_id !== profile.id));
        } else {
          // Para empresas, a RLS já filtrou. Todos os projetos recebidos são dela.
          setMyGigs(validProjects);
          setBrowseProjects([]); // Empresas não exploram projetos
        }

        // Se for admin, busca todos os usuários
        if (userType === 'admin') {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const usersResponse = await fetch('/api/users', {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              }
            });
            if (!usersResponse.ok) {
              throw new Error('Falha ao buscar usuários');
            }
            const usersData = await usersResponse.json();
            setAllUsers(usersData.data || []);
          }
        }
      } catch (error) {
        console.error("Falha ao buscar dados do dashboard:", error);
        toast({ title: "Erro", description: "Não foi possível carregar os dados do dashboard.", variant: "destructive" });
      } finally {
        setIsLoadingProjects(false);
        setIsLoadingProposals(false);
        setIsLoadingContracts(false);
        if (userType === 'admin') setIsLoadingUsers(false);
      }
    };

    fetchDashboardData();
  }, [userType, profile?.id, toast, router, supabase]);

  const handleCreateProject = async () => {
    // Pega a sessão mais recente do lado do cliente para garantir um token válido.
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      toast({
        title: "Não autenticado",
        description: "Você precisa estar logado para criar um projeto.",
        variant: "destructive",
      });
      router.push('/auth/login');
      return;
    }

    // Defensive check: Ensure user type is correct before making an API call.
    if (userType !== 'company') {
      toast({
        title: "Ação não permitida",
        description: "Apenas usuários do tipo 'empresa' podem criar projetos.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingProject(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: newProject.title,
          description: newProject.description,
          budget: Number(newProject.budget),
          // Melhoria: Filtra strings vazias caso o input esteja em branco ou tenha vírgulas extras.
          required_skills: newProject.skills.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });

      if (!response.ok) {
        // Lógica de erro aprimorada para dar mais detalhes.
        let errorMessage = `Falha na API com status ${response.status}.`;
        try {
          const errorData = await response.json();
          // Lida com erros de validação estruturados da sua API
          if (errorData.errors && typeof errorData.errors === 'object') {
            errorMessage = Object.values(errorData.errors).flat().join(' ');
          } else {
            // Lida com outros formatos de erro
            errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
          }
        } catch (e) {
          // Se a resposta de erro não for JSON, usa o texto do status HTTP.
          errorMessage = `Falha na API com status ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const createdProject = await response.json();
      // Adicionado tratamento para diferentes formatos de resposta da API
      const newProjectData = (createdProject.data || createdProject) as DashboardProject;
      setProjects((prevProjects) => [newProjectData, ...prevProjects]);
      setMyGigs((prevGigs) => [newProjectData, ...prevGigs]); // <-- ADICIONE ESTA LINHA

      setShowNewProjectDialog(false);
      setNewProject({ // Limpa o formulário
        title: "",
        description: "",
        budget: "",
        deadline: "",
        skills: "",
        category: "",
      });
      toast({ title: "Sucesso!", description: "Seu projeto foi criado." });
    } catch (error: any) {
      console.error("Erro ao criar projeto:", error);
      toast({
        title: "Erro ao criar projeto",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  const handleDeleteProject = async (projectId: string) => {
    // Pega a sessão mais recente do lado do cliente para garantir um token válido.
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      toast({
        title: "Não autenticado",
        description: "Você precisa estar logado para apagar um projeto.",
        variant: "destructive",
      });
      router.push('/auth/login');
      return;
    }

    setDeletingProjectId(projectId);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao apagar o projeto.');
      }

      // Remove o projeto da lista na interface
      setMyGigs((prevGigs) => prevGigs.filter(p => p.id !== projectId));
      setProjects((prevProjects) => prevProjects.filter(p => p.id !== projectId));
      toast({ title: "Sucesso!", description: "Projeto apagado." });
      setProjectToDelete(null); // Fecha o diálogo de confirmação
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: 'destructive' });
    } finally {
      setDeletingProjectId(null);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Pega a sessão mais recente do lado do cliente para garantir um token válido.
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !profile) {
      toast({
        title: "Não autenticado",
        description: "Você precisa estar logado para atualizar o perfil.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const response = await fetch(`/api/profiles/${profile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(editableProfile),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao atualizar o perfil.');
      }

      toast({ title: "Sucesso!", description: "Seu perfil foi atualizado." });
      setShowProfileDialog(false);
      // Força a recarga da página para que o novo nome apareça no header
      router.refresh(); 
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdateProposalStatus = async (proposalId: string, status: 'accepted' | 'rejected') => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: "Não autenticado", variant: "destructive" });
      return;
    }

    setUpdatingProposalId(proposalId);
    try {
      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Falha ao atualizar a proposta.');
      }

      // Atualiza a lista de propostas na interface
      setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status } : p));

      // Se aceita, atualiza o status do projeto correspondente
      if (status === 'accepted') {
        const acceptedProposal = proposals.find(p => p.id === proposalId);
        if (acceptedProposal) {
          // Esta parte é uma melhoria de UX, mas o ideal seria recarregar os projetos
          // ou receber o projeto atualizado da API. Por simplicidade, vamos recarregar.
          router.refresh(); 
        }
      }

      toast({ title: "Sucesso!", description: result.message });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: 'destructive' });
    } finally {
      setUpdatingProposalId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Diálogo para Ver Proposta */}
      <Dialog open={!!viewingProposal} onOpenChange={(isOpen) => !isOpen && setViewingProposal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Proposta</DialogTitle>
            <DialogDescription>
              Proposta de <span className="font-semibold">{viewingProposal?.freelancer.full_name}</span> para o projeto <span className="font-semibold">{viewingProposal?.project.title}</span>.
            </DialogDescription>
          </DialogHeader>
          {viewingProposal && (
            <div className="space-y-4 py-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Mensagem do Freelancer:</h4>
                <div className="p-4 bg-muted rounded-md border">
                  <p className="text-muted-foreground whitespace-pre-wrap">{viewingProposal.message}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Orçamento Proposto:</h4>
                <p className="text-lg font-bold text-green-600">
                  R$ {viewingProposal.proposed_budget.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex justify-end pt-4">
                  <Button onClick={() => setViewingProposal(null)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação para Apagar Projeto */}
      <AlertDialog open={!!projectToDelete} onOpenChange={(isOpen) => !isOpen && setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o projeto
              <span className="font-bold"> "{projectToDelete?.title}"</span> e todos os seus dados associados, como propostas e mensagens.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProjectToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => projectToDelete && handleDeleteProject(projectToDelete.id)}
              disabled={deletingProjectId === projectToDelete?.id}
            >
              {deletingProjectId === projectToDelete?.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sim, apagar projeto'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <header className="bg-card border-b shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Briefcase className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:text-transparent">
                  FreelanceHub
                </h1>
              </div>
              <div className="hidden md:block h-6 w-px bg-border"></div>
              <div className="hidden md:block">
                <h2 className="text-xl font-semibold text-foreground">
                  Dashboard
                </h2>
                <p className="text-sm text-muted-foreground">
                  Bem-vindo(a) de volta, {profile?.full_name || profile?.company_name || '...'}!
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Botão de Tema */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Alternar tema</span>
              </Button>

              {/* Botão de Perfil e Diálogo */}
              <Dialog
                open={showProfileDialog}
                onOpenChange={setShowProfileDialog}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback>{(profile?.full_name || profile?.company_name || 'U').substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block">{profile?.full_name || profile?.company_name}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Perfil do Usuário</DialogTitle>
                    <DialogDescription>
                      Gerencie suas informações e configurações.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nome Completo</Label>
                      <Input 
                        id="fullName" 
                        value={editableProfile.full_name}
                        onChange={(e) => setEditableProfile({...editableProfile, full_name: e.target.value})}
                      />
                    </div>
                    {userType === 'company' && (
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Nome da Empresa</Label>
                        <Input 
                          id="companyName" 
                          value={editableProfile.company_name || ''}
                          onChange={(e) => setEditableProfile({...editableProfile, company_name: e.target.value})}
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio / Descrição</Label>
                      <Textarea 
                        id="bio" 
                        value={editableProfile.bio || ''}
                        onChange={(e) => setEditableProfile({...editableProfile, bio: e.target.value})}
                        placeholder={userType === 'company' ? 'Descreva sua empresa...' : 'Fale sobre você...'}
                      />
                    </div>
                    {/* A edição de skills pode ser adicionada aqui no futuro */}
                    <div className="flex justify-between items-center pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={handleSignOut}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair
                      </Button>
                      <Button type="submit" disabled={isUpdatingProfile}>
                        {isUpdatingProfile ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        {isUpdatingProfile ? 'Salvando...' : 'Salvar Alterações'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dynamicStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-full ${stat.bgColor || 'bg-gray-100'}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Conteúdo Principal com Abas */}
        <Tabs defaultValue={userType === 'admin' ? 'admin' : (userType === 'freelancer' ? 'browse' : 'projects')} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className={`grid w-full ${userType === 'admin' ? 'max-w-xl grid-cols-5' : 'max-w-lg grid-cols-4'}`}>
              {userType === 'freelancer' ? (
                <>
                  <TabsTrigger value="browse">Explorar Projetos</TabsTrigger>
                  <TabsTrigger value="projects">Meus Trabalhos</TabsTrigger>
                  <TabsTrigger value="proposals">Minhas Propostas</TabsTrigger>
                  <TabsTrigger value="contracts">Contratos</TabsTrigger>
                </>
              ) : ( // Empresa ou Admin
                <>
                  <TabsTrigger value="projects">{userType === 'admin' ? 'Todos os Projetos' : 'Meus Projetos'}</TabsTrigger>
                  <TabsTrigger value="proposals">Propostas</TabsTrigger>
                  <TabsTrigger value="messages">Mensagens</TabsTrigger>
                  <TabsTrigger value="contracts">Contratos</TabsTrigger>
                  {userType === 'admin' && <TabsTrigger value="admin">Painel Admin</TabsTrigger>}
                </>
              )}
            </TabsList>
            {userType === 'company' && (
              <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Projeto
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Projeto</DialogTitle>
                    <DialogDescription>
                      Preencha as informações do seu projeto para encontrar o freelancer ideal.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {/* Campos do formulário */}
                    <div className="space-y-2">
                      <Label htmlFor="title">Título do Projeto</Label>
                      <Input id="title" placeholder="Ex: Desenvolvimento de E-commerce" value={newProject.title} onChange={(e) => setNewProject({ ...newProject, title: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea id="description" placeholder="Descreva detalhadamente o que precisa ser feito..." value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="budget">Orçamento (R$)</Label>
                        <Input id="budget" type="number" placeholder="1500" value={newProject.budget} onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="skills">Habilidades (separadas por vírgula)</Label>
                        <Input id="skills" placeholder="React, Node.js, PostgreSQL" value={newProject.skills} onChange={(e) => setNewProject({ ...newProject, skills: e.target.value })} />
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleCreateProject} disabled={isCreatingProject}>
                    {isCreatingProject && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isCreatingProject ? "Criando..." : "Criar Projeto"}
                  </Button>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {userType === 'admin' && (
            <TabsContent value="admin">
              <Card>
                <CardHeader>
                  <CardTitle>Painel de Administração</CardTitle>
                  <CardDescription>
                    Gerencie usuários, projetos e a saúde da plataforma.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingUsers ? (
                    <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Lista de Usuários ({allUsers.length})</h3>
                      <div className="border rounded-md">
                        <div className="max-h-[400px] overflow-y-auto ">
                          {allUsers.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-muted/50">
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-9 w-9">
                                  <AvatarImage src={user.avatar_url ?? undefined} />
                                  <AvatarFallback>{(user.full_name || user.company_name || 'U').substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-semibold">{user.full_name || user.company_name}</p>
                                  <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant={
                                  user.user_type === 'admin' ? 'destructive' :
                                  user.user_type === 'company' ? 'secondary' : 'default'
                                } className="capitalize">{user.user_type}</Badge>
                                <Button variant="ghost" size="sm">
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="projects">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{userType === 'admin' ? 'Gerenciar Projetos' : (userType === 'company' ? 'Meus Projetos' : 'Meus Trabalhos')}</CardTitle>
                  <CardDescription>{userType === 'admin' ? 'Visualize e gerencie todos os projetos da plataforma.' : (userType === 'company' ? 'Visualize e gerencie seus projetos.' : 'Projetos que você está trabalhando ou já concluiu.')}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar projetos..."
                      className="pl-8 w-full md:w-[250px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="open">Aberto</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingProjects ? (
                  <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : myGigs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myGigs.map((project) => (
                      <Link href={`/projects/${project.id}`} key={project.id} className="block">
                        <Card className="flex flex-col justify-between hover:shadow-md transition-shadow duration-300 h-full">
                          <CardHeader>
                            <CardTitle className="text-lg">{project.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="flex-grow space-y-2 text-sm">
                            <div className="flex items-center text-muted-foreground"><DollarSign className="h-4 w-4 mr-2" /><span>Orçamento: R$ {project.budget.toLocaleString('pt-BR')}</span></div>
                            <div className="flex items-center text-muted-foreground"><Calendar className="h-4 w-4 mr-2" /><span>Prazo: {project.deadline ? new Date(project.deadline).toLocaleDateString('pt-BR') : 'Não definido'}</span></div>
                          </CardContent>
                          <CardFooter className="flex justify-between items-center p-4 bg-muted/50">
                            <Badge
                              variant={project.status === 'open' || project.status === 'in_progress' || project.status === 'completed' ? 'default' : getStatusVariant(project.status)}
                              className={`capitalize ${project.status === 'open' ? 'bg-green-600 hover:bg-green-700 text-white border-transparent' : ''} ${project.status === 'in_progress' ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-transparent' : ''} ${project.status === 'completed' ? 'bg-slate-500 hover:bg-slate-600 text-white border-transparent' : ''}`}
                            >
                              {project.status.replace('_', ' ')}</Badge>
                            <div className="space-x-2">
                              {userType === 'company' && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-100" onClick={(e) => { e.preventDefault(); setProjectToDelete(project); }} disabled={deletingProjectId === project.id}>
                                  {deletingProjectId === project.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                            </div>
                          </CardFooter>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p>Nenhum projeto encontrado.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {userType === 'freelancer' && (
            <TabsContent value="browse">
              <Card>
                <CardHeader>
                  <CardTitle>Explorar Novos Projetos</CardTitle>
                  <CardDescription>Encontre a oportunidade perfeita para suas habilidades.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingProjects ? (
                    <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
                  ) : browseProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {browseProjects.map((project) => (
                        <Link href={`/projects/${project.id}`} key={project.id} className="block">
                          <Card className="flex flex-col justify-between hover:shadow-md transition-shadow duration-300 h-full">
                            <CardHeader>
                              <CardTitle className="text-lg">{project.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-2 text-sm">
                              <div className="flex items-center text-muted-foreground"><DollarSign className="h-4 w-4 mr-2" /><span>Orçamento: R$ {project.budget.toLocaleString('pt-BR')}</span></div>
                              <div className="flex items-center text-muted-foreground"><Calendar className="h-4 w-4 mr-2" /><span>Prazo: {project.deadline ? new Date(project.deadline).toLocaleDateString('pt-BR') : 'Não definido'}</span></div>
                            </CardContent>
                            <CardFooter className="flex justify-between items-center p-4 bg-muted/50">
                              <Badge
                                variant={project.status === 'open' || project.status === 'in_progress' || project.status === 'completed' ? 'default' : getStatusVariant(project.status)}
                                className={`capitalize ${project.status === 'open' ? 'bg-green-600 hover:bg-green-700 text-white border-transparent' : ''} ${project.status === 'in_progress' ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-transparent' : ''} ${project.status === 'completed' ? 'bg-slate-500 hover:bg-slate-600 text-white border-transparent' : ''}`}
                              >
                                {project.status.replace('_', ' ')}</Badge>
                              <Button variant="default" size="sm">Ver Detalhes</Button>
                            </CardFooter>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p>Nenhum projeto aberto no momento. Volte mais tarde!</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="proposals">
            <Card>
              <CardHeader>
                <CardTitle>{userType === 'company' ? 'Propostas Recebidas' : 'Minhas Propostas'}</CardTitle>
                <CardDescription>
                  {userType === 'company' ? 'Propostas recebidas para seus projetos.' : 'Suas candidaturas enviadas.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingProposals ? (
                  <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : proposals.length > 0 ? (
                  <div className="space-y-3">
                    {proposals.map((proposal) => (
                      <Card key={proposal.id} className="hover:shadow-md transition-shadow duration-300">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarFallback>{proposal.freelancer.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-primary">{proposal.freelancer.full_name}</p>
                              <p className="text-sm text-muted-foreground">enviou uma proposta para <span className="font-medium text-foreground">{proposal.project.title}</span></p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={proposal.status === 'accepted' ? 'default' : getStatusVariant(proposal.status)}
                              className={`capitalize ${
                                proposal.status === 'accepted' ? 'bg-green-600 hover:bg-green-700 text-white border-transparent' : 
                                proposal.status === 'pending' ? 'bg-gray-500 hover:bg-gray-600 text-white border-transparent' :
                                ''
                              }`}
                            >
                              {proposal.status}
                            </Badge>
                            {userType === 'company' && proposal.status === 'pending' && (
                              <>
                                <Button variant="destructive" size="sm" onClick={() => handleUpdateProposalStatus(proposal.id, 'rejected')} disabled={updatingProposalId === proposal.id}>
                                  {updatingProposalId === proposal.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Rejeitar'}
                                </Button>
                                <Button variant="default" size="sm" onClick={() => handleUpdateProposalStatus(proposal.id, 'accepted')} disabled={updatingProposalId === proposal.id}>
                                  {updatingProposalId === proposal.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aceitar'}
                                </Button>
                              </>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setViewingProposal(proposal)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p>Nenhuma proposta encontrada.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Mensagens</CardTitle>
                <CardDescription>Suas conversas sobre projetos.</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Funcionalidade de mensagens em breve.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts">
            <Card>
              <CardHeader>
                <CardTitle>Contratos</CardTitle>
                <CardDescription>Gerencie seus contratos e pagamentos.</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Funcionalidade de contratos em breve.</p>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}

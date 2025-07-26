"use client";

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
} from "lucide-react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";

// Tipos de dados (podem ser movidos para um arquivo separado)
interface DashboardProject {
  id: string;
  title: string;
  budget: number;
  deadline: string | null;
  status: string;
  company: {
    id: string;
    full_name: string | null;
    company_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface DashboardProposal {
  id: string;
  project: { title: string };
  freelancer: { full_name: string };
  status: string;
  proposal_text: string;
}

interface DashboardContract {
  id: string;
  project: { title: string };
  freelancer: { full_name: string };
  status: string;
}

// Props que o componente receberá do "porteiro" (page.tsx)
interface DashboardClientPageProps {
  userEmail: string | undefined;
  profile: {
    id: string;
    full_name?: string;
    company_name?: string;
    avatar_url?: string;
    bio?: string | null;
    skills?: string[] | null;
  };
  userType: 'freelancer' | 'company' | null;
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

  // Estatísticas dinâmicas
  const dynamicStats = [
    {
      ...stats[0],
      value: isLoadingProjects ? <Loader2 className="h-6 w-6 animate-spin" /> : projects.filter(p => p.status === 'open' || p.status === 'in_progress').length.toString(),
      title: userType === 'company' ? 'Projetos Ativos' : 'Projetos em Andamento',
    },
    {
      ...stats[1],
      value: isLoadingProposals ? <Loader2 className="h-6 w-6 animate-spin" /> : proposals.length.toString(),
      title: userType === 'company' ? 'Propostas Recebidas' : 'Propostas Enviadas',
    },
    {
      ...stats[2],
      value: isLoadingProjects ? <Loader2 className="h-6 w-6 animate-spin" /> : `R$ ${projects.reduce((sum, p) => sum + p.budget, 0).toLocaleString('pt-BR')}`,
    },
    {
      ...stats[3], // Taxa de sucesso pode ser calculada no futuro
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
    if (status === 'in_progress' || status === 'pending') return 'secondary';
    if (status === 'completed') return 'outline';
    return 'destructive';
  }

  // O useEffect para buscar o usuário foi removido, pois os dados já vêm por props.
  // Otimização: Busca todos os dados do dashboard em paralelo.
  useEffect(() => {
    async function fetchDashboardData() {
      // Pega a sessão mais recente do lado do cliente para garantir um token válido.
      const { data: { session } } = await supabase.auth.getSession();

      if (!session || !profile?.id) {
        // Se não houver sessão, talvez redirecionar para o login
        toast({ title: "Sessão expirada", description: "Por favor, faça login novamente.", variant: "destructive" });
        router.push('/auth/login');
        return;
      }

      setIsLoadingProjects(true);
      setIsLoadingProposals(true);
      setIsLoadingContracts(true);

      try {
        const fetchWithAuth = (url: string) => fetch(url, { // Agora usa o token da sessão atual
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        const [projectsRes, proposalsRes, contractsRes] = await Promise.all([
          fetchWithAuth("/api/projects"),
          fetchWithAuth("/api/proposals"),
          fetchWithAuth("/api/contracts"),
        ]);

        if (!projectsRes.ok || !proposalsRes.ok || !contractsRes.ok) {
          throw new Error('Falha ao buscar dados do dashboard.');
        }

        const projectsData = await projectsRes.json();
        const proposalsData = await proposalsRes.json();
        const contractsData = await contractsRes.json();

        const allProjects: DashboardProject[] = projectsData.data || [];
        setProjects(allProjects);
        setProposals(proposalsData.data || []);
        setContracts(contractsData.data || []);

        if (userType === 'freelancer') {
          // Esta lógica precisa ser ajustada, pois a propriedade freelancer_id não existe no tipo DashboardProject
          // Assumindo que a API retornará essa informação no futuro.
          // setMyGigs(allProjects.filter(p => (p as any).freelancer_id === profile.id));
          // setBrowseProjects(allProjects.filter(p => p.status === 'open' && (p as any).freelancer_id !== profile.id));
        } else {
          setMyGigs(allProjects);
        }
      } catch (error) {
        console.error("Falha ao buscar dados do dashboard:", error);
        toast({ title: "Erro", description: "Não foi possível carregar os dados do dashboard.", variant: "destructive" });
      } finally {
        setIsLoadingProjects(false);
        setIsLoadingProposals(false);
        setIsLoadingContracts(false);
      }
    }

    fetchDashboardData();
  }, [userType, profile?.id, toast, router, supabase]); // accessToken removido das dependências

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

    // Confirmação para evitar exclusão acidental
    if (!confirm('Tem certeza que deseja apagar este projeto? Esta ação não pode ser desfeita.')) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Briefcase className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  FreelanceHub
                </h1>
              </div>
              <div className="hidden md:block h-6 w-px bg-gray-300"></div>
              <div className="hidden md:block">
                <h2 className="text-xl font-semibold text-gray-900">
                  Dashboard
                </h2>
                <p className="text-sm text-gray-600">
                  Bem-vindo(a) de volta, {profile?.full_name || profile?.company_name || '...'}!
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
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
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Conteúdo Principal com Abas */}
        <Tabs defaultValue="projects" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full max-w-lg grid-cols-4">
              {userType === 'freelancer' ? (
                <>
                  <TabsTrigger value="browse">Explorar Projetos</TabsTrigger>
                  <TabsTrigger value="projects">Meus Trabalhos</TabsTrigger>
                  <TabsTrigger value="proposals">Minhas Propostas</TabsTrigger>
                  <TabsTrigger value="contracts">Contratos</TabsTrigger>
                </>
              ) : (
                <>
                  <TabsTrigger value="projects">Meus Projetos</TabsTrigger>
                  <TabsTrigger value="proposals">Propostas</TabsTrigger>
                  <TabsTrigger value="messages">Mensagens</TabsTrigger>
                  <TabsTrigger value="contracts">Contratos</TabsTrigger>
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

          <TabsContent value="projects">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{userType === 'company' ? 'Meus Projetos' : 'Meus Trabalhos'}</CardTitle>
                  <CardDescription>{userType === 'company' ? 'Visualize e gerencie seus projetos.' : 'Projetos que você está trabalhando ou já concluiu.'}</CardDescription>
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
                            <div className="flex items-center text-gray-600"><DollarSign className="h-4 w-4 mr-2" /><span>Orçamento: R$ {project.budget.toLocaleString('pt-BR')}</span></div>
                            <div className="flex items-center text-gray-600"><Calendar className="h-4 w-4 mr-2" /><span>Prazo: {project.deadline ? new Date(project.deadline).toLocaleDateString('pt-BR') : 'Não definido'}</span></div>
                          </CardContent>
                          <CardFooter className="flex justify-between items-center p-4 bg-gray-50">
                            <Badge variant={getStatusVariant(project.status)} className="capitalize">{project.status.replace('_', ' ')}</Badge>
                            <div className="space-x-2">
                              {userType === 'company' && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-100" onClick={(e) => { e.preventDefault(); handleDeleteProject(project.id); }} disabled={deletingProjectId === project.id}>
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
                              <div className="flex items-center text-gray-600"><DollarSign className="h-4 w-4 mr-2" /><span>Orçamento: R$ {project.budget.toLocaleString('pt-BR')}</span></div>
                              <div className="flex items-center text-gray-600"><Calendar className="h-4 w-4 mr-2" /><span>Prazo: {project.deadline ? new Date(project.deadline).toLocaleDateString('pt-BR') : 'Não definido'}</span></div>
                            </CardContent>
                            <CardFooter className="flex justify-between items-center p-4 bg-gray-50">
                              <Badge variant={getStatusVariant(project.status)} className="capitalize">{project.status.replace('_', ' ')}</Badge>
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
                              <p className="font-semibold text-blue-700">{proposal.freelancer.full_name}</p>
                              <p className="text-sm text-gray-600">enviou uma proposta para <span className="font-medium">{proposal.project.title}</span></p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={getStatusVariant(proposal.status)} className="capitalize">{proposal.status}</Badge>
                            <Button variant="outline" size="sm">Ver Proposta</Button>
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

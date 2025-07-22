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
  Eye,
  Send,
  Filter,
  Search,
  Loader2,
} from "lucide-react";
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
  session: Session;
  profile: {
    id: string;
    full_name?: string;
    company_name?: string;
    avatar_url?: string;
  };
  userType: 'freelancer' | 'company' | null;
}

export default function DashboardClientPage({ session, profile, userType }: DashboardClientPageProps) {
  const [supabase] = useState(() => createClientComponentClient());
  const router = useRouter();
  const { toast } = useToast();

  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
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
  const [isLoadingContracts, setIsLoadingContracts] = useState(true);

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

  // O useEffect para buscar o usuário foi removido, pois os dados já vêm por props.
  // Os useEffects para buscar projetos, propostas, etc., podem ser mantidos.
  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch("/api/projects");
        if (!response.ok) {
          throw new Error("Falha ao buscar projetos");
        }
        const data = await response.json();
        setProjects(data.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingProjects(false);
      }
    }
    if (session) { // Só busca os projetos se a sessão existir
      fetchProjects();
    }
  }, [session]);

  useEffect(() => {
    async function fetchProposals() {
      if (!session) return;
      try {
        const response = await fetch("/api/proposals");
        if (!response.ok) throw new Error("Falha ao buscar propostas");
        const data = await response.json();
        setProposals(data.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingProposals(false);
      }
    }
    fetchProposals();
  }, [session]);

  useEffect(() => {
    async function fetchContracts() {
      if (!session) return;
      try {
        const response = await fetch("/api/contracts");
        if (!response.ok) throw new Error("Falha ao buscar contratos");
        const data = await response.json();
        setContracts(data.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingContracts(false);
      }
    }
    fetchContracts();
  }, [session]);

  const handleCreateProject = async () => {
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newProject.title,
          description: newProject.description,
          budget: Number(newProject.budget),
          required_skills: newProject.skills.split(",").map((s) => s.trim()),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao criar projeto.");
      }

      const createdProject = await response.json();
      setProjects([createdProject.data, ...projects]);
      setShowNewProjectDialog(false);
      toast({ title: "Sucesso!", description: "Seu projeto foi criado." });
    } catch (error: any) {
      console.error("Erro ao criar projeto:", error);
      toast({
        title: "Erro ao criar projeto",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
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
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={profile?.avatar_url} />
                          <AvatarFallback className="text-lg">
                            {(profile?.full_name || profile?.company_name || 'U').substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <Button size="sm" className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0">
                          <Camera className="h-4 w-4" />
                        </Button>
                      </div>
                      <div>
                        <h3 className="font-semibold">{profile?.full_name || profile?.company_name}</h3>
                        <p className="text-sm text-gray-600">{session?.user.email}</p>
                        <Badge variant="secondary" className="capitalize mt-1">{userType}</Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <Settings className="mr-2 h-4 w-4" />
                        Configurações da Conta
                      </Button>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <Bell className="mr-2 h-4 w-4" />
                        Notificações
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700 bg-transparent"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair da Conta
                  </Button>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
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
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="projects">Projetos</TabsTrigger>
              <TabsTrigger value="proposals">Propostas</TabsTrigger>
              <TabsTrigger value="messages">Mensagens</TabsTrigger>
              <TabsTrigger value="contracts">Contratos</TabsTrigger>
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
                  <Button onClick={handleCreateProject}>Criar Projeto</Button>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <TabsContent value="projects">
            <Card>
              <CardHeader>
                <CardTitle>Meus Projetos</CardTitle>
                <CardDescription>Visualize e gerencie seus projetos.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingProjects ? (
                  <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : projects.length > 0 ? (
                  <div className="space-y-4">
                    {projects.map((p) => <Card key={p.id}><CardContent className="p-4">{p.title}</CardContent></Card>)}
                  </div>
                ) : (
                  <p>Nenhum projeto encontrado.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="proposals">
            <Card>
              <CardHeader>
                <CardTitle>Propostas</CardTitle>
                <CardDescription>
                  {userType === 'company' ? 'Propostas recebidas para seus projetos.' : 'Suas candidaturas enviadas.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingProposals ? (
                  <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : proposals.length > 0 ? (
                  <div className="space-y-4">
                    {proposals.map((p) => <Card key={p.id}><CardContent className="p-4">{p.project.title}</CardContent></Card>)}
                  </div>
                ) : (
                  <p>Nenhuma proposta encontrada.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Adicione aqui os TabsContent para 'messages' e 'contracts' seguindo o mesmo padrão */}

        </Tabs>
      </div>
    </div>
  );
}

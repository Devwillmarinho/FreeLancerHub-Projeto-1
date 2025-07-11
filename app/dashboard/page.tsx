"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
} from "lucide-react"

export default function DashboardPage() {
  const [userType] = useState<"company" | "freelancer" | "admin">("company")
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    budget: "",
    deadline: "",
    skills: "",
    category: "",
  })
  const [projects, setProjects] = useState<any[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [proposals, setProposals] = useState<any[]>([])
  const [isLoadingProposals, setIsLoadingProposals] = useState(true)

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
      title: "Freelancers",
      value: "48",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: "+8 novos",
    },
    {
      title: "Receita Total",
      value: "R$ 125.000",
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
  ]

  useEffect(() => {
    async function fetchProjects() {
      try {
        const token = localStorage.getItem("token") // Pega o token salvo
        const response = await fetch("/api/projects", {
          headers: {
            // Envia o token para a API para autenticação
            "Authorization": `Bearer ${token}`,
          },
        })
        if (!response.ok) {
          throw new Error("Falha ao buscar projetos")
        }
        const data = await response.json()
        setProjects(data.data)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoadingProjects(false)
      }
    }
    fetchProjects()
  }, [])

  useEffect(() => {
    async function fetchProposals() {
      try {
        const token = localStorage.getItem("token")
        const response = await fetch("/api/proposals", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) {
          throw new Error("Falha ao buscar propostas")
        }
        const data = await response.json()
        setProposals(data.data)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoadingProposals(false)
      }
    }
    fetchProposals()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "open":
        return "Aberto"
      case "in_progress":
        return "Em Andamento"
      case "completed":
        return "Concluído"
      default:
        return status
    }
  }

  const handleCreateProject = async () => {
    const token = localStorage.getItem("token")
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newProject.title,
          description: newProject.description,
          budget: Number(newProject.budget),
          deadline: newProject.deadline,
          required_skills: newProject.skills.split(",").map((s) => s.trim()),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Falha ao criar projeto.")
      }

      const createdProject = await response.json()
      setProjects([createdProject.data, ...projects]) // Adiciona o novo projeto à lista
      setShowNewProjectDialog(false) // Fecha o modal
    } catch (error) {
      console.error("Erro ao criar projeto:", error)
      // TODO: Mostrar erro para o usuário
    }
  }

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
                <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
                <p className="text-sm text-gray-600">Bem-vindo de volta, João!</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </Button>

              <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg?height=32&width=32" />
                      <AvatarFallback>JS</AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block">João Silva</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Perfil do Usuário</DialogTitle>
                    <DialogDescription>Gerencie suas informações pessoais e configurações</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src="/placeholder.svg?height=80&width=80" />
                          <AvatarFallback className="text-lg">JS</AvatarFallback>
                        </Avatar>
                        <Button size="sm" className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0">
                          <Camera className="h-4 w-4" />
                        </Button>
                      </div>
                      <div>
                        <h3 className="font-semibold">João Silva</h3>
                        <p className="text-sm text-gray-600">CEO, Tech Solutions LTDA</p>
                        <Badge variant="secondary">Empresa</Badge>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <Settings className="mr-2 h-4 w-4" />
                        Configurações da Conta
                      </Button>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <Bell className="mr-2 h-4 w-4" />
                        Notificações
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-red-600 hover:text-red-700 bg-transparent"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair da Conta
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
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

        {/* Main Content */}
        <Tabs defaultValue="projects" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="projects">Projetos</TabsTrigger>
              <TabsTrigger value="proposals">Propostas</TabsTrigger>
              <TabsTrigger value="messages">Mensagens</TabsTrigger>
              <TabsTrigger value="contracts">Contratos</TabsTrigger>
            </TabsList>

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
                    Preencha as informações do seu projeto para encontrar o freelancer ideal
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título do Projeto</Label>
                      <Input
                        id="title"
                        placeholder="Ex: Desenvolvimento de E-commerce"
                        value={newProject.title}
                        onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select
                        value={newProject.category}
                        onValueChange={(value) => setNewProject({ ...newProject, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="web-dev">Desenvolvimento Web</SelectItem>
                          <SelectItem value="mobile-dev">Desenvolvimento Mobile</SelectItem>
                          <SelectItem value="design">Design</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="writing">Redação</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva detalhadamente o que precisa ser feito..."
                      rows={4}
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="budget">Orçamento (R$)</Label>
                      <Input
                        id="budget"
                        type="number"
                        placeholder="15000"
                        value={newProject.budget}
                        onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deadline">Prazo</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={newProject.deadline}
                        onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skills">Habilidades Necessárias</Label>
                    <Input
                      id="skills"
                      placeholder="Ex: JavaScript, React, Node.js, PostgreSQL"
                      value={newProject.skills}
                      onChange={(e) => setNewProject({ ...newProject, skills: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowNewProjectDialog(false)} className="flex-1">
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreateProject}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      Criar Projeto
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <TabsContent value="projects">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Meus Projetos</CardTitle>
                    <CardDescription>Gerencie todos os seus projetos ativos</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input placeholder="Buscar projetos..." className="pl-10 w-64" />
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div key={project.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 mb-2">{project.title}</h3>
                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              R$ {project.budget.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {project.deadline}
                            </span>
                            {project.freelancer && (
                              <span className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {project.freelancer}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              {project.messages} mensagens
                            </span>
                          </div>
                          {project.status === "in_progress" && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span>Progresso</span>
                                <span>{project.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${project.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(project.status)}>{getStatusText(project.status)}</Badge>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 bg-transparent"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="proposals">
            <Card>
              <CardHeader>
                <CardTitle>Propostas Recebidas</CardTitle>
                <CardDescription>Analise as propostas dos freelancers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoadingProposals && <p>Carregando propostas...</p>}
                  {!isLoadingProposals && proposals.map((proposal) => (
                    <div key={proposal.id} className="border rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarImage src={proposal.freelancer.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>
                              {proposal.freelancer
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-gray-900">{proposal.project.title}</h3>
                            <p className="text-sm text-gray-600">
                              Freelancer: {proposal.freelancer.name} • Orçamento: R$ {proposal.proposed_budget.toLocaleString()} •
                              Prazo: {proposal.estimated_duration} dias
                            </p>
                            <div className="flex items-center mt-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-600 ml-1">{proposal.freelancer.rating || "N/A"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            className={
                              proposal.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }
                          >
                            {proposal.status === "pending" ? "Pendente" : "Aceita"}
                          </Badge>
                          {proposal.status === "pending" ? (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                Rejeitar
                              </Button>
                              <Button size="sm">Aceitar</Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline">
                              Ver Contrato
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Mensagens Recentes</CardTitle>
                <CardDescription>Conversas com freelancers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      id: 1,
                      name: "Carlos Developer",
                      project: "E-commerce",
                      lastMessage: "Enviei a primeira versão do protótipo para análise",
                      time: "2 horas atrás",
                      unread: 3,
                      avatar: "/placeholder.svg?height=40&width=40",
                    },
                    {
                      id: 2,
                      name: "Ana Designer",
                      project: "Mobile App",
                      lastMessage: "Obrigada pelo feedback! Vou fazer os ajustes",
                      time: "1 dia atrás",
                      unread: 0,
                      avatar: "/placeholder.svg?height=40&width=40",
                    },
                  ].map((chat) => (
                    <div
                      key={chat.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={chat.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {chat.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">{chat.name}</h3>
                            <span className="text-sm text-gray-500">{chat.time}</span>
                          </div>
                          <p className="text-sm text-gray-600">{chat.project}</p>
                          <p className="text-sm text-gray-800 mt-1">{chat.lastMessage}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {chat.unread > 0 && (
                            <Badge
                              variant="destructive"
                              className="rounded-full w-6 h-6 flex items-center justify-center p-0"
                            >
                              {chat.unread}
                            </Badge>
                          )}
                          <Button size="sm" variant="outline">
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts">
            <Card>
              <CardHeader>
                <CardTitle>Contratos Ativos</CardTitle>
                <CardDescription>Acompanhe o progresso dos contratos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoadingContracts && <p>Carregando contratos...</p>}
                  {!isLoadingContracts && contracts.map((contract) => (
                    <div key={contract.id} className="border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{contract.project.title}</h3>
                          <p className="text-sm text-gray-600">
                            Freelancer: {contract.freelancer.name} • Valor: R$ {contract.budget.toLocaleString()} • Início:{" "}
                            {new Date(contract.start_date).toLocaleDateString()}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="text-sm text-gray-600">{contract.freelancer.rating || "N/A"}</span>
                            </div>
                            <Badge
                              className={
                                !contract.is_completed
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                              }
                            >
                              {!contract.is_completed ? "Em Andamento" : "Concluído"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {contract.is_completed ? (
                            <Button size="sm">Avaliar</Button>
                          ) : (
                            <Button size="sm">Gerenciar</Button>
                          )}
                        </div>
                      </div>

                      {!contract.is_completed && (
                        <div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span>Progresso do Projeto</span>
                            <span>50%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `50%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

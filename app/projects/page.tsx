"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, DollarSign, Calendar, MapPin, Users, Briefcase } from "lucide-react"

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const projects = [
    {
      id: 1,
      title: "Desenvolvimento de E-commerce Completo",
      description:
        "Preciso de um e-commerce completo com carrinho de compras, sistema de pagamento integrado e área administrativa. O projeto deve ser responsivo e otimizado para SEO.",
      budget: 15000,
      deadline: "2024-03-15",
      status: "open",
      skills: ["JavaScript", "React", "Node.js", "PostgreSQL"],
      company: "Tech Solutions LTDA",
      location: "Remoto",
      proposals: 12,
    },
    {
      id: 2,
      title: "Redesign de Interface Mobile",
      description:
        "Redesign completo do aplicativo mobile com foco em UX/UI moderno. Preciso de wireframes, protótipos e implementação final.",
      budget: 8000,
      deadline: "2024-02-28",
      status: "in_progress",
      skills: ["UI/UX Design", "Figma", "Mobile Design", "Prototyping"],
      company: "Digital Innovations",
      location: "São Paulo, SP",
      proposals: 8,
      freelancer: "Ana Designer",
    },
    {
      id: 3,
      title: "Sistema de Gestão Interna",
      description:
        "Sistema web para gestão de funcionários, processos internos e relatórios. Deve incluir dashboard administrativo e diferentes níveis de acesso.",
      budget: 25000,
      deadline: "2024-04-20",
      status: "open",
      skills: ["JavaScript", "React", "Node.js", "PostgreSQL", "Docker"],
      company: "Empresa ABC",
      location: "Remoto",
      proposals: 5,
    },
    {
      id: 4,
      title: "Aplicativo de Delivery",
      description:
        "Desenvolvimento de aplicativo mobile para delivery de comida com integração de pagamento e GPS para rastreamento.",
      budget: 30000,
      deadline: "2024-05-10",
      status: "completed",
      skills: ["React Native", "Node.js", "MongoDB", "GPS Integration"],
      company: "FoodTech",
      location: "Rio de Janeiro, RJ",
      proposals: 15,
      freelancer: "Pedro Mobile",
    },
  ]

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

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || project.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Projetos Disponíveis</h1>
              <p className="text-gray-600 mt-1">Encontre o projeto perfeito para suas habilidades</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar projetos..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="open">Abertos</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluídos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Projetos</p>
                  <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                </div>
                <Briefcase className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Projetos Abertos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {projects.filter((p) => p.status === "open").length}
                  </p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="h-4 w-4 bg-blue-600 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Médio</p>
                  <p className="text-2xl font-bold text-gray-900">R$ 19.5K</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Propostas Totais</p>
                  <p className="text-2xl font-bold text-gray-900">40</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Grid */}
        <div className="grid gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{project.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">{project.description}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(project.status)}>{getStatusText(project.status)}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Project Info */}
                  <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-semibold">R$ {project.budget.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Prazo: {project.deadline}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{project.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{project.proposals} propostas</span>
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Habilidades necessárias:</p>
                    <div className="flex flex-wrap gap-2">
                      {project.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Company Info */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{project.company}</p>
                      {project.freelancer && <p className="text-sm text-gray-600">Freelancer: {project.freelancer}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                      {project.status === "open" && <Button size="sm">Enviar Proposta</Button>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum projeto encontrado</h3>
            <p className="text-gray-600">Tente ajustar os filtros ou termos de busca.</p>
          </div>
        )}
      </div>
    </div>
  )
}

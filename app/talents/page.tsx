"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Filter, Star, Briefcase, User } from "lucide-react";
import Link from "next/link";

interface Freelancer {
  id: string;
  name: string;
  avatar_url: string;
  bio: string;
  skills: string[];
  rating: number;
  projects_completed: number;
}

// Dados de exemplo para freelancers (substituir pela API)
const mockFreelancers: Freelancer[] = [
  {
    id: "1",
    name: "Carlos Developer",
    avatar_url: "/placeholder.svg?height=80&width=80",
    bio: "Desenvolvedor Full Stack com 5 anos de experiência em React, Node.js e ecossistemas em nuvem. Apaixonado por criar soluções escaláveis e performáticas.",
    skills: ["JavaScript", "React", "Node.js", "PostgreSQL", "AWS", "Docker"],
    rating: 4.9,
    projects_completed: 25,
  },
  {
    id: "2",
    name: "Ana Designer",
    avatar_url: "/placeholder.svg?height=80&width=80",
    bio: "Designer UX/UI especializada em interfaces modernas e intuitivas. Foco em criar experiências de usuário que encantam e convertem.",
    skills: [
      "UI/UX Design",
      "Figma",
      "Adobe XD",
      "Prototyping",
      "User Research",
    ],
    rating: 5.0,
    projects_completed: 42,
  },
  {
    id: "3",
    name: "Pedro M.",
    avatar_url: "/placeholder.svg?height=80&width=80",
    bio: "Engenheiro de Dados e especialista em Python. Transformo dados brutos em insights valiosos para o seu negócio.",
    skills: ["Python", "Pandas", "SQL", "Airflow", "Data Visualization"],
    rating: 4.8,
    projects_completed: 18,
  },
];

export default function TalentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Em uma aplicação real, você buscaria estes dados de uma API
    setIsLoading(true);
    setTimeout(() => {
      setFreelancers(mockFreelancers);
      setIsLoading(false);
    }, 1000); // Simula delay de rede
  }, []);

  const filteredFreelancers = freelancers.filter((freelancer) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      freelancer.name.toLowerCase().includes(searchLower) ||
      freelancer.bio.toLowerCase().includes(searchLower) ||
      freelancer.skills.some((skill) =>
        skill.toLowerCase().includes(searchLower)
      )
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Encontre Talentos
              </h1>
              <p className="text-gray-600 mt-1">
                Navegue por nossa rede de freelancers qualificados
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, habilidade..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <p>Carregando talentos...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredFreelancers.map((freelancer) => (
              <Card
                key={freelancer.id}
                className="hover:shadow-xl transition-shadow duration-300 flex flex-col"
              >
                <CardContent className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center space-x-4 mb-4">
                    <Avatar className="h-20 w-20 border-4 border-white shadow-md">
                      <AvatarImage
                        src={freelancer.avatar_url}
                        alt={freelancer.name}
                      />
                      <AvatarFallback>
                        {freelancer.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">
                        {freelancer.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                        <span>{freelancer.rating}</span>
                        <span className="mx-2">|</span>
                        <Briefcase className="h-4 w-4 mr-1" />
                        <span>{freelancer.projects_completed} projetos</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm mb-4 flex-grow">
                    {freelancer.bio}
                  </p>
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                      {freelancer.skills.slice(0, 5).map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="mt-auto">
                    <Link href={`/talents/${freelancer.id}`} passHref>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        <User className="mr-2 h-4 w-4" />
                        Ver Perfil
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredFreelancers.length === 0 && !isLoading && (
              <div className="text-center py-12 col-span-full">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum talento encontrado
                </h3>
                <p className="text-gray-600">
                  Tente ajustar os filtros ou termos de busca.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

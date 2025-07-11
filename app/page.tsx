"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Briefcase,
  Shield,
  Star,
  ArrowRight,
  CheckCircle,
  Globe,
  Zap,
  Award,
  MessageSquare,
  Target,
  Rocket,
  Heart,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Github,
} from "lucide-react";

export default function HomePage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [animatedStats, setAnimatedStats] = useState({
    projects: 0,
    freelancers: 0,
    companies: 0,
    rating: 0,
  });

  const testimonials = [
    {
      name: "Maria Silva",
      role: "CEO, TechStart",
      image: "/placeholder.svg?height=60&width=60",
      content:
        "O FreelanceHub revolucionou como encontramos talentos. A qualidade dos freelancers é excepcional!",
    },
    {
      name: "João Santos",
      role: "Desenvolvedor Full Stack",
      image: "/placeholder.svg?height=60&width=60",
      content:
        "Consegui triplicar minha renda trabalhando com projetos incríveis através da plataforma.",
    },
    {
      name: "Ana Costa",
      role: "Designer UX/UI",
      image: "/placeholder.svg?height=60&width=60",
      content:
        "A melhor plataforma para freelancers! Projetos de qualidade e pagamentos garantidos.",
    },
  ];

  const features = [
    {
      icon: Shield,
      title: "Segurança Garantida",
      description: "Pagamentos protegidos e contratos seguros",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Zap,
      title: "Processo Rápido",
      description: "Encontre talentos ou projetos em minutos",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      icon: Award,
      title: "Qualidade Premium",
      description: "Freelancers verificados e avaliados",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      icon: Globe,
      title: "Alcance Global",
      description: "Trabalhe com pessoas do mundo todo",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  const categories = [
    { name: "Desenvolvimento Web", count: "2,500+", icon: "💻" },
    { name: "Design Gráfico", count: "1,800+", icon: "🎨" },
    { name: "Marketing Digital", count: "1,200+", icon: "📱" },
    { name: "Redação", count: "900+", icon: "✍️" },
    { name: "Tradução", count: "600+", icon: "🌍" },
    { name: "Consultoria", count: "400+", icon: "💼" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const animateStats = () => {
      const targets = {
        projects: 2500,
        freelancers: 15000,
        companies: 3200,
        rating: 4.9,
      };
      const duration = 2000;
      const steps = 60;
      const stepTime = duration / steps;

      let step = 0;
      const timer = setInterval(() => {
        step++;
        const progress = step / steps;

        setAnimatedStats({
          projects: Math.floor(targets.projects * progress),
          freelancers: Math.floor(targets.freelancers * progress),
          companies: Math.floor(targets.companies * progress),
          rating: Number((targets.rating * progress).toFixed(1)),
        });

        if (step >= steps) clearInterval(timer);
      }, stepTime);
    };

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        animateStats();
        observer.disconnect();
      }
    });

    const statsElement = document.getElementById("stats-section");
    if (statsElement) observer.observe(statsElement);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b z-50 transition-all duration-300">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Briefcase className="h-8 w-8 text-blue-600" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              FreelanceHub
            </h1>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="#features"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Recursos
            </Link>
            <Link
              href="#categories"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Categorias
            </Link>
            <Link
              href="#testimonials"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Depoimentos
            </Link>
            <Link
              href="#contact"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Contato
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="hover:bg-blue-50">
                Entrar
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Cadastrar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-20 bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="space-y-8 animate-fade-in-up lg:col-span-5">
              <div className="space-y-4">
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors">
                  🚀 Mais de 15.000 freelancers ativos
                </Badge>
                <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Conecte-se com os
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
                    melhores talentos
                  </span>
                </h2>
                <p className="text-xl text-gray-600 leading-relaxed">
                  A plataforma mais completa para empresas encontrarem
                  freelancers qualificados e profissionais descobrirem projetos
                  incríveis. Junte-se à revolução do trabalho remoto.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/register?type=company">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4"
                  >
                    <Briefcase className="mr-2 h-5 w-5" />
                    Contratar Talentos
                  </Button>
                </Link>
                <Link href="/auth/register?type=freelancer">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-2 border-blue-600 text-blue-600 hover:bg-blue-50 text-lg px-8 py-4 bg-transparent"
                  >
                    <Users className="mr-2 h-5 w-5" />
                    Encontrar Projetos
                  </Button>
                </Link>
              </div>

              <div className="flex items-center space-x-8 pt-4">
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <img
                        key={i}
                        src={`/placeholder.svg?height=40&width=40`}
                        alt={`User ${i}`}
                        className="w-10 h-10 rounded-full border-2 border-white"
                      />
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 text-yellow-400 fill-current"
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">
                      Avaliação 4.9/5 de 10k+ usuários
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative animate-fade-in-right lg:col-span-7 transform lg:scale-115 lg:translate-x-16">
              <div className="relative z-10">
                <img
                  src="/blusa roxa.png"
                  alt="Freelancer profissional sorrindo, representando os talentos disponíveis na plataforma FreelanceHub"
                  className="w-full h-auto rounded-2xl shadow-2xl"
                />
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center animate-bounce">
                  <Rocket className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center animate-pulse">
                  <Heart className="w-10 h-10 text-white" />
                </div>
              </div>

              {/* Floating Cards */}
              <div className="absolute top-10 right-4 z-20 bg-white p-4 rounded-lg shadow-lg animate-float">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      Projeto Concluído
                    </p>
                    <p className="text-sm text-gray-600">R$ 15.000 pagos</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-4 -left-4 z-20 bg-white p-4 rounded-lg shadow-lg animate-float-delayed">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Nova Mensagem</p>
                    <p className="text-sm text-gray-600">Cliente interessado</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats-section" className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-blue-400 mb-2">
                {animatedStats.projects.toLocaleString()}+
              </div>
              <div className="text-gray-300">Projetos Concluídos</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-green-400 mb-2">
                {animatedStats.freelancers.toLocaleString()}+
              </div>
              <div className="text-gray-300">Freelancers Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-purple-400 mb-2">
                {animatedStats.companies.toLocaleString()}+
              </div>
              <div className="text-gray-300">Empresas Cadastradas</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-yellow-400 mb-2">
                {animatedStats.rating}
              </div>
              <div className="text-gray-300">Avaliação Média</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-blue-100 text-blue-800 mb-4">
              Por que escolher o FreelanceHub?
            </Badge>
            <h3 className="text-4xl font-bold text-gray-900 mb-6">
              A plataforma mais completa do mercado
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Desenvolvemos cada funcionalidade pensando na melhor experiência
              para empresas e freelancers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg"
              >
                <CardHeader className="text-center pb-4">
                  <div
                    className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className={`h-8 w-8 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section
        id="categories"
        className="py-20 bg-gradient-to-br from-blue-50 to-purple-50"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-6">
              Explore Categorias Populares
            </h3>
            <p className="text-xl text-gray-600">
              Encontre o talento perfeito para cada tipo de projeto
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <Card
                key={index}
                className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg hover:scale-105"
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl">{category.icon}</div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {category.name}
                      </h4>
                      <p className="text-gray-600">{category.count} projetos</p>
                    </div>
                    <ArrowRight className="ml-auto h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-6">
              O que nossos usuários dizem
            </h3>
            <p className="text-xl text-gray-600">
              Histórias reais de sucesso na nossa plataforma
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-2xl">
              <CardContent className="p-12">
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className="w-6 h-6 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <blockquote className="text-2xl text-gray-700 mb-8 leading-relaxed">
                    "{testimonials[currentTestimonial].content}"
                  </blockquote>
                  <div className="flex items-center justify-center space-x-4">
                    <img
                      src={
                        testimonials[currentTestimonial].image ||
                        "/placeholder.svg"
                      }
                      alt={testimonials[currentTestimonial].name}
                      className="w-16 h-16 rounded-full"
                    />
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">
                        {testimonials[currentTestimonial].name}
                      </p>
                      <p className="text-gray-600">
                        {testimonials[currentTestimonial].role}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentTestimonial ? "bg-blue-600" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h3 className="text-4xl lg:text-5xl font-bold mb-6">
              Pronto para transformar sua carreira?
            </h3>
            <p className="text-xl mb-8 opacity-90 leading-relaxed">
              Junte-se a milhares de empresas e freelancers que já descobriram o
              futuro do trabalho. Cadastre-se gratuitamente e comece hoje mesmo!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4"
                >
                  <Rocket className="mr-2 h-5 w-5" />
                  Começar Agora - É Grátis
                </Button>
              </Link>
              <Link href="/projects">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 text-lg px-8 py-4 bg-transparent"
                >
                  <Target className="mr-2 h-5 w-5" />
                  Ver Projetos Disponíveis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Briefcase className="h-8 w-8 text-blue-400" />
                <span className="text-2xl font-bold">FreelanceHub</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                A plataforma mais completa para conectar empresas e freelancers.
                Transformando o futuro do trabalho remoto.
              </p>
              <div className="flex space-x-4">
                <Link
                  href="https://facebook.com"
                  className="text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <Facebook className="h-6 w-6" />
                </Link>
                <Link
                  href="https://twitter.com"
                  className="text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <Twitter className="h-6 w-6" />
                </Link>
                <Link
                  href="https://instagram.com"
                  className="text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <Instagram className="h-6 w-6" />
                </Link>
                <Link
                  href="https://linkedin.com"
                  className="text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <Linkedin className="h-6 w-6" />
                </Link>
                <Link
                  href="https://youtube.com"
                  className="text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <Youtube className="h-6 w-6" />
                </Link>
                <Link
                  href="https://github.com"
                  className="text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <Github className="h-6 w-6" />
                </Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-6 text-lg">Produto</h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/features"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Recursos
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Preços
                  </Link>
                </li>
                <li>
                  <Link
                    href="/api"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    API
                  </Link>
                </li>
                <li>
                  <Link
                    href="/integrations"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Integrações
                  </Link>
                </li>
                <li>
                  <Link
                    href="/security"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Segurança
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-6 text-lg">Empresa</h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/about"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Sobre Nós
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/careers"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Carreiras
                  </Link>
                </li>
                <li>
                  <Link
                    href="/press"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Imprensa
                  </Link>
                </li>
                <li>
                  <Link
                    href="/investors"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Investidores
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-6 text-lg">Suporte</h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/help"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Central de Ajuda
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Contato
                  </Link>
                </li>
                <li>
                  <Link
                    href="/status"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Status
                  </Link>
                </li>
                <li>
                  <Link
                    href="/community"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Comunidade
                  </Link>
                </li>
                <li>
                  <Link
                    href="/feedback"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Feedback
                  </Link>
                </li>
              </ul>

              <div className="mt-6 space-y-2">
                <div className="flex items-center space-x-2 text-gray-400">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">contato@freelancehub.com</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">+55 (81) 9999-9999</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">Recife-PE, Brasil</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-gray-400 text-sm">
                &copy; 2024 FreelanceHub. Todos os direitos reservados.
              </div>
              <div className="flex space-x-6 text-sm">
                <Link
                  href="/privacy"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Política de Privacidade
                </Link>
                <Link
                  href="/terms"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Termos de Uso
                </Link>
                <Link
                  href="/cookies"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Cookies
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-right {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }

        .animate-fade-in-right {
          animation: fade-in-right 0.8s ease-out 0.2s both;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 3s ease-in-out infinite 1.5s;
        }

        .bg-grid-pattern {
          background-image: radial-gradient(
            circle,
            #e5e7eb 1px,
            transparent 1px
          );
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
}

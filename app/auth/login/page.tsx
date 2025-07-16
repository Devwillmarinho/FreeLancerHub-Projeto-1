"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Briefcase,
  Mail,
  Lock,
  Chrome,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  Zap,
  ArrowLeft,
  Users,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("");
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Persist theme on mount
    document.documentElement.classList.add("h-full")
    return () => {
      document.documentElement.classList.remove("h-full")
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha no login")
      }

      setSuccess("Login realizado com sucesso! Redirecionando...")

        setTimeout(() => {
          router.push("/dashboard")
        }, 1500)
    } catch (err: any) {
      setError(err.message || "Erro de conexão. Tente novamente.");
          setTimeout(() => {
          }, 1500)

      setError(err.message || "Erro de conexão. Tente novamente.")
      

    }finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError("")

    try {
      const supabase = createClient()
       const { error } = await supabase.auth.signInWithOAuth({
         provider: "google",
         options: {
           redirectTo: `${location.origin}/auth/callback`,
         },
       });
       if (error) {
         setError(error.message);
       }
     } catch (err: any) {
       setError(err.message || "Erro no login com Google");
     } finally {
       setLoading(false);
     }
  };

  const features = [
    {
      icon: Shield,
      title: "Segurança Avançada",
      description: "Autenticação dupla e criptografia de ponta",
    },
    {
      icon: Zap,
      title: "Acesso Rápido",
      description: "Login em segundos com suas credenciais",
    },
    {
      icon: Users,
      title: "Comunidade Ativa",
      description: "Mais de 15.000 profissionais conectados",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="absolute top-8 left-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </div>
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-2xl">
            <CardHeader className="text-center pb-8">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <Briefcase className="h-16 w-16 text-blue-600" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Bem-vindo de volta!
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 mt-2">
                Entre na sua conta para acessar a plataforma
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Success Alert */}
              {success && (
                <Alert className="border-green-200 bg-green-50 animate-in slide-in-from-top-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 font-medium">{success}</AlertDescription>
                </Alert>
              )}

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="animate-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-medium">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-12 h-12 border-2 focus:border-blue-500 transition-colors"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                    Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Sua senha"
                      className="pl-12 pr-12 h-12 border-2 focus:border-blue-500 transition-colors"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Label htmlFor="remember" className="text-sm text-gray-600">
                      Lembrar de mim
                    </Label>
                  </div>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg font-semibold transition-all duration-300 transform hover:scale-105"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-gray-500 font-medium">Ou continue com</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full h-12 border-2 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 bg-transparent"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <Chrome className="mr-3 h-5 w-5 text-red-500" />
                <span className="font-semibold">Google</span>
              </Button>

              <div className="text-center pt-4">
                <span className="text-gray-600">Não tem uma conta? </span>
                <Link
                  href="/auth/register"
                  className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                >
                  Cadastre-se gratuitamente
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Side - Features */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 to-purple-600 p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 text-white max-w-lg">
          <h2 className="text-4xl font-bold mb-6">Bem-vindo de volta!</h2>
          <p className="text-xl mb-12 opacity-90">
            Junte-se a milhares de profissionais que já transformaram suas carreiras conosco.
          </p>

          <div className="space-y-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="opacity-90">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-white/10 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <img
                    key={i}
                    src={`/placeholder.svg?height=40&width=40`}
                    alt={`User ${i}`}
                    className="w-10 h-10 rounded-full border-2 border-white"
                  />
                ))}
              </div>
              <div>
                <p className="font-semibold">15.000+ usuários ativos</p>
                <p className="text-sm opacity-75">Avaliação 4.9/5</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/20 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-white/20 rounded-full animate-bounce"></div>
        <div className="absolute top-1/2 left-10 w-16 h-16 bg-white/20 rounded-full animate-ping"></div>
      </div>
        </div>
    );
}

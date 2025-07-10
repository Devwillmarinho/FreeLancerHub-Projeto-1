"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Briefcase,
  Mail,
  Lock,
  User,
  Building,
  Chrome,
  X,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  Check,
  AlertTriangle,
  Users,
} from "lucide-react"

type UserType = "freelancer" | "company"

interface PasswordStrength {
  score: number
  feedback: string[]
  color: string
  text: string
}

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const [userType, setUserType] = useState<UserType>((searchParams?.get("type") as UserType) || "freelancer")
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    company_name: "",
    bio: "",
    skills: [] as string[],
  })
  const [skillInput, setSkillInput] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    color: "bg-gray-200",
    text: "Muito fraca",
  })
  const [emailValid, setEmailValid] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const router = useRouter()

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0
    const feedback: string[] = []

    if (password.length >= 8) {
      score += 1
    } else {
      feedback.push("Mínimo 8 caracteres")
    }

    if (/[a-z]/.test(password)) {
      score += 1
    } else {
      feedback.push("Adicione letras minúsculas")
    }

    if (/[A-Z]/.test(password)) {
      score += 1
    } else {
      feedback.push("Adicione letras maiúsculas")
    }

    if (/\d/.test(password)) {
      score += 1
    } else {
      feedback.push("Adicione números")
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1
    } else {
      feedback.push("Adicione símbolos (!@#$%)")
    }

    let color = "bg-red-500"
    let text = "Muito fraca"

    if (score >= 4) {
      color = "bg-green-500"
      text = "Muito forte"
    } else if (score >= 3) {
      color = "bg-yellow-500"
      text = "Boa"
    } else if (score >= 2) {
      color = "bg-orange-500"
      text = "Fraca"
    }

    return { score, feedback, color, text }
  }

  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(calculatePasswordStrength(formData.password))
    }
  }, [formData.password])

  useEffect(() => {
    setEmailValid(validateEmail(formData.email))
  }, [formData.email])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem")
      return
    }

    if (!agreedToTerms) {
      setError("Você deve aceitar os termos de uso")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      if (formData.email && formData.password && formData.name) {
        setSuccess("Conta criada com sucesso! Redirecionando...")
        setTimeout(() => {
          router.push("/dashboard")
        }, 1500)
      } else {
        setError("Preencha todos os campos obrigatórios")
      }
    } catch (error) {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()],
      })
      setSkillInput("")
    }
  }

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    })
  }

  const handleGoogleRegister = async () => {
    setLoading(true)
    setError("")

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setSuccess("Registro com Google realizado com sucesso!")
      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
    } catch (error) {
      setError("Erro no registro com Google")
    } finally {
      setLoading(false)
    }
  }

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                {userType === "company" ? "Nome do responsável" : "Nome completo"}
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  className="pl-12 h-12 border-2 focus:border-blue-500 transition-colors"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            {userType === "company" && (
              <div className="space-y-2">
                <Label htmlFor="company_name" className="text-sm font-semibold text-gray-700">
                  Nome da empresa
                </Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="company_name"
                    type="text"
                    placeholder="Nome da sua empresa"
                    className="pl-12 h-12 border-2 focus:border-blue-500 transition-colors"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    required
                  />
                </div>
              </div>
            )}

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
                  className={`pl-12 pr-12 h-12 border-2 transition-colors ${
                    formData.email && emailValid
                      ? "border-green-500"
                      : formData.email && !emailValid
                        ? "border-red-500"
                        : "focus:border-blue-500"
                  }`}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                {formData.email && (
                  <div className="absolute right-3 top-3">
                    {emailValid ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {formData.email && !emailValid && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Email deve conter @ e domínio válido
                </p>
              )}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Crie uma senha forte"
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

              {formData.password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Força da senha:</span>
                    <span
                      className={`text-sm font-medium ${
                        passwordStrength.score >= 4
                          ? "text-green-600"
                          : passwordStrength.score >= 3
                            ? "text-yellow-600"
                            : passwordStrength.score >= 2
                              ? "text-orange-600"
                              : "text-red-600"
                      }`}
                    >
                      {passwordStrength.text}
                    </span>
                  </div>
                  <Progress value={(passwordStrength.score / 5) * 100} className="h-2" />
                  {passwordStrength.feedback.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <p className="font-medium mb-1">Para melhorar:</p>
                      <ul className="space-y-1">
                        {passwordStrength.feedback.map((item, index) => (
                          <li key={index} className="flex items-center">
                            <AlertCircle className="w-3 h-3 mr-2 text-orange-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                Confirmar senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirme sua senha"
                  className={`pl-12 pr-12 h-12 border-2 transition-colors ${
                    formData.confirmPassword && formData.password === formData.confirmPassword
                      ? "border-green-500"
                      : formData.confirmPassword && formData.password !== formData.confirmPassword
                        ? "border-red-500"
                        : "focus:border-blue-500"
                  }`}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  As senhas não coincidem
                </p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="text-sm text-green-600 flex items-center">
                  <Check className="w-4 h-4 mr-1" />
                  Senhas coincidem
                </p>
              )}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-semibold text-gray-700">
                {userType === "company" ? "Descrição da empresa" : "Bio profissional"}
              </Label>
              <Textarea
                id="bio"
                placeholder={
                  userType === "company"
                    ? "Conte sobre sua empresa, área de atuação e valores..."
                    : "Descreva sua experiência, especialidades e objetivos profissionais..."
                }
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className="border-2 focus:border-blue-500 transition-colors resize-none"
              />
            </div>

            {userType === "freelancer" && (
              <div className="space-y-2">
                <Label htmlFor="skills" className="text-sm font-semibold text-gray-700">
                  Habilidades e Tecnologias
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="skills"
                    type="text"
                    placeholder="Ex: JavaScript, React, Python, Design..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    className="border-2 focus:border-blue-500 transition-colors"
                  />
                  <Button type="button" onClick={addSkill} size="sm" variant="outline">
                    Adicionar
                  </Button>
                </div>
                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                        {skill}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-red-500 transition-colors"
                          onClick={() => removeSkill(skill)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
              />
              <Label htmlFor="terms" className="text-sm text-gray-700 leading-relaxed">
                Eu concordo com os{" "}
                <Link href="/terms" className="text-blue-600 hover:text-blue-800 font-medium">
                  Termos de Uso
                </Link>{" "}
                e{" "}
                <Link href="/privacy" className="text-blue-600 hover:text-blue-800 font-medium">
                  Política de Privacidade
                </Link>
                , e autorizo o processamento dos meus dados pessoais.
              </Label>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
      {/* Left Side - Registration Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-2xl">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Briefcase className="h-12 w-12 text-blue-600" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Criar Conta
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 mt-2">
                Junte-se ao FreelanceHub como {userType === "company" ? "empresa" : "freelancer"}
              </CardDescription>

              {/* Progress Steps */}
              <div className="flex items-center justify-center space-x-4 mt-6">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                        step <= currentStep ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {step < currentStep ? <Check className="w-4 h-4" /> : step}
                    </div>
                    {step < 3 && (
                      <div
                        className={`w-8 h-1 mx-2 transition-all ${step < currentStep ? "bg-blue-600" : "bg-gray-200"}`}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="text-sm text-gray-600 mt-2">
                Etapa {currentStep} de 3:{" "}
                {currentStep === 1 ? "Informações Básicas" : currentStep === 2 ? "Segurança" : "Perfil Profissional"}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* User Type Selection */}
              {currentStep === 1 && (
                <div className="mb-6">
                  <Label className="text-sm font-semibold text-gray-700 mb-3 block">Tipo de conta</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={userType === "freelancer" ? "default" : "outline"}
                      className={`h-12 transition-all ${
                        userType === "freelancer"
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          : "hover:bg-blue-50"
                      }`}
                      onClick={() => setUserType("freelancer")}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Freelancer
                    </Button>
                    <Button
                      type="button"
                      variant={userType === "company" ? "default" : "outline"}
                      className={`h-12 transition-all ${
                        userType === "company"
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          : "hover:bg-blue-50"
                      }`}
                      onClick={() => setUserType("company")}
                    >
                      <Building className="mr-2 h-4 w-4" />
                      Empresa
                    </Button>
                  </div>
                </div>
              )}

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
                {getStepContent()}

                <div className="flex gap-3">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(currentStep - 1)}
                      className="flex-1 h-12"
                      disabled={loading}
                    >
                      Voltar
                    </Button>
                  )}

                  <Button
                    type="submit"
                    className={`h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-semibold transition-all duration-300 transform hover:scale-105 ${
                      currentStep === 1 ? "w-full" : "flex-1"
                    }`}
                    disabled={loading || (currentStep === 3 && !agreedToTerms)}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {currentStep === 3 ? "Criando conta..." : "Processando..."}
                      </>
                    ) : currentStep === 3 ? (
                      "Criar conta"
                    ) : (
                      "Continuar"
                    )}
                  </Button>
                </div>
              </form>

              {currentStep === 1 && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-white px-4 text-gray-500 font-medium">Ou registre-se com</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full h-12 border-2 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 bg-transparent"
                    onClick={handleGoogleRegister}
                    disabled={loading}
                  >
                    <Chrome className="mr-3 h-5 w-5 text-red-500" />
                    <span className="font-semibold">Google</span>
                  </Button>
                </>
              )}

              <div className="text-center pt-4">
                <span className="text-gray-600">Já tem uma conta? </span>
                <Link href="/auth/login" className="text-blue-600 hover:text-blue-800 font-semibold transition-colors">
                  Entrar agora
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Side - Benefits */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 to-purple-600 p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 text-white max-w-lg">
          <h2 className="text-4xl font-bold mb-6">
            {userType === "company" ? "Encontre os melhores talentos" : "Transforme sua carreira"}
          </h2>
          <p className="text-xl mb-12 opacity-90">
            {userType === "company"
              ? "Acesse uma rede global de freelancers qualificados e gerencie projetos com facilidade."
              : "Conecte-se com empresas inovadoras e trabalhe em projetos que fazem a diferença."}
          </p>

          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Segurança Garantida</h3>
                <p className="opacity-90">Pagamentos protegidos e contratos seguros</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Processo Simplificado</h3>
                <p className="opacity-90">Interface intuitiva e fluxo otimizado</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Comunidade Ativa</h3>
                <p className="opacity-90">Mais de 15.000 profissionais conectados</p>
              </div>
            </div>
          </div>

          <div className="mt-12 p-6 bg-white/10 rounded-2xl backdrop-blur-sm">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">R$ 2.5M+</div>
              <div className="text-sm opacity-75">Pagos aos freelancers este mês</div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-white/10 rounded-full animate-bounce"></div>
        <div className="absolute top-1/2 left-10 w-16 h-16 bg-white/10 rounded-full animate-ping"></div>
      </div>
    </div>
  )
}

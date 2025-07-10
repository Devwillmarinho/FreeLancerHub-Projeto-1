export type UserType = "admin" | "company" | "freelancer"
export type ProjectStatus = "draft" | "open" | "in_progress" | "completed" | "cancelled"
export type ProposalStatus = "pending" | "accepted" | "rejected"

export interface User {
  id: string
  email: string
  name: string
  user_type: UserType
  avatar_url?: string
  bio?: string
  skills?: string[]
  company_name?: string
  google_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  title: string
  description: string
  budget: number
  deadline?: string
  status: ProjectStatus
  required_skills: string[]
  company_id: string
  freelancer_id?: string
  created_at: string
  updated_at: string
  company?: User
  freelancer?: User
  proposals?: Proposal[]
}

export interface Proposal {
  id: string
  project_id: string
  freelancer_id: string
  message: string
  proposed_budget: number
  estimated_duration?: number
  status: ProposalStatus
  created_at: string
  updated_at: string
  project?: Project
  freelancer?: User
}

export interface Message {
  id: string
  project_id: string
  sender_id: string
  content: string
  file_url?: string
  file_name?: string
  created_at: string
  sender?: User
}

export interface Contract {
  id: string
  project_id: string
  company_id: string
  freelancer_id: string
  budget: number
  start_date: string
  end_date?: string
  terms: string
  is_completed: boolean
  created_at: string
  project?: Project
  company?: User
  freelancer?: User
}

export interface Review {
  id: string
  contract_id: string
  reviewer_id: string
  reviewed_id: string
  rating: number
  comment?: string
  created_at: string
  reviewer?: User
  reviewed?: User
}

export interface AuthResponse {
  user: User
  token: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

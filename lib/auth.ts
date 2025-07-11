import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import type { User } from "@/types"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      user_type: user.user_type,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  )
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function hasPermission(userType: string, requiredPermissions: string[]): boolean {
  const permissions = {
    admin: ["read", "write", "delete", "moderate"],
    company: ["read", "write", "create_project", "hire"],
    freelancer: ["read", "write", "apply"],
  }

  const userPermissions = permissions[userType as keyof typeof permissions] || []
  return requiredPermissions.every((permission) => userPermissions.includes(permission))
}

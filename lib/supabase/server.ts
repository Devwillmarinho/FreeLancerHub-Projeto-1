import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
          // We'll wrap it in a try/catch block to prevent errors.
          try { cookieStore.set({ name, value, ...options }) } catch (error) {}
        },
        remove(name: string, options: CookieOptions) {
          // The `remove` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
          // We'll wrap it in a try/catch block to prevent errors.
          try { cookieStore.set({ name, value: '', ...options }) } catch (error) {}
        },
      },
    }
  )
}
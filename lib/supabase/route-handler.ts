import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

// Define a function to create a Supabase client for API Routes.
// This function is tailored for server-side operations that need to read and write cookies.
export function createRouteHandlerClient() {
  const cookieStore = cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // The `set` method is called from a Route Handler, so it's safe to set cookies.
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          // The `remove` method is called from a Route Handler, so it's safe to remove cookies.
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

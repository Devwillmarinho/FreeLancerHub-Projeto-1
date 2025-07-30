import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // Se o provedor retornar um erro direto na URL, redirecione para a página de login.
  if (error) {
    const redirectUrl = new URL("/auth/login", request.url);
    redirectUrl.searchParams.set("error", "Falha na autenticação com o provedor.");
    redirectUrl.searchParams.set("error_description", errorDescription || error);
    return NextResponse.redirect(redirectUrl);
  }

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      // URL para redirecionar com uma mensagem de erro.
      const redirectUrl = new URL("/auth/login", request.url);
      redirectUrl.searchParams.set("error", "Não foi possível autenticar o usuário");
      redirectUrl.searchParams.set("error_description", exchangeError.message);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Redireciona o usuário para o dashboard após o login
  return NextResponse.redirect(new URL("/dashboard", request.url));
}

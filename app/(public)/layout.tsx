"use client";

import { ThemeProvider } from "@/app/theme-provider";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Este ThemeProvider força o tema "light" para todas as páginas públicas (inicial, login, registro)
  // e ignora qualquer configuração salva no localStorage do usuário.
  return <ThemeProvider forcedTheme="light">{children}</ThemeProvider>;
}


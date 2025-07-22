// Este arquivo deve ser um Server Component simples que apenas repassa os filhos.
// A proteção da rota é feita pelo middleware.ts e é suficiente.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


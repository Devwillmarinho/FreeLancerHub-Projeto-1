"use client"; // O ThemeProvider requer que este seja um Client Component.

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

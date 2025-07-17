import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SupportChatWidget } from "@/components/ui/SupportChatWidget";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FreelancerHub",
  description: "Created with DevWillMarinho",
  generator: "DevWillMarinho",
  icons: {
    icon: "/icon2.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
        <Toaster />
        <SupportChatWidget />
      </body>
    </html>
  );
}

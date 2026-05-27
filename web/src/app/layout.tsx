import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cálculo para Devs",
  description: "Plataforma educacional de Cálculo I para programadores",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        <header className="border-b border-slate-800 px-6 py-4 flex items-center gap-6 flex-wrap">
          <Link href="/" className="font-semibold text-lg">
            Cálculo<span className="text-pink-400">/Devs</span>
          </Link>
          <Nav />
        </header>
        <main className="flex-1 px-6 py-8 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </body>
    </html>
  );
}

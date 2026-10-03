import type { Metadata, Viewport } from "next";
import { Quicksand, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

// Identidade RESPIRO: Quicksand (arredondada, calma — app de pausa/descanso)
// + JetBrains Mono (relógio e números tabulares). Zero fonte-default de template.
const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jbm = JetBrains_Mono({
  variable: "--font-jbm",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Pausa 20 — Lembrete para descansar os olhos",
  description:
    "Deixe a aba aberta e receba avisos periódicos para tirar os olhos da tela e olhar para outras coisas. Baseado na regra 20-20-20, com desafios rápidos e pausas guiadas de 20 segundos.",
  keywords: [
    "regra 20-20-20",
    "descanso visual",
    "saúde ocular",
    "pausa para os olhos",
    "fadiga ocular",
    "produtividade",
  ],
  authors: [{ name: "Pausa 20" }],
  openGraph: {
    title: "Pausa 20 — Lembrete para descansar os olhos",
    description:
      "A cada 20 minutos, um lembrete (ou um desafio rápido) para tirar os olhos da tela por 20 segundos.",
    siteName: "Pausa 20",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${quicksand.variable} ${jbm.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

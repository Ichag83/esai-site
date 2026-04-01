import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Ice & Code — Inteligência Criativa com IA",
    template: "%s | Ice & Code",
  },
  description: "Plataforma de IA para análise, geração e otimização de criativos de alta performance. Do briefing ao vídeo em minutos.",
  applicationName: "Ice & Code",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

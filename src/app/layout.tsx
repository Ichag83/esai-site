import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Creative Brain BR",
  description: "Brazilian performance creative intelligence platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}

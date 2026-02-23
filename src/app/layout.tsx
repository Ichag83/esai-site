import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Creative Brain BR",
    template: "%s | Creative Brain BR",
  },
  description: "Inteligência criativa para performance de ads brasileiros",
  applicationName: "Creative Brain BR",
  robots: { index: false, follow: false },
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
      {/* suppressHydrationWarning prevents mismatches caused by browser extensions */}
      <body className="min-h-screen bg-gray-50" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

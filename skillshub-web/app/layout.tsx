import type { Metadata } from "next";
import AppProviders from "@/components/AppProviders";
import { LanguageProvider } from "@/lib/i18n";
import { getNfaPublicConfig } from "@/lib/server/nfa";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkillsHub | BSC On-Chain Intelligence Platform",
  description: "Modular, production-ready skill modules for the Binance Smart Chain. Build, test, and deploy on-chain intelligence from one hub.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nfaConfig = getNfaPublicConfig();

  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-bg text-text-main font-body antialiased selection:bg-gold selection:text-bg">
        <LanguageProvider>
          <AppProviders nfaConfig={nfaConfig}>{children}</AppProviders>
        </LanguageProvider>
      </body>
    </html>
  );
}

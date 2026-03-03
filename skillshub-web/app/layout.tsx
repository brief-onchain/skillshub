import type { Metadata } from "next";
import { Orbitron, Noto_Sans_SC, JetBrains_Mono } from "next/font/google";
import { LanguageProvider } from "@/lib/i18n";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});

const notoSans = Noto_Sans_SC({
  subsets: ["latin"],
  variable: "--font-noto",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SkillsBrain | BSC On-Chain Intelligence Platform",
  description: "Modular, production-ready skill modules for the Binance Smart Chain. Build, test, and deploy on-chain intelligence from one hub.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${orbitron.variable} ${notoSans.variable} ${jetbrains.variable} bg-bg text-text-main font-body antialiased selection:bg-gold selection:text-bg`}>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}

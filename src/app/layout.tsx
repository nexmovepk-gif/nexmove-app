import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import SessionProvider from "@/components/SessionProvider";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import GlobalHeader from "@/components/GlobalHeader";
import AIAssistant from "@/components/AIAssistant";
import BismillahSplash from "@/components/BismillahSplash";
import { CurrencyProvider } from "@/components/CurrencyContext";
import { LanguageProvider } from "@/components/LanguageContext";
import { AIEscrowProvider } from "@/components/AIEscrowContext";

import { Inter, Plus_Jakarta_Sans } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NexMove Development - Next-Gen PropTech SaaS Ecosystem",
  description: "Secure, multi-tenant global real estate platform with advanced RBAC, blind listings, and WhatsApp integration.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable}`}>
      <body
        className={`${inter.className} antialiased bg-slate-50 text-slate-900 min-h-screen font-sans`}
      >
        {/* Hidden Container & Initialization for Platform-Wide Google Translation */}
        <div id="google_translate_element" className="hidden absolute" />
        <Script
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
        <Script id="google-translate-init" strategy="afterInteractive">
          {`
            function googleTranslateElementInit() {
              new google.translate.TranslateElement({
                pageLanguage: 'en',
                includedLanguages: 'ar,en',
                autoDisplay: false
              }, 'google_translate_element');
            }
          `}
        </Script>

        <BismillahSplash />

        <SessionProvider>
          <LanguageProvider>
            <CurrencyProvider>
              <AIEscrowProvider>
                <ImpersonationBanner />
                <GlobalHeader />
                {children}
                <AIAssistant />
              </AIEscrowProvider>
            </CurrencyProvider>
          </LanguageProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
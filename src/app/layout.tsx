import type { Metadata } from "next";
import localFont from "next/font/local";
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

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900 min-h-screen`}
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
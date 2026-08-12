import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import GlobalHeader from "@/components/GlobalHeader";
import AIAssistant from "@/components/AIAssistant";
import { CurrencyProvider } from "@/components/CurrencyContext";

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
        <SessionProvider>
          <CurrencyProvider>
            <GlobalHeader />
            {children}
            <AIAssistant />
          </CurrencyProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

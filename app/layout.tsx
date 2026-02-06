import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/providers/theme-provider";
import { CookieConsent } from '@/components/gdpr/CookieConsent'
// import { GoogleAnalytics } from '@/components/analytics/AnalyticsScripts'


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Akôm",
  description: "Akôm - Plateforme SaaS qui permet aux restaurants de digitaliser les commandes via QR code, d’optimiser la communication avec la cuisine et d’améliorer l’expérience client, sans complexité ni coût excessif.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster position="top-right" />
          {children}
          {/* Bannière RGPD - s'affiche uniquement si nécessaire */}
          <CookieConsent />

          {/* Analytics - chargé uniquement si l'utilisateur a accepté */}
          {/* {process.env.NEXT_PUBLIC_GA_ID && (
            <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_ID} />
          )} */}
        </ThemeProvider>
      </body>
    </html>
  );
}

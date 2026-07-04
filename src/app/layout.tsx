import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { Providers } from "@/components/providers";
import { AuthProvider } from "@/components/AuthProvider";
import { SiteThemeProvider } from "@/components/SiteThemeProvider";

const inter = Inter({
  variable: "--font-en",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const notoBengali = Noto_Sans_Bengali({
  variable: "--font-bn",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://epowerfix.com"),
  title: {
    default: "ePowerFix — Electrical Power & Digital Technology | ইলেকট্রিক্যাল পাওয়ার ও ডিজিটাল টেকনোলজি",
    template: "%s | ePowerFix",
  },
  description: "Bangladesh's trusted online marketplace for electrical products, services, and tools. Shop cables, breakers, LED lights, solar panels and more.",
  keywords: ["electrical", "electronics", "Bangladesh", "cables", "circuit breakers", "LED lights", "solar panels", "electrical services", "ePowerFix"],
  authors: [{ name: "ePowerFix" }],
  creator: "ePowerFix",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "bn_BD",
    url: "https://epowerfix.com",
    siteName: "ePowerFix",
    title: "ePowerFix — Electrical Power & Digital Technology",
    description: "Bangladesh's trusted online marketplace for electrical products, services, and tools.",
    images: [{ url: "/logo.svg", width: 200, height: 200, alt: "ePowerFix" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ePowerFix — Electrical Power & Digital Technology",
    description: "Bangladesh's trusted online marketplace for electrical products, services, and tools.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${notoBengali.variable} ${inter.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Providers>
            <SiteThemeProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
            </SiteThemeProvider>
            <Toaster position="top-center" richColors />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
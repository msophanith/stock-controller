// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AppProviders } from "@/components/provider";
import { ThemeProvider } from "@/components/theme-provider";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Accessories Stock — Parts & Accessories Inventory",
  description: "Offline-first stock control for car accessories shops",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Accessories Stock",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased dark:bg-slate-950 dark:text-slate-100 bg-white text-slate-900 min-h-screen">
        <ThemeProvider>
          {/* {process.env.NODE_ENV === "production" && <SecurityShield />} */}
          <AppProviders>{children}</AppProviders>
          <Toaster
            position="top-center"
            richColors
            toastOptions={{
              className:
                "dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { StorageProvider } from "@/lib/storage/provider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SchedulerInit } from "@/components/layout/SchedulerInit";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Review Hound",
  description: "Monitor and analyze your business reviews across platforms",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=localStorage.getItem('theme');if(s==='dark'||(!s&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}})()`,
          }}
        />
      </head>
      <body className={`${inter.className} bg-[var(--bg-page)] min-h-screen flex flex-col antialiased`}>
        <ThemeProvider>
          <StorageProvider>
            <SchedulerInit />
            <Navbar />
            <main className="container mx-auto px-6 py-8 flex-1">
              {children}
            </main>
            <Footer />
          </StorageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

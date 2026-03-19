import type { Metadata } from "next";
import { Outfit, Merriweather, Fira_Code } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { StorageProvider } from "@/lib/storage/provider";
import { Navbar } from "@/components/layout/Navbar";
import { SchedulerInit } from "@/components/layout/SchedulerInit";

const fontSans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-serif",
});

const fontMono = Fira_Code({
  subsets: ["latin"],
  variable: "--font-mono",
});

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
            __html: `(function(){var s=localStorage.getItem('theme');if(s!=='light'){document.documentElement.classList.add('dark')}})()`,
          }}
        />
      </head>
      <body className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} font-sans bg-background text-foreground min-h-screen flex flex-col antialiased`}>
        <ThemeProvider>
          <StorageProvider>
            <SchedulerInit />
            <Navbar />
            <main className="container mx-auto px-6 py-8 flex-1">
              {children}
            </main>
          </StorageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

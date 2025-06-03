import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Koyn.AI - AI Model Marketplace",
  description: "Discover, access, and integrate cutting-edge AI models from top creators. From language models to computer vision - find the perfect AI solution for your needs.",
  keywords: ["AI models", "machine learning", "API", "artificial intelligence", "marketplace"],
  authors: [{ name: "Koyn.AI Team" }],
  creator: "Koyn.AI",
  publisher: "Koyn.AI",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://koyn.ai",
    title: "Koyn.AI - AI Model Marketplace",
    description: "Discover, access, and integrate cutting-edge AI models from top creators worldwide.",
    siteName: "Koyn.AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Koyn.AI - AI Model Marketplace",
    description: "Discover, access, and integrate cutting-edge AI models from top creators worldwide.",
    creator: "@koynai",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}

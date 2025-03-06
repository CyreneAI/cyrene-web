import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Navbar from "@/components/common/navbar";
import Footer from "@/components/common/footer";
import {Toaster} from "sonner"
import { Cursor } from "@/components/ui/cursor";



const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://cyreneai.com"),
  title: "Cyrene AI",
  description: "CyreneAI is your cosmic guide and AI orchestrator on NetSepio's secure network. Chat with Cyrene, launch AI agents, and explore new frontiers in decentralized tech and elevated consciousness.",
  icons: {
    icon: [
      { url: "/CyreneAI_logo_square.png", sizes: "32x32", type: "image/png" },
      { url: "/CyreneAI_logo_square.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/CyreneAI_logo_square.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: [{ url: "/CyreneAI_logo_square.png" }],
  },
  openGraph: {
    title: "CyreneAI",
    description: "CyreneAI is your cosmic guide and AI orchestrator on NetSepio's secure network. Chat with Cyrene, launch AI agents, and explore new frontiers in decentralized tech and elevated consciousness.",
    url: "https://cyreneai.com/", 
    siteName: "CyreneAI",
    images: [
      {
        url: "/CyreneAI_share.png", 
        width: 1200,
        height: 630,
        alt: "Guiding Humanity to the Agentic Future",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CyreneAI",
    description: "CyreneAI is your cosmic guide and AI orchestrator on NetSepio's secure network. Chat with Cyrene, launch AI agents, and explore new frontiers in decentralized tech and elevated consciousness.",
    images: [
      {
        url: "/CyreneAI_share.png", 
        width: 1200,
        height: 630,
        alt: "Guiding Humanity to the Agentic Future",
      },
    ],
    site: "https://x.com/CyreneAI", 
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col bg-[#030014] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] cursor-none`}>
        <div className="absolute inset-0"></div>
        <div className="relative z-10">
          <Providers>
            <Cursor />
            <Navbar />
            <main className="flex-grow min-h-[calc(100vh-200px)]">
              {children}
            </main>
            <Toaster richColors/>
            <Footer />
          </Providers>
        </div>
      </body>
    </html>
  );
}
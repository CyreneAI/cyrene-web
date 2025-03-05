import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Navbar from "@/components/common/navbar";
import Footer from "@/components/common/footer";
import { Toaster } from "sonner";

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
      <body
        className={`${inter.className} min-h-screen flex flex-col bg-gradient-to-b from-[#0B1220] to-[#0A1A2F]`}
      >
        <Providers>
          <Navbar />
          <main className="flex-grow min-h-[calc(100vh-200px)] pb-96">
            {children}
          </main>
          <Toaster richColors />
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
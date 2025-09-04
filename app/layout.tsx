import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { headers } from "next/headers";
import { AppKit } from '@/context/appkit';
import { Toaster } from "sonner";
import { Cursor } from "@/components/ui/cursor";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/footer";
import { WalletProviderWrapper } from "@/components/WalletProviderWrapper";
import ProtectedRoute from "@/components/ProtectedRoute";

// Configure Outfit font from Google Fonts
const outfit = Outfit({ 
  subsets: ["latin"],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cyreneai.com"),
  title: "CyreneAI",
  description: "Powering the future of AI interaction through multi-agent collaboration with self-replicating, decentralized agents. Launch agents, engage with Cyrene, and unlock new frontiers in AI, technology, and consciousness.",
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
    description: "Powering the future of AI interaction through multi-agent collaboration with self-replicating, decentralized agents. Launch agents, engage with Cyrene, and unlock new frontiers in AI, technology, and consciousness.",
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
    description: "Powering the future of AI interaction through multi-agent collaboration with self-replicating, decentralized agents. Launch agents, engage with Cyrene, and unlock new frontiers in AI, technology, and consciousness.",
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} font-outfit min-h-screen flex flex-col bg-[#010623] cursor-none`}>
        <div className="absolute inset-0"></div>
        <div className="relative z-10">
          <WalletProviderWrapper>
            <AppKit>
              <Cursor />
              <Navbar />
              <main className="flex-grow min-h-[calc(100vh-200px)]">
                <ProtectedRoute>
                  {children}
                </ProtectedRoute>
              </main>
              <Toaster richColors />
              <Footer />
            </AppKit>
          </WalletProviderWrapper>
        </div>
      </body>
    </html>
  );
}
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { headers } from "next/headers";
import { AppKit } from '@/context/appkit';
import { Toaster } from "sonner";

import Footer from "@/components/common/footer";
import { WalletProviderWrapper } from "@/components/WalletProviderWrapper";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/common/Navbar";

// Configure Outfit font from Google Fonts
const outfit = Outfit({ 
  subsets: ["latin"],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cyreneai.com"),
  title: "CyreneAI",
  description: "Decentralized Launchpad fueling Internet Capital Markets, where AI Agents empower cutting-edge projects with tokenized funding. Powered by NetSepio",
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
    description: "Decentralized Launchpad fueling Internet Capital Markets, where AI Agents empower cutting-edge projects with tokenized funding. Powered by NetSepio",
    url: "https://cyreneai.com/",
    siteName: "CyreneAI",
    images: [
      {
        url: "/Cyrene_metadata-image.webp",
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
    description: "Decentralized Launchpad fueling Internet Capital Markets, where AI Agents empower cutting-edge projects with tokenized funding. Powered by NetSepio",
    images: [
      {
        url: "/Cyrene_metadata-image.webp",
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
      <body className={`${outfit.variable} font-outfit min-h-screen flex flex-col bg-[#010623]`}>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-4VQLXFP5Y4"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-4VQLXFP5Y4', {
              page_title: document.title,
              page_location: window.location.href,
            });
          `}
        </Script>

        <div className="absolute inset-0"></div>
        <div className="relative z-10">
          <WalletProviderWrapper>
            <AppKit>
              {/* <Cursor /> removed: restore default cursor */}
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
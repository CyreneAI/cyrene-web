import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Navbar from "@/components/common/navbar";
import Footer from "@/components/common/footer";
import {Toaster} from "sonner"



const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cyrene AI",
  description: "The future of AI tokens",
  icons: {
    icon: [
      { url: '/CyreneAI_logo_square.png', sizes: '32x32', type: 'image/png' },
      { url: '/CyreneAI_logo_square.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/CyreneAI_logo_square.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: [
      { url: '/CyreneAI_logo_square.png' },
    ],
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col bg-gradient-to-b from-[#0B1220] to-[#0A1A2F]`}>
        <Providers>
          <Navbar />
          <main className="flex-grow min-h-[calc(100vh-200px)] pb-96">
            {children}
          </main>
          <Toaster richColors/>
          <Footer />
        </Providers>
      </body>
    </html>

  );
}

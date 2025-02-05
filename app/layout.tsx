import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

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
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/CyreneAI_logo_square.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/CyreneAI_logo_square.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/CyreneAI_logo_square.png" />
        <link rel="shortcut icon" href="/CyreneAI_logo_square.png" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

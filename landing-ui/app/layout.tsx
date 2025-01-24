import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cyrene AI",
  description: "The future of AI tokens",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/CyreneAI_logo_square.png" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}

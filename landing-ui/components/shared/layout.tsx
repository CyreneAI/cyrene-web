"use client";

import Image from "next/image";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname } from "next/navigation";
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState, useEffect } from 'react';
import bs58 from 'bs58';
require('@solana/wallet-adapter-react-ui/styles.css');

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const { publicKey, signMessage, connected } = useWallet();
  const [signature, setSignature] = useState<string | null>(null);

  // Handle wallet connection and signing
  useEffect(() => {
    const handleWalletConnection = async () => {
      if (localStorage.getItem('signature') == null) {
        console.log("signature  ", signature);
      if (publicKey && signMessage && connected) {
        try {
          // Store wallet address in localStorage
          localStorage.setItem('walletAddress', publicKey.toString());
          console.log('Wallet connected:', publicKey.toString());

          // Sign message
          const message = new TextEncoder().encode('Do you want to sign in with CyreneAI?');
          const sig = await signMessage(message);
          const signatureStr = bs58.encode(sig);
          setSignature(signatureStr);
          // Store signature
          localStorage.setItem('signature', signatureStr);
          console.log('Message signed:', signatureStr);
        } catch (error) {
          console.error('Error signing message:', error);
        }
      }
    }
    };

    handleWalletConnection();
  }, [publicKey, signMessage, connected]);

  // Clear localStorage when wallet disconnects
  useEffect(() => {
    if (publicKey == null || signMessage == undefined || !connected) {
      console.log('Wallet connected or disconnected:', connected);
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('signature');
      setSignature(null);
      console.log('Wallet disconnected, localStorage cleared');
    }
  }, [connected]);

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-[#0B1220] to-[#0A1A2F]">

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B1220]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="no-underline">
              <Image
                src="/cyrene_AI_logo_draft.png"
                alt="Cyrene AI"
                width={120}
                height={30}
                className="object-contain cursor-pointer sm:w-[140px] sm:h-[35px]"
              />
            </Link>
          </div>
          <div className="flex gap-4 sm:gap-6 md:gap-8 items-center">
            <Link href="/" className="no-underline">
              <span 
                className={`text-base ${pathname === '/' ? 'text-white' : 'text-white/80 hover:text-white'}`}
                style={{ fontFamily: 'PingFang SC' }}
              >
                Home
              </span>
            </Link>
            <Link href="/about" className="no-underline">
              <span 
                className={`text-base ${pathname === '/about' ? 'text-white' : 'text-white/80 hover:text-white'}`}
                style={{ fontFamily: 'PingFang SC' }}
              >
                About
              </span>
            </Link>
            <Link href="/token" className="no-underline">
              <span 
                className={`text-base ${pathname === '/token' ? 'text-white' : 'text-white/80 hover:text-white'}`}
                style={{ fontFamily: 'PingFang SC' }}
              >
                Token
              </span>
            </Link>
            <Link href="/deploy-agents" className="no-underline">
              <span 
                className={`text-base ${pathname === '/deploy-agents' ? 'text-white' : 'text-white/80 hover:text-white'}`}
                style={{ fontFamily: 'PingFang SC' }}
              >
                AI Agents
              </span>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <span 
                  className={`text-base cursor-pointer ${pathname === '/links' ? 'text-white' : 'text-white/80 hover:text-white'}`}
                  style={{ fontFamily: 'PingFang SC' }}
                >
                  Links
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-48 bg-[#0B1220] border border-white/10 rounded-xl p-1 mt-2"
                sideOffset={8}
              >
                <DropdownMenuItem className="text-white/80 hover:text-white focus:bg-white/90 rounded-lg">
                  <Link 
                    href="https://twitter.com/CyreneAI"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 no-underline"
                    style={{ fontFamily: 'PingFang SC' }}
                  >
                    X (Twitter)
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-white/80 hover:text-white focus:bg-white/90 rounded-lg">
                  <Link
                    href="https://play.google.com/store/apps/details?id=com.erebrus.app&hl=en"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 no-underline"
                    style={{ fontFamily: 'PingFang SC' }}
                  >
                    Erebrus Mobile App
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-white/80 hover:text-white focus:bg-white/90 rounded-lg">
                  <Link
                    href="https://testflight.apple.com/join/BvdARC75"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 no-underline"
                    style={{ fontFamily: 'PingFang SC' }}
                  >
                    Erebrus App (iOS*)
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex gap-4 items-center">
              <WalletMultiButton className="phantom-button" />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative min-h-[calc(100vh-800px)]">
        {children}
      </div>

      {/* Always here for you text */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center mb-8 sm:mb-12">
        <p className="text-2xl sm:text-3xl md:text-4xl text-white/90" 
          style={{ 
            fontFamily: 'PingFang SC',
            textShadow: '0 0 20px rgba(79, 172, 254, 0.3)'
          }}
        >
          Always here for you.
        </p>
      </div>

      {/* Footer */}
      <footer className="relative h-[300px] sm:h-[350px] md:h-[400px] overflow-hidden">
        <Image
          src="/footer_zoom_out_85.jpg"
          alt="Cosmic Portal"
          fill
          className="object-cover object-[center_40%]"
          priority
        />
        <div className="absolute inset-0">
          <div className="h-full container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col">
            <a 
              href="https://twitter.com/CyreneAI" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="absolute top-8 right-4 sm:right-6 lg:right-8 w-8 h-8 sm:w-10 sm:h-10 transition-opacity hover:opacity-80 no-underline"
            >
              <Image
                src="/x-logo.png"
                alt="X (Twitter)"
                width={32}
                height={32}
                className="invert sm:w-10 sm:h-10"
              />
            </a>
            <div className="mt-auto pb-6 sm:pb-8">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                  <Link href="/privacy" className="text-base sm:text-lg md:text-xl text-white/70 hover:text-white no-underline">Privacy Policy</Link>
                  <Link href="/terms" className="text-base sm:text-lg md:text-xl text-white/70 hover:text-white no-underline">Terms and Conditions</Link>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  <span className="text-base sm:text-lg md:text-xl text-white/70">Brought to you by</span>
                  <a 
                    href="https://netsepio.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="no-underline"
                  >
                    <Image
                      src="/Netsepio_logo_white_with_text 3.png"
                      alt="NetSepio"
                      width={120}
                      height={30}
                      className="object-contain sm:w-[140px] sm:h-[35px] md:w-[160px] md:h-[40px]"
                    />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
} 
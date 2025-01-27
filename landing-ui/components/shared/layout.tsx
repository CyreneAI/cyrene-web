"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-[#0B1220] to-[#0A1A2F] overflow-x-hidden">
      {/* Cover Image */}
      <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px]">
        <Image
          src="/new_cyrene_cover_85.jpg"
          alt="Cyrene Cover"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 md:pt-32">
            <h1 
              className="text-3xl sm:text-4xl md:text-5xl font-medium text-white tracking-tight max-w-2xl"
              style={{ 
                fontFamily: 'PingFang SC', 
                textShadow: '0 0 20px rgba(79, 172, 254, 0.5)'
              }}
            >
              Your Cosmic Guide to the Digital Frontier
            </h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B1220]/95 backdrop-blur-sm w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="no-underline">
              <Image
                src="/CyreneAI_logo-text.png"
                alt="Cyrene AI"
                width={140}
                height={35}
                className="object-contain cursor-pointer w-[140px] h-[35px] sm:w-[160px] sm:h-[40px] md:w-[200px] md:h-[50px]"
              />
            </Link>
          </div>
          <div className="flex gap-3 sm:gap-6 md:gap-8 items-center">
            <Link href="/" className="no-underline">
              <span 
                className={`text-sm sm:text-base ${pathname === '/' ? 'text-white' : 'text-white/80 hover:text-white'}`}
                style={{ fontFamily: 'PingFang SC' }}
              >
                Home
              </span>
            </Link>
            <Link href="/about" className="no-underline">
              <span 
                className={`text-sm sm:text-base ${pathname === '/about' ? 'text-white' : 'text-white/80 hover:text-white'}`}
                style={{ fontFamily: 'PingFang SC' }}
              >
                About
              </span>
            </Link>
            <Link href="/token" className="no-underline">
              <span 
                className={`text-sm sm:text-base ${pathname === '/token' ? 'text-white' : 'text-white/80 hover:text-white'}`}
                style={{ fontFamily: 'PingFang SC' }}
              >
                Token
              </span>
            </Link>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`text-sm sm:text-base bg-transparent border-0 cursor-pointer ${pathname === '/links' ? 'text-white' : 'text-white/80 hover:text-white'}`}
                style={{ fontFamily: 'PingFang SC' }}
              >
                Links
              </button>
              {isOpen && (
                <div className="absolute right-0 mt-2 min-w-[12rem] bg-[#0B1220]/95 backdrop-blur-sm border border-white/10 rounded-xl p-1 z-[100]">
                  <a 
                    href="/CyreneAI - The Future of Autonomous AI Agents.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-2 px-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg no-underline transition-colors"
                    style={{ fontFamily: 'PingFang SC' }}
                  >
                    Tech Overview (PDF)
                  </a>
                  <a 
                    href="https://twitter.com/CyreneAI"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-2 px-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg no-underline transition-colors"
                    style={{ fontFamily: 'PingFang SC' }}
                  >
                    X (Twitter)
                  </a>
                  <a 
                    href="https://apps.apple.com/app/erebrus/id6474476171"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-2 px-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg no-underline transition-colors"
                    style={{ fontFamily: 'PingFang SC' }}
                  >
                    Erebrus App (iOS)
                  </a>
                  <a 
                    href="https://play.google.com/store/apps/details?id=com.erebrus.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-2 px-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg no-underline transition-colors"
                    style={{ fontFamily: 'PingFang SC' }}
                  >
                    Erebrus App (Android)
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative min-h-[calc(100vh-800px)]">
        {children}
      </div>

      {/* Always here for you text */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center mb-6 sm:mb-8 md:mb-12">
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
      <footer className="relative h-[400px] sm:h-[350px] md:h-[400px] overflow-hidden">
        <Image
          src="/footer_zoom_out_85.jpg"
          alt="Cosmic Portal"
          fill
          className="object-cover object-center"
          priority
          quality={100}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/30 to-transparent">
          <div className="h-full container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col">
            <div className="mt-auto pb-8">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-8 sm:gap-0">
                <div className="grid grid-cols-2 gap-6 sm:flex sm:gap-8 w-full sm:w-auto place-items-center">
                  <a href="#" className="text-base sm:text-lg md:text-xl text-white/70 hover:text-white no-underline text-center">Privacy Policy</a>
                  <a href="#" className="text-base sm:text-lg md:text-xl text-white/70 hover:text-white no-underline text-center">Terms and Conditions</a>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="text-lg sm:text-xl md:text-2xl text-white/70">Brought to you by</span>
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
                      className="object-contain sm:w-[160px] sm:h-[40px] md:w-[180px] md:h-[45px]"
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
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout ({ children }: LayoutProps) {
  const pathname = usePathname()
  const [signature, setSignature] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Handle wallet connection and signing
  useEffect(() => {
    const handleWalletConnection = async () => {
      if (localStorage.getItem('signature') == null) {
        console.log('signature  ', signature)
      }
    }

    handleWalletConnection()
  }, [signature])

  // Clear localStorage when wallet disconnects
  useEffect(() => {
    if (signature == null) {
      console.log('Wallet disconnected, localStorage cleared')
      localStorage.removeItem('signature')
      setSignature(null)
    }
  }, [signature])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <main className='relative min-h-screen bg-gradient-to-b from-[#0B1220] to-[#0A1A2F] overflow-x-hidden'>
      {/* Cover Image */}
      {/* Cover Video */}
      <div className="relative w-full h-[500px] md:h-[742px]">
  {/* Background Video */}
  <video
    src="Cyrene video hero for Topaz_apo8.mp4" // Place your video inside the "public" folder
    autoPlay
    loop
    muted
    playsInline
    className="absolute inset-0 w-full h-full object-cover"
  />

  {/* Gradient Overlay for Readability */}
  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0F1A2E]/90" />

  {/* Centered Main Text (Responsive) */}
  <div className="absolute inset-0 flex flex-col gap-8 items-center justify-center text-center px-4">
    <h1
      className="text-3xl sm:text-4xl md:text-[55px] font-light text-white tracking-tight max-w-full"
      style={{
        fontFamily: "DM Sans",
        textShadow: "0 0 20px rgba(79, 172, 254, 0.5)"
      }}
    >
      Journey with Cyrene into the Agentic Future
    </h1>
    <a
      href="#"
      className="px-6 py-3 text-lg md:text-xl font-medium text-black bg-white rounded-full shadow-lg transition-all duration-300 hover:bg-blue-600 hover:shadow-blue-500/50"
    >
      Launch Agent
    </a>
  </div>

  {/* Bottom Text with Semi-Transparent Gradient */}
  <div className="absolute bottom-0 w-full bg-gradient-to-r from-[#4C8AEC]/40 to-[#424F7F]/40 text-center py-4 sm:py-6 md:py-8">
    <p className="text-lg sm:text-xl md:text-[24px] font-normal font-sans text-white">
      Multi-Agent Platform and AI Coordination layer on secure network powered by NetSepio
    </p>
  </div>
</div>


      {/* Navigation */}
      <nav className='fixed top-0 left-0 right-0 z-50  w-full'>
        <div className='container mx-auto px-6 sm:px-6 lg:px-8 py-4 sm:py-4 flex justify-between items-center'>
          <div className='flex items-center'>
            <Link href='/' className='no-underline'>
              <Image
                src='/CyreneAI_logo-text.png'
                alt='Cyrene AI'
                width={250}
                height={77}
                className='object-contain cursor-pointer w-[250px] h-[77px] sm:w-[160px] sm:h-[40px] md:w-[250px] md:h-[77px]'
              />
            </Link>
          </div>
          <div className='flex gap-4 sm:gap-6 md:gap-8 items-center'>
            <Link href='/' className='no-underline'>
              <span
                className={`text-sm sm:text-base ${
                  pathname === '/'
                    ? 'text-white'
                    : 'text-white/80 hover:text-white'
                }`}
                style={{ fontFamily: 'PingFang SC' }}
              >
                Home
              </span>
            </Link>
            {/* <Link href='/about' className='no-underline'>
              <span
                className={`text-sm sm:text-base ${
                  pathname === '/about'
                    ? 'text-white'
                    : 'text-white/80 hover:text-white'
                }`}
                style={{ fontFamily: 'PingFang SC' }}
              >
                About
              </span>
            </Link>
            <Link href='/token' className='no-underline'>
              <span
                className={`text-sm sm:text-base ${
                  pathname === '/token'
                    ? 'text-white'
                    : 'text-white/80 hover:text-white'
                }`}
                style={{ fontFamily: 'PingFang SC' }}
              >
                Token
              </span>
            </Link> */}
            <div className='relative' ref={dropdownRef}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`text-2xl font-sans sm:text-base bg-[#0162FF] px-4 py-2 rounded-xl border-0 cursor-pointer ${
                  pathname === '/links'
                    ? 'text-white'
                    : 'text-white/80 hover:text-white'
                }`}
                // style={{ fontFamily: 'PingFang SC' }}
              >
                Connect
              </button>
              {isOpen && (
                <div className='absolute right-0 mt-2 min-w-[16rem] bg-[#0B1220]/95 backdrop-blur-sm border border-white/10 rounded-xl p-1 z-[100]'>
                  <a
                    href='/CyreneAI - The Future of Autonomous AI Agents.pdf'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='block w-full py-2 px-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg no-underline transition-colors'
                    style={{ fontFamily: 'PingFang SC' }}
                  >
                    Tech Overview (PDF)
                  </a>
                  <a
                    href='https://twitter.com/CyreneAI'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='block w-full py-2 px-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg no-underline transition-colors'
                    style={{ fontFamily: 'PingFang SC' }}
                  >
                    X (Twitter)
                  </a>
                  <a
                    href='https://testflight.apple.com/join/BvdARC75'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='block w-full py-2 px-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg no-underline transition-colors'
                    style={{ fontFamily: 'PingFang SC' }}
                  >
                    Erebrus App (iOS*)
                  </a>
                  <a
                    href='https://play.google.com/store/apps/details?id=com.erebrus.app'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='block w-full py-2 px-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg no-underline transition-colors'
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
      <div className='relative min-h-[calc(100vh-800px)]'>{children}</div>

      {/* Always here for you text */}
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 text-center mb-6 sm:mb-8 md:mb-12'>
        <p
          className='text-2xl sm:text-3xl md:text-4xl text-white/90'
          style={{
            fontFamily: 'PingFang SC',
            textShadow: '0 0 20px rgba(79, 172, 254, 0.3)'
          }}
        >
          Always here for you.
        </p>
      </div>

      {/* Footer */}
      <footer className='relative h-[400px] sm:h-[350px] md:h-[400px] overflow-hidden'>
        <Image
          src='/footer_zoom_out_85.jpg'
          alt='Cosmic Portal'
          fill
          className='object-cover object-center'
          priority
          quality={100}
        />
        <div className='absolute inset-0 bg-gradient-to-t from-black/50 via-black/30 to-transparent'>
          <div className='h-full container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col'>
            <div className='mt-auto pb-8'>
              <div className='flex flex-col sm:flex-row justify-between items-center gap-8 sm:gap-0'>
                <div className='grid grid-cols-2 gap-6 sm:flex sm:gap-8 w-full sm:w-auto place-items-center'>
                  <a
                    href='#'
                    className='text-base sm:text-lg md:text-xl text-white/70 hover:text-white no-underline text-center'
                  >
                    Privacy Policy
                  </a>
                  <a
                    href='#'
                    className='text-base sm:text-lg md:text-xl text-white/70 hover:text-white no-underline text-center'
                  >
                    Terms and Conditions
                  </a>
                </div>
                <div className='flex items-center gap-3 sm:gap-4'>
                  <span className='text-lg sm:text-xl md:text-2xl text-white/70'>
                    Brought to you by
                  </span>
                  <a
                    href='https://netsepio.com'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='no-underline'
                  >
                    <Image
                      src='/Netsepio_logo_white_with_text 3.png'
                      alt='NetSepio'
                      width={120}
                      height={30}
                      className='object-contain sm:w-[160px] sm:h-[40px] md:w-[180px] md:h-[45px]'
                    />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}

'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { WalletModalButton } from '@solana/wallet-adapter-react-ui';
import {
 useWallet
} from '@solana/wallet-adapter-react';
import { PhantomWalletName } from '@solana/wallet-adapter-phantom'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';


interface LayoutProps {
  children: React.ReactNode
}

export default function Layout ({ children }: LayoutProps) {
  const pathname = usePathname()
  // const [signature, setSignature] = useState<string | null>(null)
  const[ isAgentOpen,setIsAgentOpen]=useState(false);
  const [isOpen, setIsOpen] = useState(false)
  const [isAgentOpen, setIsAgentOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null);



  useEffect(() => {
    const storedAddress = localStorage.getItem('walletAddress');
    if (storedAddress) {
      setWalletAddress(storedAddress);
    }
  }, []);

    // Handle wallet connection and signing
    // useEffect(() => {
    //   const handleWalletConnection = async () => {
    //     if (localStorage.getItem('signature') == null) {
    //       console.log('signature  ', signature)
    //     }
    //   }
    //   handleWalletConnection()
    // }, [signature])
  
    // // Clear localStorage when wallet disconnects
    // useEffect(() => {
    //   if (signature == null) {
    //     console.log('Wallet disconnected, localStorage cleared')
    //     localStorage.removeItem('signature')
    //     setSignature(null)
    //   }
    // }, [signature])

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
                  pathname === '/home'
                    ? 'text-white'
                    : 'text-white/80 hover:text-white'
                }`}
                style={{ fontFamily: 'PingFang SC' }}
              >
                Home
              </span>
            </Link>
            <div className='relative' ref={dropdownRef}>
              <button
                onClick={() => setIsAgentOpen(!isAgentOpen)}
                className={`text-2xl font-sans sm:text-bas  px-4 py-2 rounded-xl border-0 cursor-pointer ${
                  pathname === '/links'
                    ? 'text-white'
                    : 'text-white/80 hover:text-white'
                }`}
                // style={{ fontFamily: 'PingFang SC' }}
              >
                Agents
              </button>
              {isAgentOpen && (
                <div className='absolute right-0 mt-2 px-2 py-1 bg-[#0B1220]/95 backdrop-blur-sm border border-white/10 rounded-xl  z-[100]'>
                  <Link
                    href='/CyreneAI - The Future of Autonomous AI Agents.pdf'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='block w-full py-2 px-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg no-underline transition-colors'
                    style={{ fontFamily: 'PingFang SC' }}
                  >
                    Explore
                  </Link>
                  <Link
                    href='/launch-agent'
                    
                    rel='noopener noreferrer'
                    className='block w-full py-2 px-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg no-underline transition-colors'
                    style={{ fontFamily: 'PingFang SC' }}
                  >
                    Launch
                  </Link>

                </div>
              )}
            </div>
            {/* <Link href='/about' className='no-underline'>
              <span
                className={`text-sm sm:text-base ${
                  pathname === '/about'
                    ? 'text-white'
                    : 'text-white/80 hover:text-white'
                }`}
                // style={{ fontFamily: 'PingFang SC' }}
              >
                Agents
              </button>
              {isAgentOpen && (
                <div className='absolute right-0 mt-2 px-2 py-1 bg-[#0B1220]/95 backdrop-blur-sm border border-white/10 rounded-xl  z-[100]'>
                  <Link
                    href='/CyreneAI - The Future of Autonomous AI Agents.pdf'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='block w-full py-2 px-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg no-underline transition-colors'
                    style={{ fontFamily: 'PingFang SC' }}
                  >
                    Explore
                  </Link>
                  <Link
                    href='/launch-agent'
                    
                    rel='noopener noreferrer'
                    className='block w-full py-2 px-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg no-underline transition-colors'
                    style={{ fontFamily: 'PingFang SC' }}
                  >
                    Launch
                  </Link>

                </div>
              )}
            </div>
            {/* <Link href='/token' className='no-underline'>
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
            <div>
              {walletAddress ? (
                <WalletMultiButton />

              ) : (

                    <WalletModalButton />
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
      <footer className='relative h-[50px] sm:h-[350px] md:h-[500px] overflow-hidden'>
        <Image
          src='/footer_zoom_out_85.jpg'
          alt='Cosmic Portal'
          fill
          className='object-cover object-center'
          priority
          quality={100}
        />
        <div className='absolute inset-0 bg-gradient-to-t from-black/50 via-black/30 to-transparent'>
          <div className='h-full  container mx-auto !px-24 sm:px-6 lg:px-8 flex flex-col'>
            <div className='mt-16 pb-8 gap-10'>
              <div className='flex flex-col sm:flex-row justify-between items-center gap-10 sm:gap-0'>
                <div className='grid grid-cols-2  sm:flex gap-16 sm:gap-24 w-full sm:w-auto place-items-top'>
                  <div className='font-sans'>
                  <a
                    href='#'
                    className='text-base font-600 sm:text-lg md:text-2xl text-white hover:text-white no-underline text-center'
                  >
                    About
                  </a>
                  <ul className='text-white/70 gap-4 mt-4 font-400'>
                    <li className='py-2'>Mission</li>
                    <li>Token</li>
                  </ul>
                  </div>
                  <div>
                  <a
                    href='#'
                    className='text-medium font-600 sm:text-lg md:text-2xl text-white hover:text-white no-underline text-center'
                  >
                    Integrations
                  </a>
                  <ul className='text-white/70 mt-4 font-400'>
                    <li className='py-2'>Erebrus Android</li>
                    <li className='py-2'>Erebrus iOS*</li>
                    <li className='py-2'>CyreneAI on X</li>
                    <li className='py-2'>CyreneAI on Discord</li>
                  </ul>
                  </div>

                
                </div>
             
              </div>
            </div>
            <div className='mt-auto  pb-8'>
              <div className='flex flex-col sm:flex-row justify-between items-center gap-8 sm:gap-0'>
                <div >
                <div className='grid grid-cols-2 border-b-2 border-white/40 pb-4 gap-6 sm:flex sm:gap-8 w-full sm:w-auto place-items-center'>
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
                <div className='text-white/40 py-4 '>
                © 2025 - CyreneAI. All rights reserved.
                </div>
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

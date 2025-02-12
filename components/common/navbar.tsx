'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { WalletMultiButton, WalletModalButton } from '@solana/wallet-adapter-react-ui';

const Navbar = () => {
    const pathname = usePathname()
    const[ isAgentOpen,setIsAgentOpen]=useState(false);
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const agentDropdownRef = useRef(null);
    const connectDropdownRef = useRef(null);



  useEffect(() => {
    const storedAddress = localStorage.getItem('walletAddress');
    if (storedAddress) {
      setWalletAddress(storedAddress);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        agentDropdownRef.current &&
        !agentDropdownRef.current.contains(event.target as Node)
      ) {
        setIsAgentOpen(false);
      }
      if (
        connectDropdownRef.current &&
        !connectDropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
  
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  

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
    <nav className='fixed top-0 left-0 right-0 z-50 w-full bg-[#0B1220]/90 backdrop-blur-md'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center'>
        {/* Logo */}
        <Link href='/' className='no-underline'>
          <Image
            src='/CyreneAI_logo-text.png'
            alt='Cyrene AI'
            width={250}
            height={77}
            className='object-contain cursor-pointer w-[180px] sm:w-[160px] md:w-[220px]'
          />
        </Link>

        {/* Navigation Links */}
        <div className='flex gap-6 items-center text-white text-base sm:text-sm'>
          <Link href='/' className={`no-underline ${pathname === '/home' ? 'text-white' : 'text-white/80 hover:text-white'}`}>
            Home
          </Link>

          {/* Agents Dropdown */}
          <div className='relative' ref={agentDropdownRef}>
            <button
              onClick={() => setIsAgentOpen((prev) => !prev)}
              className='px-4 py-2 rounded-lg text-white/80 hover:text-white transition-all'
            >
              Agents
            </button>
            {isAgentOpen && (
              <div className='absolute right-0 mt-2 w-40 bg-[#0B1220]/95 backdrop-blur-md border border-white/10 rounded-lg p-2 z-50'>
                <Link
                  href='/explore-agents'
                  className='block px-3 py-2 rounded-md hover:bg-white/10'
                >
                  Explore
                </Link>
                <Link href='/launch-agent' className='block px-3 py-2 rounded-md hover:bg-white/10'>
                  Launch
                </Link>
              </div>
            )}
          </div>

          {/* Wallet Button */}
          <div>{walletAddress ? <WalletMultiButton /> : <WalletModalButton />}</div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

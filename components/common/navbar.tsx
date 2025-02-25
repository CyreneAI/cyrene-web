'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { WalletMultiButton, WalletModalButton } from '@solana/wallet-adapter-react-ui';
import { FaBars, FaTimes ,FaChevronDown, FaChevronUp } from 'react-icons/fa';


const Navbar = () => {
    const pathname = usePathname()
    const dropdownRef = useRef<HTMLDivElement>(null)
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const router = useRouter()
    const agentDropdownRef = useRef<HTMLDivElement | null>(null);
    const connectDropdownRef = useRef<HTMLDivElement | null>(null);
    const [isAgentOpen, setIsAgentOpen] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  

  
    const handleHomeClick = () => {
      localStorage.removeItem("currentAgentId");
      localStorage.removeItem("currentAgentName");
      localStorage.removeItem("currentAgentImage");
      router.replace("/");
    };
  

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
    // <nav className='fixed top-0 left-0 right-0 z-50 w-full bg-[#0B1220]/90 backdrop-blur-md'>
    //   <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center'>
    //     {/* Logo */}
    //     <div onClick={handleHomeClick}>
    //       <Link href="/" className="no-underline">
    //         <Image
    //           src="/CyreneAI_logo-text.png"
    //           alt="Cyrene AI"
    //           width={250}
    //           height={77}
    //           className="object-contain cursor-pointer w-[180px] sm:w-[160px] md:w-[220px]"
    //         />
    //       </Link>
    //     </div>

    //     {/* Navigation Links */}
    //     <div className='flex gap-6 items-center text-white text-base sm:text-sm'>
    //       <div onClick={handleHomeClick}>
    //         <Link href="/" className={`no-underline ${pathname === '/home' ? 'text-white' : 'text-white/80 hover:text-white'}`}>
    //           Home
    //         </Link>
    //       </div>

    //       {/* Agents Dropdown */}
    //       <div className='relative' ref={agentDropdownRef}>
    //         <button
    //           onClick={() => setIsAgentOpen((prev) => !prev)}
    //           className='px-4 py-2 rounded-lg text-white/80 hover:text-white transition-all'
    //         >
    //           Agents
    //         </button>
    //         {isAgentOpen && (
    //           <div className='absolute right-0 mt-2 w-40 bg-[#0B1220]/95 backdrop-blur-md border border-white/10 rounded-lg p-2 z-50'>
    //             <Link
    //               href='/explore-agents'
    //               className='block px-3 py-2 rounded-md hover:bg-white/10'
    //             >
    //               Explore
    //             </Link>
    //             <Link href='/launch-agent' className='block px-3 py-2 rounded-md hover:bg-white/10'>
    //               Launch
    //             </Link>
    //           </div>
    //         )}
    //       </div>

    //       {/* Wallet Button */}
    //       <div >{walletAddress ? <WalletMultiButton  /> : <WalletModalButton />}</div>
    //     </div>
    //   </div>
    // </nav>
    <nav className='fixed top-0 left-0 right-0 z-50 w-full bg-[#0B1220]/90 backdrop-blur-md'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center'>
        {/* Logo */}
        <div onClick={handleHomeClick}>
        <Link href='/' className='no-underline'>
            <Image
              src='/CyreneAI_logo-text.png'
              alt='Cyrene AI'
              width={250}
              height={94}
              className='hidden sm:block object-contain cursor-pointer w-[180px] sm:w-[160px] md:w-[220pxhi]'
            />
            <Image
              src='/CyreneAI_logo-text.png'
              alt='Cyrene AI'
              width={140}
              height={50}
              className='block sm:hidden object-contain cursor-pointer'
            />
          </Link>
        </div>

        <div className="flex items-center justify-center  gap-6">
        <div className='block sm:hidden'>{walletAddress ? <WalletMultiButton /> : <WalletModalButton />}</div>

        {/* Mobile Menu Button */}
        <button
          className='text-white text-2xl sm:hidden'
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        >
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
        </div>

        {/* Navigation Links (Desktop) */}
        <div className='hidden sm:flex gap-6 items-center text-white text-base sm:text-sm'>
          <Link href='/' className={`no-underline ${pathname === '/home' ? 'text-white' : 'text-white/80 hover:text-white'}`}>
            Home
          </Link>
          
          {/* Agents Dropdown */}
          <div className='relative' ref={agentDropdownRef}>
            <button
              onClick={() => setIsAgentOpen((prev) => !prev)}
              className='px-4 py-2 rounded-lg text-white/80 hover:text-white transition-all flex justify-center items-center gap-2'
            >
              Agents {isAgentOpen ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {isAgentOpen && (
              <div className='absolute right-0 mt-2 w-40 bg-[#0B1220]/95 backdrop-blur-md border border-white/10 rounded-lg p-2 z-50'>
                <Link href='/explore-agents' className='block px-3 py-2 rounded-md hover:bg-white/10'>
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

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className='sm:hidden absolute top-18 right-0 w-1/2 bg-[#0B1220]/95 backdrop-blur-md  border-white/10 py-4 px-6'>
          <div className='flex flex-col gap-4 text-white text-base'>
            <Link href='/' className='no-underline text-white/80 hover:text-white' onClick={() => setIsMobileMenuOpen(false)}>
              Home
            </Link>
            
            
            {/* Agents Dropdown (Mobile) */}
            <div className='relative' ref={agentDropdownRef}>
              <button
                onClick={() => setIsAgentOpen((prev) => !prev)}
                className='text-white/80 hover:text-white transition-all flex gap-2 items-center'
              >
                Agents {isAgentOpen ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              {isAgentOpen && (
                <div className='mt-2 bg-[#0B1220]/95 backdrop-blur-md  rounded-lg p-2'>
                  <Link href='/explore-agents' className='block px-3 py-2 rounded-md hover:bg-white/10'>
                    Explore
                  </Link>
                  <Link href='/launch-agent' className='block px-3 py-2 rounded-md hover:bg-white/10'>
                    Launch
                  </Link>
                </div>
              )}
            </div>
            
            {/* Wallet Button */}
            
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

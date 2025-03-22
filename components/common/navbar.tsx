'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { FaBars, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppKitAccount } from '@reown/appkit/react';
import ConnectButton from '@/components/common/ConnectBtn';

const Navbar = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { address, isConnected } = useAppKitAccount();

  const handleHomeClick = () => {
    localStorage.removeItem('currentAgentId');
    localStorage.removeItem('currentAgentName');
    localStorage.removeItem('currentAgentImage');
    router.replace('/');
  };

  useEffect(() => {
    if (isConnected && address) {
      setWalletAddress(address);
      localStorage.setItem('walletAddress', address);
    } else {
      setWalletAddress(null);
      localStorage.removeItem('walletAddress');
    }

    // Trigger expansion animation after a delay
    const timer = setTimeout(() => {
      setIsExpanded(true);
    }, 1000); // 1 second delay before expansion

    return () => clearTimeout(timer);
  }, [isConnected, address]);

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/explore-agents', label: 'Explore Agents' },
    { path: '/launch-agent', label: 'Launch Agent' },
  ];

  const getNavItemClass = (path: string) => {
    const isActive = pathname === path;
    return `relative px-4 py-2 rounded-full transition-all duration-300 ${
      isActive
        ? 'text-white bg-gradient-to-r from-blue-600 to-blue-400 font-bold'
        : 'text-white hover:bg-white/10'
    }`;
  };

  const getMobileNavItemClass = (path: string) => {
    const isActive = pathname === path;
    return `px-4 py-2 rounded-full transition-all duration-300 ${
      isActive
        ? 'text-white bg-gradient-to-r from-blue-600 to-blue-400 font-bold'
        : 'text-white hover:bg-white/10'
    }`;
  };

  return (
    <motion.nav
      initial={{ width: '120px' }}
      animate={{
        width: isExpanded ? '90%' : '120px',
        transition: { duration: 0.8, ease: 'easeInOut' },
      }}
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-blue-500/10 via-transparent to-blue-900/50 shadow-lg lg:rounded-full md:rounded-full rounded-2xl px-2"
    >
      <div className="flex justify-between items-center">
        {/* Logo */}
        <div onClick={handleHomeClick} className="flex items-center cursor-pointer">
          <Image
            src="/CyreneAI_logo-text.png"
            alt="Cyrene AI"
            width={120}
            height={40}
            className="object-contain"
          />
        </div>

        {/* Desktop Navigation */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="hidden md:flex items-center space-x-4"
            >
              {navItems.map((item) => (
                <Link key={item.path} href={item.path} className={getNavItemClass(item.path)}>
                  {item.label}
                </Link>
              ))}
              <ConnectButton />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Menu Button */}
        <AnimatePresence>
          {isExpanded && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-white text-2xl md:hidden"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-gradient-to-r from-gray-800 via-gray-900 to-black py-4 rounded-2xl"
          >
            <div className="flex flex-col items-center space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={getMobileNavItemClass(item.path)}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <ConnectButton />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
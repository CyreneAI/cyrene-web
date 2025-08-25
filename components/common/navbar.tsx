'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { FaBars, FaTimes, FaRobot, FaGift, FaBriefcase, FaChevronDown, FaExchangeAlt, FaRocket } from 'react-icons/fa';

import { motion, AnimatePresence } from 'framer-motion';
import { useAppKitAccount } from '@reown/appkit/react';
import ConnectButton from '@/components/common/ConnectBtn';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { AuthButton } from './AuthButton';

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { address, isConnected } = useAppKitAccount();
  const [showDashboardDropdown, setShowDashboardDropdown] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [erebrusWallet, setErebrusWallet] = useState<string | null>(null);
  const [erebrusToken, setErebrusToken] = useState<string | null>(null);
  const [chainSymbol, setChainSymbol] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
 
  const handleHomeClick = () => {
    localStorage.removeItem('currentAgentId');
    localStorage.removeItem('currentAgentName');
    localStorage.removeItem('currentAgentImage');
    router.replace('/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDashboardDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Check for existing authentication
    const wallet = Cookies.get("erebrus_wallet");
    const token = Cookies.get("erebrus_token");
    const symbol = Cookies.get("Chain_symbol");
    
    if (wallet && token) {
      setIsAuthenticated(true);
      setErebrusWallet(wallet);
      setErebrusToken(token);
      setChainSymbol(symbol || null);
    }

    if (isConnected && address) {
      setWalletAddress(address);
      localStorage.setItem('walletAddress', address);
    } else {
      setWalletAddress(null);
      localStorage.removeItem('walletAddress');
    }

    const timer = setTimeout(() => {
      setIsExpanded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isConnected, address]);

  // Add this useEffect to watch for authentication changes
  useEffect(() => {
    // Check for existing authentication
    const checkAuth = () => {
      // Check all possible chain types
      const chains: ('solana' | 'evm')[] = ['solana', 'evm'];
      let isAuthFound = false;
      
      for (const chainType of chains) {
        const token = Cookies.get(`erebrus_token_${chainType}`);
        const wallet = Cookies.get(`erebrus_wallet_${chainType}`);
        const userId = Cookies.get(`erebrus_userid_${chainType}`);
        
        if (token && wallet) {
          setIsAuthenticated(true);
          setErebrusWallet(wallet);
          setErebrusToken(token);
          isAuthFound = true;
          break;
        }
      }
      
      if (!isAuthFound) {
        setIsAuthenticated(false);
        setErebrusWallet(null);
        setErebrusToken(null);
      }
    };
  
    checkAuth();
    
    const authCheckInterval = setInterval(checkAuth, 3000);
    
    return () => clearInterval(authCheckInterval);
  }, []);

  const navItems = [
    { path: '/', label: 'Home', protected: false },
    { path: '/explore-agents', label: 'Explore Agents', protected: false },
    // { path: '/launch-agent', label: 'Launch Agent', protected: true },
    { path: '/launch-projects', label: 'Launch Projects', protected: true }, // NEW ITEM
  ];

  const dashboardItems = [
    { 
      path: '/agents', 
      label: 'My Agents', 
      icon: <FaRobot className="w-4 h-4 mr-2" />,
      protected: true
    },
    { 
      path: '/perks', 
      label: 'Perks',  
      icon: <FaGift className="w-4 h-4 mr-2" />,
      protected: true
    },
    { 
      path: '/tokenbalances', 
      label: 'Assets',  
      icon: <FaBriefcase className="w-4 h-4 mr-2" />,
      protected: true
    },
    { 
      path: '/swap', 
      label: 'Trade',  
      icon: <FaExchangeAlt className="w-4 h-4 mr-2" />,
      protected: true
    },
  ];

  const getNavItemClass = (path: string, isProtected: boolean) => {
    const isActive = pathname === path;
    const baseClass = `relative px-4 py-2 rounded-full transition-all duration-300 ${
      isActive
        ? 'text-white bg-gradient-to-r from-blue-600 to-blue-400 font-bold'
        : 'text-white hover:bg-white/10'
    }`;
    
    return isProtected && !isAuthenticated 
      ? `${baseClass} opacity-50 cursor-not-allowed`
      : baseClass;
  };

  const getMobileNavItemClass = (path: string, isProtected: boolean) => {
    const isActive = pathname === path
    const baseClass = `px-4 py-2 rounded-full transition-all duration-300 ${
      isActive
        ? 'text-white bg-gradient-to-r from-blue-600 to-blue-400 font-bold'
        : 'text-white hover:bg-white/10'
    }`
    
    return isProtected && !isAuthenticated 
      ? `${baseClass} opacity-50 cursor-not-allowed`
      : baseClass
  }

  // Function to handle protected route clicks
  const handleProtectedRouteClick = (e: React.MouseEvent, isProtected: boolean) => {
    if (isProtected && !isAuthenticated) {
      e.preventDefault();
      toast.error('Authentication Required', {
        description: 'Please connect your wallet to access this page',
        position: 'top-center',
      });
    }
  };

  // Function to handle dashboard clicks
  const handleDashboardClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      toast.warning('Dashboard Access', {
        description: 'Please authenticate your wallet to view the dashboard',
        position: 'top-center',
      });
    } else {
      setIsMobileMenuOpen(false);
      setShowDashboardDropdown(false);
    }
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
              className="hidden md:flex items-center space-x-1"
            >
              {navItems.map((item) => (
                <Link 
                  key={item.path} 
                  href={item.protected && !isAuthenticated ? '#' : item.path}
                  className={getNavItemClass(item.path, item.protected)}
                  onClick={(e) => handleProtectedRouteClick(e, item.protected)}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* Dashboard Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDashboardDropdown(!showDashboardDropdown)}
                  className={`flex items-center px-4 py-2 rounded-full transition-all duration-300 ${
                    pathname.startsWith('/agents') || 
                    pathname.startsWith('/perks') || 
                    pathname.startsWith('/tokenbalances') ||
                    pathname.startsWith('/swap')
                      ? 'text-white bg-gradient-to-r from-blue-600 to-blue-400 font-bold'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Dashboard
                  <FaChevronDown className={`ml-2 transition-transform duration-200 ${showDashboardDropdown ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {showDashboardDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="absolute right-0 mt-2 w-56 origin-top-right bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-2xl z-50 border border-gray-700 overflow-hidden"
                    >
                      <div className="py-1">
                        {dashboardItems.map((item) => (
                          <Link
                            key={item.path}
                            href={isAuthenticated ? item.path : '#'}
                            className={`flex items-center px-4 py-3 text-sm ${
                              isAuthenticated 
                                ? 'text-white hover:bg-blue-500/30 transition-colors'
                                : 'text-gray-500 cursor-not-allowed'
                            } ${pathname === item.path ? 'bg-blue-500/30 text-white' : ''}`}
                            onClick={(e) => {
                              handleDashboardClick(e);
                              setShowDashboardDropdown(false);
                            }}
                          >
                            {item.icon}
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center space-x-2 ml-2">
                <ConnectButton />
                <AuthButton />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Menu Button */}
        <AnimatePresence>
          {isExpanded && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-white text-2xl md:hidden transition-colors p-2"
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
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden bg-gradient-to-r from-gray-800 via-gray-900 to-black py-4 rounded-2xl"
          >
            <div className="flex flex-col items-center space-y-4">
              {navItems.map((item) => (
                <Link 
                  key={item.path} 
                  href={item.protected && !isAuthenticated ? '#' : item.path}
                  className={getMobileNavItemClass(item.path, item.protected)}
                  onClick={(e) => handleProtectedRouteClick(e, item.protected)}
                >
                  {item.label}
                </Link>
              ))}

              <div className="w-full px-4">
                <div className="border-t border-gray-700 my-2"></div>
                <h3 className="text-white font-semibold px-4 py-2">Dashboard</h3>
                {dashboardItems.map((item) => (
                  <Link
                    key={item.path}
                    href={isAuthenticated ? item.path : '#'}
                    className={`flex items-center justify-center px-4 py-2 text-sm rounded-lg mx-2 mb-1 ${
                      isAuthenticated 
                        ? 'text-white hover:bg-blue-500/30 transition-colors'
                        : 'text-gray-500 cursor-not-allowed'
                    } ${
                      pathname === item.path ? 'bg-blue-500/30 text-white' : ''
                    }`}
                    onClick={(e) => handleDashboardClick(e)}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="w-full px-2 py-3 flex flex-col space-y-2">
                <ConnectButton />
                <AuthButton />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
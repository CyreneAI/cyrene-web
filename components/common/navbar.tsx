'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { FaBars, FaTimes, FaRobot, FaGift, FaBriefcase, FaChevronDown, FaExchangeAlt, FaRocket, FaSearch, FaEye } from 'react-icons/fa';

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
  const [showLaunchDropdown, setShowLaunchDropdown] = useState(false); // NEW - separate state for Launch
  const [showExploreDropdown, setShowExploreDropdown] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [erebrusWallet, setErebrusWallet] = useState<string | null>(null);
  const [erebrusToken, setErebrusToken] = useState<string | null>(null);
  const [chainSymbol, setChainSymbol] = useState<string | null>(null);
  const dashboardDropdownRef = useRef<HTMLDivElement>(null);
  const launchDropdownRef = useRef<HTMLDivElement>(null); // NEW - separate ref for Launch
  const exploreDropdownRef = useRef<HTMLDivElement>(null);
 
  const handleHomeClick = () => {
    localStorage.removeItem('currentAgentId');
    localStorage.removeItem('currentAgentName');
    localStorage.removeItem('currentAgentImage');
    router.replace('/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dashboardDropdownRef.current && !dashboardDropdownRef.current.contains(event.target as Node)) {
        setShowDashboardDropdown(false);
      }
      if (launchDropdownRef.current && !launchDropdownRef.current.contains(event.target as Node)) {
        setShowLaunchDropdown(false);
      }
      if (exploreDropdownRef.current && !exploreDropdownRef.current.contains(event.target as Node)) {
        setShowExploreDropdown(false);
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
    { path: '/', label: 'Home', protected: false }
  ];

  const launchItems = [
    {
      path: '/launch-agent',
      label: 'Launch Agents',
      protected: true
    },
    { 
      path: '/launch-projects', 
      label: 'Launch Projects', 
      protected: false
    },
  ];

  const exploreItems = [
    { 
      path: '/explore-agents', 
      label: 'Explore Agents', 
      icon: <FaRobot className="w-4 h-4 mr-2" />,
      protected: false
    },
    { 
      path: '/explore-projects', 
      label: 'Explore Projects', 
      icon: <FaRocket className="w-4 h-4 mr-2" />,
      protected: false
    },
  ];

  const dashboardItems = [
    { 
      path: '/agents', 
      label: 'Profile', 
      icon: <FaRobot className="w-4 h-4 mr-2" />,
      protected: false
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
    const baseClass = `font-outfit relative px-6 py-2.5 rounded-full transition-all duration-300 text-sm font-medium ${
      isActive
        ? 'text-white bg-white/20 backdrop-blur-md border border-white/30 shadow-lg'
        : 'text-white/90 hover:text-white hover:bg-white/10 hover:backdrop-blur-md'
    }`;
    
    return isProtected && !isAuthenticated 
      ? `${baseClass} opacity-50 cursor-not-allowed`
      : baseClass;
  };

  const getMobileNavItemClass = (path: string, isProtected: boolean) => {
    const isActive = pathname === path;
    const baseClass = `font-outfit px-6 py-3 rounded-full transition-all duration-300 text-sm font-medium ${
      isActive
        ? 'text-white bg-white/20 backdrop-blur-md border border-white/30'
        : 'text-white/90 hover:text-white hover:bg-white/10'
    }`;
    
    return isProtected && !isAuthenticated 
      ? `${baseClass} opacity-50 cursor-not-allowed`
      : baseClass;
  };

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

  // Function to handle explore clicks
  const handleExploreClick = (e: React.MouseEvent, isProtected: boolean) => {
    if (isProtected && !isAuthenticated) {
      e.preventDefault();
      toast.error('Authentication Required', {
        description: 'Please connect your wallet to access this page',
        position: 'top-center',
      });
    } else {
      setIsMobileMenuOpen(false);
      setShowExploreDropdown(false);
    }
  };

  return (
    <motion.nav
      initial={{ width: '80px' }}
      animate={{
        width: isExpanded ? '90%' : '80px',
        transition: { duration: 0.8, ease: 'easeInOut' },
      }}
      className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900/98 backdrop-blur-xl border border-white/20 shadow-2xl lg:rounded-3xl md:rounded-3xl rounded-3xl"
      style={{
        height: isExpanded ? 'auto' : '68px',
        minHeight: '68px'
      }}
    >
      <div className="flex justify-between items-center px-4 py-3">
        {/* Logo */}
        <div 
          onClick={handleHomeClick} 
          className="flex items-center cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800/50 flex items-center justify-center flex-shrink-0">
            <Image
              src="/CyreneAI_logo_square.png"
              alt="Cyrene AI Logo"
              width={28}
              height={28}
              className="object-contain"
            />
          </div>
          {isExpanded && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="ml-3 font-moonhouse text-xl font-bold text-white tracking-wide"
            >
              CYRENEAI
            </motion.span>
            

          )}
        </div>

        {/* Desktop Navigation */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="hidden md:flex items-center space-x-2"
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

              {/* Launch Dropdown */}
              <div className="relative" ref={launchDropdownRef}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowLaunchDropdown(!showLaunchDropdown)}
                  className={`font-outfit flex items-center px-6 py-2.5 rounded-full transition-all duration-300 text-sm font-medium ${
                    pathname.startsWith('/launch-agents') ||    
                    pathname.startsWith('/launch-projects')
                      ? 'text-white bg-white/20 backdrop-blur-md border border-white/30 shadow-lg'
                      : 'text-white/90 hover:text-white hover:bg-white/10 hover:backdrop-blur-md'
                  }`}
                >
                  Launch
                  <FaChevronDown className={`ml-2 w-3 h-3 transition-transform duration-200 ${showLaunchDropdown ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {showLaunchDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="absolute right-0 mt-3 w-56 origin-top-right bg-gray-900 backdrop-blur-xl rounded-2xl shadow-2xl z-50 border border-white/20 overflow-hidden"
                    >
                      <div className="py-2">
                        {launchItems.map((item) => (
                          <Link
                            key={item.path}
                            href={item.protected && !isAuthenticated ? '#' : item.path}
                            className={`font-outfit flex items-center px-4 py-3 text-sm font-medium ${
                              item.protected && !isAuthenticated
                                ? 'text-white/40 cursor-not-allowed'
                                : 'text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200'
                            } ${pathname === item.path ? 'bg-white/15 text-white' : ''}`}
                            onClick={(e) => {
                              handleProtectedRouteClick(e, item.protected);
                              setShowLaunchDropdown(false);
                            }}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Explore Dropdown */}
              <div className="relative" ref={exploreDropdownRef}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowExploreDropdown(!showExploreDropdown)}
                  className={`font-outfit flex items-center px-6 py-2.5 rounded-full transition-all duration-300 text-sm font-medium ${
                    pathname.startsWith('/explore-agents') || 
                    pathname.startsWith('/explore-projects')
                      ? 'text-white bg-white/20 backdrop-blur-md border border-white/30 shadow-lg'
                      : 'text-white/90 hover:text-white hover:bg-white/10 hover:backdrop-blur-md'
                  }`}
                >
                  Explore
                  <FaChevronDown className={`ml-2 w-3 h-3 transition-transform duration-200 ${showExploreDropdown ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {showExploreDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="absolute right-0 mt-3 w-56 origin-top-right bg-gray-900 backdrop-blur-xl rounded-2xl shadow-2xl z-50 border border-white/20 overflow-hidden"
                    >
                      <div className="py-2">
                        {exploreItems.map((item) => (
                          <Link
                            key={item.path}
                            href={item.path}
                            className={`font-outfit flex items-center px-4 py-3 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200 ${
                              pathname === item.path ? 'bg-white/15 text-white' : ''
                            }`}
                            onClick={(e) => {
                              handleExploreClick(e, item.protected);
                              setShowExploreDropdown(false);
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

              
              {/* Dashboard Dropdown */}
              <div className="relative" ref={dashboardDropdownRef}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDashboardDropdown(!showDashboardDropdown)}
                  className={`font-outfit flex items-center px-6 py-2.5 rounded-full transition-all duration-300 text-sm font-medium ${
                    pathname.startsWith('/agents') || 
                    pathname.startsWith('/perks') || 
                    pathname.startsWith('/tokenbalances') ||
                    pathname.startsWith('/swap')
                      ? 'text-white bg-white/20 backdrop-blur-md border border-white/30 shadow-lg'
                      : 'text-white/90 hover:text-white hover:bg-white/10 hover:backdrop-blur-md'
                  }`}
                >
                  Dashboard
                  <FaChevronDown className={`ml-2 w-3 h-3 transition-transform duration-200 ${showDashboardDropdown ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {showDashboardDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="absolute right-0 mt-3 w-56 origin-top-right bg-gray-900 backdrop-blur-xl rounded-2xl shadow-2xl z-50 border border-white/20 overflow-hidden"
                    >
                      <div className="py-2">
                        {dashboardItems.map((item) => (
                          <Link
                            key={item.path}
                            href={isAuthenticated ? item.path : '#'}
                            className={`font-outfit flex items-center px-4 py-3 text-sm font-medium ${
                              isAuthenticated 
                                ? 'text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200'
                                : 'text-white/40 cursor-not-allowed'
                            } ${pathname === item.path ? 'bg-white/15 text-white' : ''}`}
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

              <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-white/20">
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
              className="text-white/90 hover:text-white text-2xl md:hidden transition-colors p-2"
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
            className="md:hidden bg-gray-900/98 backdrop-blur-xl border-t border-white/20 py-6 rounded-b-3xl"
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

              <div className='w-full px-4'>
                <div className="border-t border-white/20 my-4"></div>
                <h3 className="font-outfit text-white/90 font-semibold px-4 py-2 text-center">Launch</h3>
                {launchItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.protected && !isAuthenticated ? '#' : item.path}
                    className={`font-outfit flex items-center justify-center px-6 py-3 text-sm font-medium rounded-xl mx-2 mb-2 ${
                      item.protected && !isAuthenticated
                        ? 'text-white/40 cursor-not-allowed'
                        : 'text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200'
                    } ${pathname === item.path ? 'bg-white/15 text-white' : ''}`}
                    onClick={(e) => handleProtectedRouteClick(e, item.protected)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="w-full px-4">
                <div className="border-t border-white/20 my-4"></div>
                <h3 className="font-outfit text-white/90 font-semibold px-4 py-2 text-center">Explore</h3>
                {exploreItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`font-outfit flex items-center justify-center px-6 py-3 text-sm font-medium rounded-xl mx-2 mb-2 text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200 ${
                      pathname === item.path ? 'bg-white/15 text-white' : ''
                    }`}
                    onClick={(e) => handleExploreClick(e, item.protected)}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="w-full px-4">
                <div className="border-t border-white/20 my-4"></div>
                <h3 className="font-outfit text-white/90 font-semibold px-4 py-2 text-center">Dashboard</h3>
                {dashboardItems.map((item) => (
                  <Link
                    key={item.path}
                    href={isAuthenticated ? item.path : '#'}
                    className={`font-outfit flex items-center justify-center px-6 py-3 text-sm font-medium rounded-xl mx-2 mb-2 ${
                      isAuthenticated 
                        ? 'text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200'
                        : 'text-white/40 cursor-not-allowed'
                    } ${
                      pathname === item.path ? 'bg-white/15 text-white' : ''
                    }`}
                    onClick={(e) => handleDashboardClick(e)}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="w-full px-4 py-4 border-t border-white/20 flex flex-col space-y-3">
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
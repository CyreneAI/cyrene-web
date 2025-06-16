'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { FaBars, FaTimes, FaUserCog, FaRobot, FaImages, FaGem, FaGift, FaCheckCircle, FaBriefcase } from 'react-icons/fa';
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
 
  const handleHomeClick = () => {
    localStorage.removeItem('currentAgentId');
    localStorage.removeItem('currentAgentName');
    localStorage.removeItem('currentAgentImage');
    router.replace('/');
  };

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
    { path: '/launch-agent', label: 'Launch Agent', protected: true },
  ];

  const dashboardItems = [
    { 
      path: '/agents', 
      label: 'My Agents', 
      icon: <FaRobot className="mr-2" />,
      protected: true
    },
    { 
      path: '/perks', 
      label: 'Perks',  
      icon: <FaGift className="mr-2" />,
      protected: true
    },
    { 
      path: '/tokenbalances', 
      label: 'Assets',  
      icon: <FaBriefcase className="mr-2" />,
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
      
      // Use the toast notification
      toast.error('Authentication Required', {
        description: 'Please connect your wallet to access this page',
        // action: {
        //   label: 'Connect',
        //   onClick: () => <ConnectButton />,
        // },
        position: 'top-center',
        duration: 5000,
      });
    }
  };

  // Function to handle dashboard clicks
  const handleDashboardClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      
      toast.warning('Dashboard Access', {
        description: 'Please authenticate your wallet to view the dashboard',
        // action: {
        //   label: 'Authenticate',
        //   onClick: () => <ConnectButton />,
        // },
        position: 'top-center',
        duration: 5000,
      });
    } else {
      setIsMobileMenuOpen(false);
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
            className="hidden md:flex items-center space-x-4"
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
            <div className="relative">
              <button
                onClick={() => setShowDashboardDropdown(!showDashboardDropdown)}
                className={`flex items-center px-4 py-2 rounded-full transition-all duration-300 ${
                  pathname.startsWith('/dashboard')
                    ? 'text-white bg-gradient-to-r from-blue-600 to-blue-400 font-bold'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Dashboard
              </button>

              <AnimatePresence>
                {showDashboardDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-56 origin-top-right bg-gray-800 rounded-lg shadow-lg z-50"
                  >
                    <div className="py-1">
                      {dashboardItems.map((item) => (
                        <Link
                          key={item.path}
                          href={isAuthenticated ? item.path : '#'}
                          className={`flex items-center px-4 py-2 ${
                            isAuthenticated 
                              ? 'text-white hover:bg-blue-500/30 transition-colors'
                              : 'text-gray-500 cursor-not-allowed'
                          }`}
                          onClick={handleDashboardClick}
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

            {/* Authentication Status */}
            {/* {isAuthenticated && (
              <div className="flex items-center space-x-2 bg-green-500/20 px-3 py-1 rounded-full">
                <FaCheckCircle className="text-green-400" />
                <span className="text-sm text-white">Authenticated</span>
                {erebrusWallet && (
                  <span className="text-xs bg-gray-700 px-2 py-1 rounded-full">
                    {erebrusWallet.substring(0, 6)}...{erebrusWallet.substring(erebrusWallet.length - 4)}
                  </span>
                )}
                {chainSymbol && (
                  <span className="text-xs bg-blue-500 px-2 py-1 rounded-full">
                    {chainSymbol}
                  </span>
                )}
              </div>
            )} */}

            <ConnectButton />
            <AuthButton />
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
                    className={`flex items-center px-4 py-2 ${
                      isAuthenticated 
                        ? 'text-white hover:bg-blue-500/30 transition-colors'
                        : 'text-gray-500 cursor-not-allowed'
                    }`}
                    onClick={(e) => {
                      if (!isAuthenticated) {
                        handleDashboardClick(e);
                      } else {
                        setIsMobileMenuOpen(false);
                      }
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* Mobile Authentication Status */}
              {/* {isAuthenticated && (
                <div className="flex flex-col items-center space-y-2 bg-green-500/20 px-4 py-2 rounded-lg w-11/12">
                  <div className="flex items-center space-x-2">
                    <FaCheckCircle className="text-green-400" />
                    <span className="text-sm text-white">Authenticated</span>
                  </div>
                  {erebrusWallet && (
                    <span className="text-xs bg-gray-700 px-2 py-1 rounded-full">
                      {erebrusWallet.substring(0, 6)}...{erebrusWallet.substring(erebrusWallet.length - 4)}
                    </span>
                  )}
                  {chainSymbol && (
                    <span className="text-xs bg-blue-500 px-2 py-1 rounded-full">
                      Chain: {chainSymbol}
                    </span>
                  )}
                </div>
              )} */}

              <ConnectButton />
              <AuthButton />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
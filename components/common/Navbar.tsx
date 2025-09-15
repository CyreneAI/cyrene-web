'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { FaBars, FaTimes, FaRobot, FaGift, FaBriefcase, FaChevronDown, FaExchangeAlt, FaRocket, FaSearch, FaEye } from 'react-icons/fa';

import { motion, AnimatePresence } from 'framer-motion';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import ConnectButton from '@/components/common/ConnectBtn';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { AuthButton } from './AuthButton';
import { useWalletAuth } from '@/context/appkit';

// Add Connection and PublicKey imports for Solana
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { address, isConnected } = useAppKitAccount();
  const { open } = useAppKit();
  const { isAuthenticated } = useWalletAuth();
  const [showDashboardDropdown, setShowDashboardDropdown] = useState(false);
  const [showLaunchDropdown, setShowLaunchDropdown] = useState(false);
  const [showExploreDropdown, setShowExploreDropdown] = useState(false);
  const [solBalance, setSolBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const dashboardDropdownRef = useRef<HTMLDivElement>(null);
  const launchDropdownRef = useRef<HTMLDivElement>(null);
  const exploreDropdownRef = useRef<HTMLDivElement>(null);

  // Initialize Solana connection
  const connection = useMemo(() => new Connection(
    `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`,
    "confirmed"
  ), []);

  // Function to fetch SOL balance
  const fetchSolBalance = useCallback(async (walletAddress: string) => {
    try {
      setIsLoadingBalance(true);
      const publicKey = new PublicKey(walletAddress);
      const balance = await connection.getBalance(publicKey);
      const solBalance = balance / LAMPORTS_PER_SOL;
      setSolBalance(solBalance);
    } catch (error) {
      console.error('Error fetching SOL balance:', error);
      setSolBalance(0);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [connection]);

  useEffect(() => {
    if (isConnected && address) {
      localStorage.setItem('walletAddress', address);
      // Fetch balance when wallet connects or address changes
      fetchSolBalance(address);
    } else {
      localStorage.removeItem('walletAddress');
      setSolBalance(0);
      // Clear any cached wallet state
      localStorage.removeItem('currentAgentId');
      localStorage.removeItem('currentAgentName');
      localStorage.removeItem('currentAgentImage');
    }
  }, [isConnected, address, fetchSolBalance]);

  // Periodically update balance every 30 seconds when connected
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isConnected && address && isAuthenticated) {
      intervalId = setInterval(() => {
        fetchSolBalance(address);
      }, 30000); // Update every 30 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isConnected, address, isAuthenticated, fetchSolBalance]);

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

  const handleHomeClick = () => {
    localStorage.removeItem('currentAgentId');
    localStorage.removeItem('currentAgentName');
    localStorage.removeItem('currentAgentImage');
    router.replace('/');
  };

  const handleDashboardClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      toast.warning('Dashboard Access', {
        description: 'Please authenticate your wallet to view the dashboard',
        position: 'top-center',
      });
    } else {
      setShowDashboardDropdown(false);
    }
  };

  // Launch button click handler
  const handleLaunchClick = (e: React.MouseEvent, path: string, isProtected: boolean = false) => {
    if (isProtected && !isAuthenticated) {
      e.preventDefault();
      toast.error('Authentication Required', {
        description: 'Please connect your wallet to launch agents',
        position: 'top-center',
      });
    } else {
      setShowLaunchDropdown(false);
      router.push(path);
    }
  };

  // Format balance display
  const formatBalance = (balance: number) => {
    if (isLoadingBalance) return '...';
    if (balance === 0) return '0.000';
    if (balance < 0.001) return '<0.001';
    return balance.toFixed(3);
  };

  return (
    <header role="banner" className="fixed z-50 top-3 lg:top-6 xl:top-[50px] left-0 right-0">
      <div
        className="
          w-[calc(100%-24px)] lg:w-[calc(100%-48px)] xl:w-full max-w-[1200px] h-[60px] lg:h-[80px]
          mx-auto overflow-visible
          rounded-[20px] lg:rounded-[40px]
          backdrop-blur-[70px]
          px-4 lg:px-8
          flex items-center justify-between
          shadow-[0_8px_28px_rgba(6,17,54,0.35)]
        "
        style={{ backgroundColor: "rgba(47,55,85,0.5)" }}
      >
        {/* Brand */}
        <div className="flex items-center" onClick={handleHomeClick} style={{ cursor: 'pointer' }}>
          <div className="flex">
            <span
              style={{ fontFamily: '"Moonhouse", var(--font-sans, ui-sans-serif)' }}
              className="uppercase tracking-[0.3em] md:tracking-[0.4em] font-semibold leading-none select-none text-[14px] md:text-base"
            >
              <span className="text-[#ffffff]">CYRENE</span><span className="text-[#4D84EE]">AI</span>
            </span>
          </div>
        </div>

  {/* Divider + Links (desktop) */}
  <div className="hidden lg:flex items-center gap-8 flex-1 mx-4 min-w-0">
          <div className="flex-1 h-px border-t border-dashed border-[#4D84EE]/60 min-w-[60px]" />
          <nav className="flex items-center gap-6 whitespace-nowrap">
            <Link 
              href="/" 
              className={`text-lg font-medium hover:opacity-80 transition ${
                pathname === '/' ? 'text-[#4D84EE]' : 'text-white'
              }`}
            >
              Home
            </Link>
            
            {/* Launch Dropdown */}
            <div className="relative" ref={launchDropdownRef}>
              <button
                onClick={() => setShowLaunchDropdown(!showLaunchDropdown)}
                className={`text-lg font-medium hover:opacity-80 transition flex items-center gap-2 ${
                  pathname.startsWith('/launch-agent') || 
                  pathname.startsWith('/launch-projects')
                    ? 'text-[#4D84EE]'
                    : 'text-white'
                }`}
              >
                Launch
                <FaChevronDown className={`w-3 h-3 transition-transform duration-200 ${showLaunchDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showLaunchDropdown && (
                <div className="absolute right-0 mt-3 w-56 bg-[#2F3755] rounded-xl shadow-2xl z-50 border border-[#4D84EE]/20 overflow-hidden">
                  <div className="py-2">
                    <button
                      onClick={(e) => handleLaunchClick(e, '/launch-agent', true)}
                      className="w-full flex items-center px-4 py-2 text-sm text-white hover:bg-[#4D84EE]/10 transition-all text-left"
                    >
                      <FaRobot className="w-4 h-4 mr-2" />
                      Agents
                    </button>
                    <button
                      onClick={(e) => handleLaunchClick(e, '/launch-projects', false)}
                      className="w-full flex items-center px-4 py-2 text-sm text-white hover:bg-[#4D84EE]/10 transition-all text-left"
                    >
                      <FaRocket className="w-4 h-4 mr-2" />
                      Projects
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Explore Dropdown */}
            <div className="relative" ref={exploreDropdownRef}>
              <button
                onClick={() => setShowExploreDropdown(!showExploreDropdown)}
                className={`text-lg font-medium hover:opacity-80 transition flex items-center gap-2 ${
                  pathname.startsWith('/explore-agents') || 
                  pathname.startsWith('/explore-projects') ||
                  pathname.startsWith('/trends') ||
                  pathname.startsWith('/users')
                    ? 'text-[#4D84EE]'
                    : 'text-white'
                }`}
              >
                Explore
                <FaChevronDown className={`w-3 h-3 transition-transform duration-200 ${showExploreDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showExploreDropdown && (
                <div className="absolute right-0 mt-3 w-56 bg-[#2F3755] rounded-xl shadow-2xl z-50 border border-[#4D84EE]/20 overflow-hidden">
                  <div className="py-2">
                    <Link
                      href="/explore-agents"
                      className="flex items-center px-4 py-2 text-sm text-white hover:bg-[#4D84EE]/10 transition-all"
                      onClick={() => setShowExploreDropdown(false)}
                    >
                      <FaRobot className="w-4 h-4 mr-2" />
                      Agents
                    </Link>
                    <Link
                      href="/explore-projects"
                      className="flex items-center px-4 py-2 text-sm text-white hover:bg-[#4D84EE]/10 transition-all"
                      onClick={() => setShowExploreDropdown(false)}
                    >
                      <FaRocket className="w-4 h-4 mr-2" />
                      Projects
                    </Link>
                    <Link
                      href="/trends"
                      className="flex items-center px-4 py-2 text-sm text-white hover:bg-[#4D84EE]/10 transition-all"
                      onClick={() => setShowExploreDropdown(false)}
                    >
                      <FaSearch className="w-4 h-4 mr-2" />
                      Trends
                    </Link>
                    <Link
                      href="/users"
                      className="flex items-center px-4 py-2 text-sm text-white hover:bg-[#4D84EE]/10 transition-all"
                      onClick={() => setShowExploreDropdown(false)}
                    >
                      <FaRocket className="w-4 h-4 mr-2" />
                      Community
                    </Link>
                  </div>
                </div>
              )}
            </div>
            {/* Dashboard Dropdown */}
            <div className="relative" ref={dashboardDropdownRef}>
              <button
                onClick={() => setShowDashboardDropdown(!showDashboardDropdown)}
                className={`text-lg font-medium hover:opacity-80 transition flex items-center gap-2 ${
                  pathname.startsWith('/agents') || 
                  pathname.startsWith('/perks') || 
                  pathname.startsWith('/tokenbalances') ||
                  pathname.startsWith('/swap')
                    ? 'text-[#4D84EE]'
                    : 'text-white'
                }`}
              >
                Dashboard
                <FaChevronDown className={`w-3 h-3 transition-transform duration-200 ${showDashboardDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showDashboardDropdown && (
                <div className="absolute right-0 mt-3 w-56 bg-[#2F3755] rounded-xl shadow-2xl z-50 border border-[#4D84EE]/20 overflow-hidden">
                  <div className="py-2">
                    <Link
                      href={isAuthenticated ? '/agents' : '#'}
                      className="flex items-center px-4 py-2 text-sm text-white hover:bg-[#4D84EE]/10 transition-all"
                      onClick={handleDashboardClick}
                    >
                      {/* <Link
                      href={'/agents'}
                      className="flex items-center px-4 py-2 text-sm text-white hover:bg-[#4D84EE]/10 transition-all"
                     
                    ></Link> */}
                      <FaRobot className="w-4 h-4 mr-2" />
                      My Profile
                    </Link>
                    {/* <Link
                      href={isAuthenticated ? '/perks' : '#'}
                      className="flex items-center px-4 py-2 text-sm text-white hover:bg-[#4D84EE]/10 transition-all"
                      onClick={handleDashboardClick}F
                    >
                      <FaGift className="w-4 h-4 mr-2" />
                      Perks
                    </Link> */}
                    <Link
                      href={isAuthenticated ? '/tokenbalances' : '#'}
                      className="flex items-center px-4 py-2 text-sm text-white hover:bg-[#4D84EE]/10 transition-all"
                      onClick={handleDashboardClick}
                    >
                      <FaBriefcase className="w-4 h-4 mr-2" />
                      Assets
                    </Link>
                    <Link
                      href={isAuthenticated ? '/swap' : '#'}
                      className="flex items-center px-4 py-2 text-sm text-white hover:bg-[#4D84EE]/10 transition-all"
                      onClick={handleDashboardClick}
                    >
                      <FaExchangeAlt className="w-4 h-4 mr-2" />
                      Swap
                    </Link>
                    {/* <Link
                      href="/trade"
                      className="flex items-center px-4 py-2 text-sm text-white hover:bg-[#4D84EE]/10 transition-all"
                      onClick={() => setShowDashboardDropdown(false)}
                    >
                      <FaExchangeAlt className="w-4 h-4 mr-2" />
                      Trade
                    </Link> */}
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

  {/* Wallet Pill and Connect/Verify Buttons (desktop) */}
  <div className="hidden lg:flex items-center gap-3 ml-4">
          {/* Wallet pill if connected and authenticated */}
          {isConnected && isAuthenticated && address && (
            <div
              className="flex items-center bg-[#232B4A] rounded-full px-4 py-2 gap-2 text-white text-sm font-medium shadow-inner min-w-0 cursor-pointer hover:bg-[#2A3360]/90 transition-colors"
              title="Open account"
              onClick={() => open()}
            >
             <div className="w-6 h-6 bg-gradient-to-r from-[#4D84EE] to-[#6366f1] rounded-full flex items-center justify-center">
  <svg width="12" height="12" viewBox="0 0 397.7 311.7" fill="currentColor" className="text-white">
    <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 237.9z"/>
    <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1L333.1 73.8c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z"/>
    <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z"/>
  </svg>
</div>
              <span className="font-mono truncate max-w-[100px]">{address.slice(0, 4)}...{address.slice(-4)}</span>
              <span className="ml-1 text-xs text-[#4D84EE] whitespace-nowrap">
                {formatBalance(solBalance)} SOL
              </span>
            </div>
          )}

          {/* Show Verify button if connected but not authenticated */}
          {isConnected && !isAuthenticated && (
            <>
              <AuthButton />
              <button
                onClick={() => open()}
                className="inline-flex rounded-full px-4 py-2 h-11 border border-[#4D84EE]/40 text-white/90 hover:text-white hover:bg-[#4D84EE]/10 transition-colors text-sm"
                title="Open account"
              >
                Account
              </button>
            </>
          )}
          
          {/* Show ConnectButton if not connected */}
          {!isConnected && <ConnectButton />}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="lg:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu panel */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="lg:hidden mx-3 mt-2 rounded-2xl border border-[#4D84EE]/20 bg-[#2F3755]/90 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-white/10">
              <Link
                href="/"
                className={`block py-2 text-base font-medium ${pathname === '/' ? 'text-[#4D84EE]' : 'text-white'} hover:opacity-80`}
                onClick={() => setMobileOpen(false)}
              >
                Home
              </Link>
            </div>

            {/* Explore */}
            <div className="px-4 py-3 border-b border-white/10">
              <div className="text-xs uppercase tracking-widest text-white/60 mb-2">Explore</div>
              <Link href="/explore-agents" className="block py-2 text-white hover:opacity-80" onClick={() => setMobileOpen(false)}>
                Explore Agents
              </Link>
              <Link href="/explore-projects" className="block py-2 text-white hover:opacity-80" onClick={() => setMobileOpen(false)}>
                Explore Projects
              </Link>
            </div>

            {/* Launch */}
            <div className="px-4 py-3 border-b border-white/10">
              <div className="text-xs uppercase tracking-widest text-white/60 mb-2">Launch</div>
              <button
                className="block w-full text-left py-2 text-white hover:opacity-80"
                onClick={(e) => {
                  handleLaunchClick(e as unknown as React.MouseEvent, '/launch-agent', true);
                  setMobileOpen(false);
                }}
              >
                Launch Agents
              </button>
              <button
                className="block w-full text-left py-2 text-white hover:opacity-80"
                onClick={(e) => {
                  handleLaunchClick(e as unknown as React.MouseEvent, '/launch-projects', false);
                  setMobileOpen(false);
                }}
              >
                Launch Projects
              </button>
            </div>

            {/* Dashboard */}
            <div className="px-4 py-3 border-b border-white/10">
              <div className="text-xs uppercase tracking-widest text-white/60 mb-2">Dashboard</div>
              <Link href={isAuthenticated ? '/agents' : '#'} className="block py-2 text-white hover:opacity-80" onClick={(e) => { handleDashboardClick(e as unknown as React.MouseEvent); setMobileOpen(false); }}>
               Profile
              </Link>
              <Link href={isAuthenticated ? '/perks' : '#'} className="block py-2 text-white hover:opacity-80" onClick={(e) => { handleDashboardClick(e as unknown as React.MouseEvent); setMobileOpen(false); }}>
                Perks
              </Link>
              <Link href={isAuthenticated ? '/tokenbalances' : '#'} className="block py-2 text-white hover:opacity-80" onClick={(e) => { handleDashboardClick(e as unknown as React.MouseEvent); setMobileOpen(false); }}>
                Assets
              </Link>
              <Link href={isAuthenticated ? '/swap' : '#'} className="block py-2 text-white hover:opacity-80" onClick={(e) => { handleDashboardClick(e as unknown as React.MouseEvent); setMobileOpen(false); }}>
                Swap
              </Link>
              <Link href="/trade" className="block py-2 text-white hover:opacity-80" onClick={() => setMobileOpen(false)}>
                Trade
              </Link>
            </div>

            {/* Wallet section */}
            <div className="px-4 py-4">
              {isConnected && isAuthenticated && address ? (
                <div
                  className="flex items-center justify-between bg-[#232B4A] rounded-xl px-4 py-3 text-white text-sm font-medium shadow-inner"
                  onClick={() => { open(); setMobileOpen(false); }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 bg-gradient-to-r from-[#4D84EE] to-[#6366f1] rounded-full flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 397.7 311.7" fill="currentColor" className="text-white">
                        <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 237.9z"/>
                        <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1L333.1 73.8c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z"/>
                        <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7 4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z"/>
                      </svg>
                    </div>
                    <span className="font-mono truncate max-w-[120px]">{address.slice(0, 4)}...{address.slice(-4)}</span>
                  </div>
                  <span className="ml-3 text-xs text-[#4D84EE] whitespace-nowrap">{formatBalance(solBalance)} SOL</span>
                </div>
              ) : isConnected && !isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <AuthButton />
                  <button
                    onClick={() => { open(); setMobileOpen(false); }}
                    className="rounded-full px-4 py-2 h-11 border border-[#4D84EE]/40 text-white/90 hover:text-white hover:bg-[#4D84EE]/10 transition-colors text-sm"
                    title="Open account"
                  >
                    Account
                  </button>
                </div>
              ) : (
                <div className="flex">
                  <ConnectButton />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
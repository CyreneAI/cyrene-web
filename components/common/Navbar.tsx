'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppKitAccount } from '@reown/appkit/react';
import ConnectButton from '@/components/common/ConnectBtn';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { AuthButton } from './AuthButton';
import { FaChevronDown, FaRobot, FaRocket, FaGift, FaBriefcase, FaExchangeAlt, FaWallet } from 'react-icons/fa';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { address, isConnected } = useAppKitAccount();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [erebrusWallet, setErebrusWallet] = useState<string | null>(null);
  const [erebrusToken, setErebrusToken] = useState<string | null>(null);
  const [showDashboardDropdown, setShowDashboardDropdown] = useState(false);
  const [showExploreDropdown, setShowExploreDropdown] = useState(false);
  const dashboardDropdownRef = useRef<HTMLDivElement>(null);
  const exploreDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for existing authentication
    const wallet = Cookies.get("erebrus_wallet");
    const token = Cookies.get("erebrus_token");
    
    if (wallet && token) {
      setIsAuthenticated(true);
      setErebrusWallet(wallet);
      setErebrusToken(token);
    }

    if (isConnected && address) {
      localStorage.setItem('walletAddress', address);
    } else {
      localStorage.removeItem('walletAddress');
    }
  }, [isConnected, address]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dashboardDropdownRef.current && !dashboardDropdownRef.current.contains(event.target as Node)) {
        setShowDashboardDropdown(false);
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

  return (
    <header role="banner" className="fixed top-[69px] left-1/2 -translate-x-1/2 z-50">
      <div
        className="
          w-[1000px] h-[80px]
          rounded-[40px]
          backdrop-blur-[70px]
          px-10
          flex items-center justify-between
          shadow-[0_8px_28px_rgba(6,17,54,0.35)]
        "
        style={{ backgroundColor: "rgba(47,55,85,0.5)" }}
      >
        {/* Brand */}
        <div className="flex items-center" onClick={handleHomeClick}>
          <div className="flex">
            <span
              style={{ fontFamily: '"Moonhouse", var(--font-sans, ui-sans-serif)' }}
              className="text-[#ffffff] uppercase tracking-[0.4em] font-semibold leading-none select-none"
            >
              CYRENE
            </span>
            <span
              style={{ fontFamily: '"Moonhouse", var(--font-sans, ui-sans-serif)' }}
              className="text-[#4D84EE] uppercase tracking-[0.4em] font-semibold leading-none select-none"
            >
              AI
            </span>
          </div>
        </div>

        {/* Divider + Links */}
        <div className="flex items-center gap-12 flex-1 mx-6">
          <div className="flex-1 h-px border-t border-dashed border-[#4D84EE]/60" />
          <nav className="flex items-center gap-8">
            <Link 
              href="/" 
              className={`text-lg font-medium hover:opacity-80 transition ${
                pathname === '/' ? 'text-[#4D84EE]' : 'text-white'
              }`}
            >
              Home
            </Link>
            
            {/* Explore Dropdown */}
            <div className="relative" ref={exploreDropdownRef}>
              <button
                onClick={() => setShowExploreDropdown(!showExploreDropdown)}
                className={`text-lg font-medium hover:opacity-80 transition flex items-center gap-2 ${
                  pathname.startsWith('/explore-agents') || 
                  pathname.startsWith('/explore-projects')
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
                      Explore Agents
                    </Link>
                    <Link
                      href="/explore-projects"
                      className="flex items-center px-4 py-2 text-sm text-white hover:bg-[#4D84EE]/10 transition-all"
                      onClick={() => setShowExploreDropdown(false)}
                    >
                      <FaRocket className="w-4 h-4 mr-2" />
                      Explore Projects
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
                      <FaRobot className="w-4 h-4 mr-2" />
                      My Agents
                    </Link>
                    <Link
                      href={isAuthenticated ? '/perks' : '#'}
                      className="flex items-center px-4 py-2 text-sm text-white hover:bg-[#4D84EE]/10 transition-all"
                      onClick={handleDashboardClick}
                    >
                      <FaGift className="w-4 h-4 mr-2" />
                      Perks
                    </Link>
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
                      Trade
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Launch Button */}
        <Link
          href="#"
          aria-label="Launch"
          className="
            inline-flex items-center
            bg-white text-[#2C3C70]
            rounded-[30px]
            px-6 py-2.5
            gap-3
            h-11
            shadow-[0_4px_18px_rgba(47,55,85,0.25)]
            hover:opacity-90 transition-opacity
          "
        >
          <span className="text-base font-semibold leading-none">Launch</span>
          <span className="flex items-center justify-center">
            <img src="/wallet-add.png" alt="Launch Icon" className="h-5 w-5" />
          </span>
        </Link>
      </div>
    </header>
  );
}

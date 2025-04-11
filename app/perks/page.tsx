'use client';

import { useState, useEffect } from 'react';
import { useAppKitAccount } from "@reown/appkit/react";
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import StarCanvas from '@/components/StarCanvas';
import ConnectButton from '@/components/common/ConnectBtn';

interface PerkAttribute {
  trait_type: string;
  value: string;
}

interface PerkPreview {
  name: string;
  description: string;
  image: string;
  benefits?: string[];
  attributes: PerkAttribute[];
}

interface Perk {
  id: number;
  title: string;
  description: string;
  icon: string;
  action: string;
  color: string;
  route?: string;
  disabled?: boolean;
  preview?: PerkPreview;
  unlocked?: boolean;
}

export default function PerksPage() {
  const router = useRouter();
  const { isConnected } = useAppKitAccount();
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPerk, setSelectedPerk] = useState<Perk | null>(null);
  const [perks, setPerks] = useState<Perk[]>([]);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [activeTab, setActiveTab] = useState('all');

  // Initialize perks
  useEffect(() => {
    const initialPerks: Perk[] = [
      {
        id: 1,
        title: "Erebrus Subscription",
        description: "1 week free access to premium VPN features",
        icon: "shield",
        action: "Claim Now",
        color: "#6366F1",
        route: "/subscription",
        unlocked: true,
        preview: {
          name: "Erebrus Subscription",
          description: "This Soulbound NFT gives you access to premium VPN features for 1 week. Experience enhanced security, privacy, and unrestricted internet access.",
          image: "/Erebrus_free-trial_active.png",
          benefits: [
            "No bandwidth restrictions",
            "Access to all global nodes",
            "Priority customer support",
            "Ad-free experience"
          ],
          attributes: [
            {"trait_type": "Type", "value": "Subscription"},
            {"trait_type": "Duration", "value": "7 days"},
            {"trait_type": "Status", "value": "Active"}
          ]
        }
      },
      {
        id: 2,
        title: "Governance Rights",
        description: "Vote on platform proposals and decisions",
        icon: "vote",
        action: "Lock Tokens",
        color: "#10B981",
        unlocked: false
      },
      {
        id: 3,
        title: "Premium Support",
        description: "Priority access to technical support team",
        icon: "headset",
        action: "Upgrade",
        color: "#3B82F6",
        unlocked: false
      },
      {
        id: 4,
        title: "Early Access",
        description: "Test new features before public release",
        icon: "rocket",
        action: "Join Waitlist",
        color: "#F59E0B",
        unlocked: false
      },
      {
        id: 5,
        title: "Exclusive Content",
        description: "Access to private tutorials and resources",
        icon: "book",
        action: "Subscribe",
        color: "#8B5CF6",
        unlocked: false
      },
      {
        id: 6,
        title: "VIP Community",
        description: "Join our private Discord channels",
        icon: "discord",
        action: "Connect",
        color: "#6366F1",
        unlocked: false
      }
    ];
    
    setPerks(initialPerks);
    setUnlockedCount(initialPerks.filter(p => p.unlocked).length);
  }, []);

  const handlePerkClick = (perk: Perk) => {
    if (perk.disabled) return;
    
    if (perk.preview) {
      setSelectedPerk(perk);
      setShowPreview(true);
    } else if (perk.route) {
      router.push(perk.route);
    }
  };

  const handleConfirm = () => {
    setShowPreview(false);
    if (selectedPerk?.route) {
      router.push(selectedPerk.route);
    }
  };

  const handleUnlockPerk = (perkId: number) => {
    setPerks(prevPerks => 
      prevPerks.map(perk => 
        perk.id === perkId ? { ...perk, unlocked: true } : perk
      )
    );
    setUnlockedCount(prev => prev + 1);
  };

  const filteredPerks = activeTab === 'unlocked' 
    ? perks.filter(perk => perk.unlocked)
    : activeTab === 'locked'
    ? perks.filter(perk => !perk.unlocked)
    : perks;

  const getIconComponent = (iconName: string) => {
    switch(iconName) {
      case 'shield':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'vote':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6m6-6v12m-3-6h6" />
          </svg>
        );
      case 'headset':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        );
      case 'rocket':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'book':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'discord':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
        );
      default:
        return <span className="text-xl">{iconName}</span>;
    }
  };

  return (
    <>
      <StarCanvas />
      <div className="min-h-screen bg-transparent py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-white mb-2 mt-20">Member Perks</h1>
            <p className="text-gray-400 max-w-3xl">
              Unlock exclusive benefits with your NetSepio membership
            </p>
            
            {/* Progress and Filters */}
            <div className="mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-1 w-full sm:w-auto">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-400">
                    {unlockedCount} of {perks.length} perks unlocked
                  </span>
                  <span className="text-sm font-medium text-gray-400">
                    {Math.round((unlockedCount / perks.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${(unlockedCount / perks.length) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex space-x-2 bg-gray-800 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'all' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  All Perks
                </button>
                <button
                  onClick={() => setActiveTab('unlocked')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'unlocked' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  Unlocked
                </button>
                <button
                  onClick={() => setActiveTab('locked')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'locked' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  Locked
                </button>
              </div>
            </div>
          </div>

          {!isConnected ? (
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl border border-gray-700 p-8 text-center max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h2>
              <p className="text-gray-400 mb-6">
                Connect your wallet to view and claim your exclusive perks
              </p>
              {/* <button className="">
                Connect Wallet
              </button> */}
              <div className='px-24 py-3 ml-4'>
  <ConnectButton/>
</div>
              
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPerks.map((perk) => (
                <div 
                  key={perk.id}
                  className={`bg-gray-800/50 backdrop-blur-lg rounded-xl border ${perk.unlocked ? 'border-indigo-500/30' : 'border-gray-700'} p-6 flex flex-col transition-all hover:shadow-lg hover:shadow-indigo-500/10 ${perk.disabled ? 'opacity-70' : 'cursor-pointer'}`}
                  onClick={() => handlePerkClick(perk)}
                >
                  {/* Icon with gradient background */}
                  <div 
                    className={`w-12 h-12 mb-4 flex items-center justify-center rounded-lg ${perk.unlocked ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gray-700'}`}
                  >
                    {getIconComponent(perk.icon)}
                  </div>
                  
                  {/* Title and status */}
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-white">{perk.title}</h3>
                    {perk.unlocked ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-900 text-indigo-200">
                        Unlocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                        Locked
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-400 mb-6 flex-grow">{perk.description}</p>
                  
                  <div className="mt-auto">
                    {perk.unlocked ? (
                      <button
                        className={`w-full px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg text-white font-medium transition-all hover:opacity-90`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (perk.route) router.push(perk.route);
                        }}
                      >
                        Access Now
                      </button>
                    ) : (
                      <button
                        disabled={perk.disabled}
                        className={`w-full px-4 py-2.5 ${perk.disabled ? 'bg-gray-700 text-gray-500' : 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white'} rounded-lg font-medium transition-all`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!perk.disabled) handleUnlockPerk(perk.id);
                        }}
                      >
                        {perk.action}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && selectedPerk && selectedPerk.preview && (
        
  <>

  <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
    <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
      {/* Modal Header */}
      <div className="p-6 border-b border-gray-700 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white">{selectedPerk.preview.name}</h2>
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-900/50 text-indigo-200 border border-indigo-700">
            {selectedPerk.unlocked ? 'Unlocked' : 'Locked'}
          </div>
        </div>
        <button
          onClick={() => setShowPreview(false)}
          className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Scrollable Content */}
      <div className="overflow-y-auto flex-1 p-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Image Column */}
          <div className="w-full lg:w-1/2">
                  <div className="relative aspect-square bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
                    <Image
                      src={selectedPerk.preview.image}
                      alt={selectedPerk.preview.name}
                      fill
                      className="object-contain p-4"
                    />
                  </div>
                </div>
          
          {/* Content Column */}
          <div className="w-full lg:w-1/2 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">About This Perk</h3>
              <p className="text-gray-300 leading-relaxed">{selectedPerk.preview.description}</p>
            </div>
            
            {selectedPerk.preview.benefits && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Key Benefits</h3>
                <ul className="space-y-3">
                  {selectedPerk.preview.benefits.map((benefit: string, index: number) => (
                    <li key={index} className="flex items-start text-gray-300">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center">
                          <svg className="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <span className="ml-3">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Details</h3>
              <div className="grid grid-cols-2 gap-3">
                {selectedPerk.preview.attributes.map((attr: PerkAttribute, index: number) => (
                  <div
                    key={index}
                    className="bg-gray-700/50 rounded-lg p-3 border border-gray-600"
                  >
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">{attr.trait_type}</div>
                    <div className="text-sm font-medium text-white mt-1">{attr.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal Footer */}
      <div className="p-6 border-t border-gray-700 bg-gray-800/50">
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={() => setShowPreview(false)}
            className="px-6 py-3 border border-gray-600 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex-1 sm:flex-none"
          >
            Back to Perks
          </button>
          <button
            onClick={handleConfirm}
            className={`px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg text-white font-medium hover:opacity-90 transition-opacity flex-1 sm:flex-none`}
          >
            {selectedPerk.unlocked ? 'Access Now' : 'Claim Perk'}
          </button>
        </div>
      </div>
    </div>
  </div></>
)}
    </>
  );
}
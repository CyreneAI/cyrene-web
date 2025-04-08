'use client';

import { useState } from 'react';
import { useAppKitAccount } from "@reown/appkit/react";
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import StarCanvas from '@/components/StarCanvas';

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
}

const perks: Perk[] = [
  {
    id: 1,
    title: "Erebrus Subscription",
    description: "Get 1 week of free access to Erebrus premium features",
    icon: "🔑",
    action: "Get Subscription",
    color: "from-purple-500 to-indigo-600",
    route: "/subscription",
    preview: {
      name: "Erebrus Subscription",
      description: "This Soulbound NFT signifies your dedication to a decentralized digital future. By connecting with an Erebrus Node, you contribute to a censorship-free internet and support a global movement advocating for privacy, security, and freedom. Together, we are breaking down barriers of surveillance and censorship, fostering a fair and decentralized digital world. Thank you for being part of this transformative journey.",
      image: "/Erebrus_free-trial_active.png",
      benefits: [
        "1 week free access to premium features",
        "Enhanced security and privacy",
        "Priority customer support",
        "Early access to new features"
      ],
      attributes: [
        {"trait_type": "name", "value": "Erebrus"},
        {"trait_type": "status", "value": "active"},
        {"trait_type": "duration", "value": "7 days"}
      ]
    }
  },
  {
    id: 2,
    title: "Exclusive Content",
    description: "Access members-only tutorials and resources",
    icon: "⭐",
    action: "Coming Soon",
    color: "from-blue-500 to-cyan-600",
    disabled: true
  },
  {
    id: 3,
    title: "VIP Community",
    description: "Join our private Discord community",
    icon: "👥",
    action: "Coming Soon",
    color: "from-green-500 to-emerald-600",
    disabled: true
  },
  {
    id: 4,
    title: "Early Access",
    description: "Be the first to try new features",
    icon: "🚀",
    action: "Coming Soon",
    color: "from-yellow-500 to-amber-600",
    disabled: true
  },
  {
    id: 5,
    title: "Premium Support",
    description: "Get priority customer support",
    icon: "🚀",
    action: "Coming Soon",
    color: "from-red-500 to-pink-600",
    disabled: true
  },
  {
    id: 6,
    title: "Custom Profile",
    description: "Personalize your NetSepio profile",
    icon: "👥",
    action: "Coming Soon",
    color: "from-indigo-500 to-blue-600",
    disabled: true
  },
  {
    id: 7,
    title: "Governance Rights",
    description: "Vote on platform decisions",
    icon: "🗳️",
    action: "Coming Soon",
    color: "from-teal-500 to-green-600",
    disabled: true
  },
  {
    id: 8,
    title: "Exclusive Events",
    description: "Access to private AMAs and workshops",
    icon: "🎁",
    action: "Coming Soon",
    color: "from-orange-500 to-red-600",
    disabled: true
  },
  {
    id: 9,
    title: "Beta Features",
    description: "Test experimental features before launch",
    icon: "🛎️",
    action: "Coming Soon",
    color: "from-pink-500 to-rose-600",
    disabled: true
  }
];

export default function PerksPage() {
  const router = useRouter();
  const { isConnected } = useAppKitAccount();
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPerk, setSelectedPerk] = useState<Perk | null>(null);

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

  return (
    <>
      <StarCanvas/>
      <div className="min-h-screen bg-transparent py-16 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-4">
              Your Exclusive Perks
            </h1>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Unlock special benefits with your NetSepio membership
            </p>
          </div>

          {!isConnected ? (
            <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-8 text-center max-w-md mx-auto">
              <div className="w-32 h-32 mx-auto bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-blue-400"
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
              <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
              <p className="text-gray-300 mb-6">
                Please connect your wallet to view and manage your perks
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {perks.map((perk) => (
                <div 
                  key={perk.id}
                  className={`bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-lg rounded-xl border border-white/10 p-6 flex flex-col transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-${perk.color.split(' ')[1]}/20 ${perk.disabled ? 'opacity-70' : 'hover:border-white/30 cursor-pointer'}`}
                  onClick={() => handlePerkClick(perk)}
                >
                  <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-lg bg-gradient-to-br from-white/10 to-white/5">
                    <span className="text-3xl">{perk.icon}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{perk.title}</h3>
                  <p className="text-gray-300 mb-6 flex-grow">{perk.description}</p>
                  
                  <button
                    disabled={perk.disabled}
                    className={`px-4 py-2 bg-gradient-to-r ${perk.color} rounded-lg text-white font-medium disabled:opacity-50 transition-all hover:opacity-90`}
                  >
                    {perk.action}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Preview Modal */}
      {showPreview && selectedPerk && selectedPerk.preview && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 max-w-4xl w-full overflow-hidden backdrop-blur-xl shadow-2xl">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                  {selectedPerk.preview.name}
                </h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex flex-col lg:flex-row gap-8">
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
                
                <div className="w-full lg:w-1/2 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                    <p className="text-gray-300">{selectedPerk.preview.description}</p>
                  </div>
                  
                  {selectedPerk.preview.benefits && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Key Benefits</h3>
                      <ul className="space-y-2">
                        {selectedPerk.preview.benefits.map((benefit: string, index: number) => (
                          <li key={index} className="flex items-start text-gray-300">
                            <svg className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">NFT Attributes</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedPerk.preview.attributes.map((attr: PerkAttribute, index: number) => (
                        <div
                          key={index}
                          className="bg-white/5 rounded-lg p-3 border border-white/10"
                        >
                          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">{attr.trait_type}</div>
                          <div className="text-sm font-medium text-white mt-1">{attr.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-3 border border-gray-600 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Back to Perks
                </button>
                <button
                  onClick={handleConfirm}
                  className={`px-6 py-3 bg-gradient-to-r ${selectedPerk.color} rounded-lg text-white font-medium hover:opacity-90 transition-opacity`}
                >
                  Claim Your Subscription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
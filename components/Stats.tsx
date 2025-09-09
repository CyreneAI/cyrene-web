import MagicBento from './MagicBento'
import React from 'react'

export default function Stats() {
  // Custom card data for the Cyrene website
  const customCardData = [
    {
      color: '#0A122E',
  title: 'AI Agents, Your Launch Partners',
  description: 'Fundraise, iterate, and build long-term aligned projects with the power of AI Agents.',
      label: 'Self-Replicating AI'
    },
    {
      color: '#18285C',
  title: 'Authentic Communities',
  description: 'Grow and engage with communities that share your vision and values.',
      label: 'Universal Scalability Layer'
    },
    {
      color: '#2C3C70',
  title: 'Internet Capital Markets',
  description: 'A new financial frontier where projects and ideas are funded, traded, and scaled globally.',
      label: 'Unstoppable Ecosystem'
    },
    {
      color: '#17224A',
      title: 'Decentralized Infrastructure',
      description: 'AI agents and MCP servers are hosted on Erebrus DVPN Nodes for secure and verifiable execution.',
      label: 'Decentralized Infrastructure'
    },
    {
      color: '#2C3C70',
      title: 'Towards Digital, Agentic Future',
  description: 'Multi-agent platform and AI coordination layer on NetSepio\'s secure and decentralized network.',
      label: 'Towards Digital, Agentic Future'
    },
    {
      color: '#0A122E',
      title: 'Universal Scalability Layer',
      description: 'Cross-chain, adaptive, and seamlessly integrative.',
      label: 'Universal Scalability Layer'
    }
  ];

  return (
    <main className="min-h-screen flex items-center justify-center p-6 font-outfit bg-transparent">
      <div className="w-full max-w-6xl">
        <div className="w-full relative backdrop-blur-[6px] rounded-[30px] bg-white/10 border border-white/10 shadow-2xl">
          <div className="flex justify-center items-center p-[22px]">
            {/* Using the MagicBento component with custom properties */}
            <MagicBento 
              textAutoHide={true}
              enableStars={true}
              enableSpotlight={true}
              enableBorderGlow={true}
              enableTilt={true}
              enableMagnetism={true}
              clickEffect={true}
              spotlightRadius={300}
              particleCount={12}
              glowColor="132, 0, 255"
              customCardData={customCardData}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
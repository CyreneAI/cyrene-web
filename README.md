
<p align="center">
  <img src="https://cyreneai.com/CyreneAI_logo-text.png" alt="CyreneAI Logo" width="400"/>
</p>

<p align="center">
  <strong>Decentralized AI Agents powered by Web3 Identity, Zero Trust Access, and Secure Infrastructure</strong>
</p>

<p align="center">
  <a href="https://cyreneai.com"><img src="https://img.shields.io/badge/Website-CyreneAI-blue" alt="Website"></a>
  <a href="https://docs.netsepio.com/latest/cyreneai"><img src="https://img.shields.io/badge/Docs-NetSepio-green" alt="Documentation"></a>
  <a href="https://x.com/CyreneAI"><img src="https://img.shields.io/badge/Twitter-@CyreneAI-1DA1F2" alt="Twitter"></a>
  <a href="https://github.com/Abhishekk24/cyrene-web/"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="License"></a>
</p>

## 🌟 Overview

CyreneAI is a cutting-edge platform for building, deploying, and interacting with decentralized AI agents. Our architecture leverages Web3 wallets, decentralized identity, and the Erebrus Gateway by NetSepio to provide unparalleled security and access control. With CyreneAI, users can create AI agents that operate within a zero-trust environment while maintaining full composability.

## 🔑 Core Capabilities

- **Wallet-Based Authentication** - Seamless login with EVM & Solana wallets
- **Decentralized Identity** - Full ownership of your AI agents and data
- **Enterprise-Grade Security** - End-to-end protection with zero-trust principles
- **Cross-Chain Compatibility** - Support for Ethereum, Solana, Rise, Base, Arbitrum, and Monad
- **Customizable Agents** - Build AI assistants with tailored knowledge and capabilities

## ⚙️ Key Technologies

### 🛰️ Astro Node
Astro Node provides containerized, tamper-proof execution environments for AI agents:
- **Deterministic Execution** - Consistent, verifiable agent behavior
- **Isolated Runtime** - Secure sandboxing for each agent instance
- **Composable Architecture** - Stack and combine agent capabilities

### 🔁 DeCompute Engine
Our specialized off-chain computation layer for sensitive AI operations:
- **Private Inference** - Process data without exposing sensitive information
- **Distributed Memory** - Persistent, secure storage for agent state
- **Verified Computation** - Tamper-evident processing with cryptographic proofs

### 🔐 Erebrus Gateway
NetSepio's security gateway that enables:
- **Zero-Trust Access Control** - Granular permissions for agents and users
- **Signature Verification** - Cryptographic authentication of all requests
- **Cross-Chain Identity** - Unified identity across multiple blockchains

## 🚀 Getting Started

### Prerequisites
- Node.js 16.x or higher
- Git
- EVM or Solana wallet (Metamask, Phantom, etc.)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Abhishekk24/cyrene-web
cd cyrene-web
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Configure environment**
Create a `.env.local` file in the root directory:
```
NEXT_PUBLIC_REOWN_PROJECT_ID=your_project_id
NEXT_PUBLIC_EREBRUS_GATEWAY_URL=https://gateway.netsepio.com
```

4. **Start development server**
```bash
npm run dev
# or
yarn dev
```
Visit http://localhost:3000 to see your local instance.

## 📂 Project Structure
```
cyrene-web/
├── app/                         # App Router pages
│   ├── launch-agent/           # Create AI Agent page
│   ├── dashboard/              # Agent management dashboard
│   └── page.tsx                # Homepage
│
├── components/                 # Shared UI components
│   ├── AgentCard.tsx
│   └── WalletConnectButton.tsx
│
├── lib/                        # Gateway and Reown logic
│   ├── netsepio.ts             # Erebrus integration
│   └── reown.ts                # Reown AppKit setup
│
├── hooks/                      # Custom hooks for auth, agents
├── styles/                     # Tailwind/global styles
├── public/                     # Static assets (logos, icons)
└── README.md
```

## 🔄 Authentication Flow

1. User connects their Web3 wallet through Reown AppKit
2. Wallet generates cryptographic signature for authentication
3. Erebrus Gateway validates signature and issues access token
4. Token enables secure interaction with CyreneAI agents

## 🛠️ Building Your First Agent

1. Connect your wallet on the CyreneAI dashboard
2. Navigate to "Launch Agent" section
3. Configure agent parameters:
   - Name and description
   - Knowledge base and capabilities
   - Access permissions and chain selection
4. Deploy your agent to Astro Node
5. Interact with your agent via API or dashboard

For detailed instructions, visit our [Agent Building Guide](https://docs.netsepio.com/latest/cyreneai/agents).

## 🗺️ Roadmap

| Timeline | Milestone |
|----------|-----------|
| Q2 2025  | Enhanced Agent Memory & Persistent Learning |
| Q3 2025  | NFT-Based Agent Identity & Ownership |
| Q3 2025  | Multi-Chain Agent Marketplace |
| Q4 2025  | Extended Platform Integrations (Telegram, Discord) |
| Q1 2026  | Enterprise-Grade Agent Deployment Tools |

## 🤝 Contributing

We welcome contributions from the community! To contribute:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows our style guidelines and includes appropriate tests.

## 📚 Resources

- [Official Documentation](https://docs.netsepio.com/latest/cyreneai)
- [Erebrus Gateway Docs](https://docs.netsepio.com/latest/erebrus)
- [Reown AppKit](https://docs.reown.xyz/appkit)
- [NetSepio Console](https://console.netsepio.com)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

<p align="center">
  <img src="https://cyreneai.com/CyreneAI_logo-text.png" alt="CyreneAI Universe" width="600"/>
  <br>
  <em>Decentralizing AI, One Agent at a Time</em>
</p>

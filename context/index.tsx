// 'use client'

// import { wagmiAdapter, projectId } from '@/config'
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import { createAppKit } from '@reown/appkit/react'
// import { mainnet, arbitrum , base , solana } from '@reown/appkit/networks'
// import React, { type ReactNode } from 'react'
// import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'

// // Set up queryClient
// const queryClient = new QueryClient()

// if (!projectId) {
//   throw new Error('Project ID is not defined')
// }

// // Set up metadata
// const metadata = {
//   name: 'CyreneAI',
//   description: "Powering the future of AI interaction through multi-agent collaboration with self-replicating, decentralized agents. Launch agents, engage with Cyrene, and unlock new frontiers in AI, technology, and consciousness.",
//   url: 'https://cyreneai.com/',
//   icons: ['https://cyreneai.com/CyreneAI_logo-text.png']
// }

// // Create the modal
// const modal = createAppKit({
//   adapters: [wagmiAdapter],
//   projectId,
//   networks: [solana , mainnet, arbitrum, base],
//   defaultNetwork: solana,
//   metadata: metadata,
//   features: {
//     analytics: true // Optional - defaults to your Cloud configuration
//   }
// })

// function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
//   const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

//   return (
//     <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
//       <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
//     </WagmiProvider>
//   )
// }

// export default ContextProvider
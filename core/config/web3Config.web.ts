/**
 * Reown AppKit configuration for web.
 * Sets up WalletConnect with Ethers adapter for Rootstock mainnet.
 *
 * This file is only loaded on web (via .web.ts resolution).
 * On native platforms, wallet management is handled locally.
 */
import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import type { AppKitNetwork } from '@reown/appkit/networks';

// Custom Rootstock mainnet definition
export const rootstock: AppKitNetwork = {
    id: 30,
    name: 'Rootstock',
    nativeCurrency: {
        name: 'Smart Bitcoin',
        symbol: 'RBTC',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: [
                process.env.EXPO_PUBLIC_RSK_RPC_API_URL || 'https://public-node.rsk.co',
            ],
        },
    },
    blockExplorers: {
        default: {
            name: 'RSK Explorer',
            url: 'https://explorer.rsk.co',
        },
    },
};

// Project ID from Reown Dashboard (https://dashboard.reown.com)
// Public projectId for localhost testing only — replace with your own for production
const projectId = process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID || 'b56e18d47c72ab683b10814fe9495694';

// Metadata for the WalletConnect modal
const metadata = {
    name: 'Parallel Society',
    description: 'Decentralized Governance on Rootstock',
    url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8081',
    icons: ['/assets/parallel_society_logo.jpg'],
};

// Initialize AppKit with Ethers adapter (compatible with existing ethers v6)
const appKit = createAppKit({
    adapters: [new EthersAdapter()],
    networks: [rootstock],
    projectId,
    metadata,
    features: {
        analytics: true,
    },
});

export { appKit };
export default appKit;

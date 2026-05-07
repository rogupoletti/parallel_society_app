/**
 * Hook for interacting with externally connected wallets via Reown AppKit.
 * Web-only — on native platforms, wallet management is handled locally.
 *
 * Provides: connect, disconnect, signMessage, getSigner
 * Uses AppKit hooks + ethers BrowserProvider for contract interaction.
 */
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { BrowserProvider } from 'ethers';
import type { Provider } from '@reown/appkit/react';

export interface WalletConnectState {
    /** Connected wallet address (checksummed) */
    address: string | undefined;
    /** Whether a wallet is currently connected */
    isConnected: boolean;
    /** Open the AppKit connection modal */
    connect: () => void;
    /** Disconnect the current wallet */
    disconnect: () => void;
    /** Get an ethers Signer from the connected wallet */
    getSigner: () => Promise<import('ethers').JsonRpcSigner>;
    /** Sign a plain text message with the connected wallet */
    signMessage: (message: string) => Promise<string>;
    /** Sign EIP-712 typed data with the connected wallet */
    signTypedData: (
        domain: import('ethers').TypedDataDomain,
        types: Record<string, import('ethers').TypedDataField[]>,
        value: Record<string, unknown>
    ) => Promise<string>;
}

export function useWalletConnect(): WalletConnectState {
    const { open, close } = useAppKit();
    const { address, isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider<Provider>('eip155');

    const connect = () => {
        open();
    };

    const disconnect = () => {
        close();
    };

    /**
     * Creates an ethers BrowserProvider + Signer from the connected wallet.
     * This allows using the connected wallet for contract interactions
     * the same way as with a local ethers.Wallet.
     */
    const getSigner = async () => {
        if (!walletProvider) {
            throw new Error('No wallet connected. Please connect a wallet first.');
        }
        const provider = new BrowserProvider(walletProvider);
        return provider.getSigner();
    };

    /**
     * Signs a plain text message using the connected wallet.
     * Used for authentication (nonce signing).
     */
    const signMessage = async (message: string): Promise<string> => {
        const signer = await getSigner();
        return signer.signMessage(message);
    };

    /**
     * Signs EIP-712 typed data using the connected wallet.
     * Used for governance votes and proposal creation.
     */
    const signTypedData = async (
        domain: import('ethers').TypedDataDomain,
        types: Record<string, import('ethers').TypedDataField[]>,
        value: Record<string, unknown>
    ): Promise<string> => {
        const signer = await getSigner();
        return signer.signTypedData(domain, types, value);
    };

    return {
        address,
        isConnected,
        connect,
        disconnect,
        getSigner,
        signMessage,
        signTypedData,
    };
}

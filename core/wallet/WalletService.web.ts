import { ethers } from 'ethers';

export interface WalletAccount {
    address: string;
    privateKey: string;
    mnemonic?: string;
}

/**
 * Web fallback for WalletService.
 * Uses window.crypto.getRandomValues() instead of expo-crypto.
 * Note: On web, wallet generation is typically not needed since users
 * connect external wallets via WalletConnect. This fallback exists
 * for API compatibility.
 */
export class WalletService {
    /**
     * Generates a new random 24-word mnemonic.
     * Uses 256 bits of entropy from Web Crypto API.
     */
    static generateMnemonic(): string[] {
        const entropy = new Uint8Array(32);
        window.crypto.getRandomValues(entropy);
        const mnemonic = ethers.Mnemonic.fromEntropy(entropy);
        return mnemonic.phrase.split(' ');
    }

    /**
     * Imports a wallet from a mnemonic phrase.
     * @param words The mnemonic phrase as an array of words.
     * @throws Error if the mnemonic is invalid.
     */
    static importMnemonic(words: string[]): WalletAccount {
        const phrase = words.join(' ');
        const wallet = ethers.Wallet.fromPhrase(phrase);

        return {
            address: wallet.address,
            privateKey: wallet.privateKey,
            mnemonic: phrase
        };
    }

    /**
     * Derives the address from a mnemonic.
     * @param mnemonic The mnemonic phrase.
     */
    static deriveAddress(mnemonic: string): string {
        const wallet = ethers.Wallet.fromPhrase(mnemonic);
        return wallet.address;
    }
}

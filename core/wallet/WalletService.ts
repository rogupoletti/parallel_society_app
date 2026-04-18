import * as Crypto from 'expo-crypto';
import { ethers } from 'ethers';

export interface WalletAccount {
    address: string;
    privateKey: string;
    mnemonic?: string;
}

export class WalletService {
    /**
     * Generates a new random 24-word mnemonic.
     * Uses 256 bits of entropy.
     */
    static generateMnemonic(): string[] {
        const entropy = Crypto.getRandomBytes(32);
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
        // ethers.Wallet.fromPhrase validates the mnemonic and uses default path m/44'/60'/0'/0/0
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

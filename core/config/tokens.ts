/**
 * Token configuration for supported assets
 */

import { ethers } from 'ethers';

export interface TokenConfig {
    symbol: string;
    decimals: number;
    isNative: boolean;
    address?: string;
}

// Use lowercase address - ethers.getAddress() will convert to proper checksum
const LUT_CONTRACT_ADDRESS = ethers.getAddress('0x4dd73b9a98f401fb3c53df33a9e05bea1419eb5e');

export const TOKENS: Record<'RBTC' | 'LUT', TokenConfig> = {
    RBTC: {
        symbol: 'RBTC',
        decimals: 18,
        isNative: true
    },
    LUT: {
        symbol: 'LUT',
        decimals: 18,
        address: LUT_CONTRACT_ADDRESS,
        isNative: false
    }
};

export type TokenSymbol = keyof typeof TOKENS;


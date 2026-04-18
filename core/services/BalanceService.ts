import { ethers } from 'ethers';
import { TOKENS, TokenSymbol } from '../config/tokens';
import { TokenBalance } from '../types/TokenBalance';
import { ROOTSTOCK } from '../config/RootstockConfig';

// ERC-20 ABI for balanceOf
const ERC20_ABI = [
    'function balanceOf(address owner) view returns (uint256)'
];

/**
 * Environment flag to enable/disable mocked balances
 * Set EXPO_PUBLIC_USE_MOCK_BALANCES=true in .env file for development
 * Set EXPO_PUBLIC_USE_MOCK_BALANCES=false for production/real RPC calls
 */
const useMockBalances = process.env.EXPO_PUBLIC_USE_MOCK_BALANCES === 'true';

// Mock balances for development
const MOCK_BALANCES: Record<TokenSymbol, string> = {
    RBTC: '1250750000000000000',    // 1.25075 RBTC
    LUT: '15750000000000000000000'  // 15,750 LUT
};

/**
 * Service for fetching token balances
 */
export class BalanceService {
    private provider: ethers.JsonRpcProvider;

    constructor(rpcUrl?: string) {
        // Use the authenticated RPC URL from config as default
        const defaultUrl = ROOTSTOCK.RPC_URL;
        this.provider = new ethers.JsonRpcProvider(rpcUrl || defaultUrl);
    }

    getProvider(): ethers.JsonRpcProvider {
        return this.provider;
    }

    /**
     * Formats a raw balance (in wei) to a human-readable string
     * @param rawBalance Raw balance in wei
     * @param decimals Token decimals
     * @returns Formatted balance string (e.g., "1,250.75")
     */
    private formatBalance(rawBalance: string, decimals: number): string {
        const formatted = ethers.formatUnits(rawBalance, decimals);
        const num = parseFloat(formatted);

        // Format with thousand separators and max 6 decimal places
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
        });
    }

    /**
     * Fetches the native RBTC balance for an address
     * @param address Wallet address
     * @returns TokenBalance object
     */
    async fetchNativeBalance(address: string): Promise<TokenBalance> {
        let rawBalance: string;

        if (useMockBalances) {
            rawBalance = MOCK_BALANCES.RBTC;
        } else {
            const balance = await this.provider.getBalance(address);
            rawBalance = balance.toString();
        }

        return {
            symbol: 'RBTC',
            raw: rawBalance,
            formatted: this.formatBalance(rawBalance, TOKENS.RBTC.decimals)
        };
    }

    /**
     * Fetches an ERC-20 token balance for an address
     * @param address Wallet address
     * @param contractAddress Token contract address
     * @param symbol Token symbol
     * @returns TokenBalance object
     */
    async fetchTokenBalance(
        address: string,
        contractAddress: string,
        symbol: 'LUT'
    ): Promise<TokenBalance> {
        let rawBalance: string;

        if (useMockBalances) {
            rawBalance = MOCK_BALANCES[symbol];
        } else {
            const contract = new ethers.Contract(
                contractAddress,
                ERC20_ABI,
                this.provider
            );
            const balance = await contract.balanceOf(address);
            rawBalance = balance.toString();
        }

        const tokenConfig = TOKENS[symbol];
        return {
            symbol,
            raw: rawBalance,
            formatted: this.formatBalance(rawBalance, tokenConfig.decimals)
        };
    }

    /**
     * Fetches all supported token balances for an address
     * @param address Wallet address
     * @returns Object with RBTC and LUT balances
     */
    async fetchAllBalances(address: string): Promise<{
        RBTC: TokenBalance;
        LUT: TokenBalance;
    }> {
        const [rbtc, lut] = await Promise.all([
            this.fetchNativeBalance(address),
            this.fetchTokenBalance(address, TOKENS.LUT.address!, 'LUT')
        ]);

        return { RBTC: rbtc, LUT: lut };
    }
}

// Singleton instance for convenience
export const balanceService = new BalanceService();

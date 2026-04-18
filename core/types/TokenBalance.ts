/**
 * Token balance data structure
 */
export interface TokenBalance {
    symbol: 'RBTC' | 'LUT';
    raw: string;      // Raw balance in wei (string to avoid precision issues)
    formatted: string; // Human-readable formatted balance
}

export interface WalletBalances {
    RBTC: TokenBalance | null;
    LUT: TokenBalance | null;
}

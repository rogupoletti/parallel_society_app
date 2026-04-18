export type TxDirection = 'in' | 'out' | 'contract';

export type TxStatus = 'pending' | 'confirmed' | 'failed';

export interface WalletTx {
    hash: string;
    token: 'RBTC' | 'LUT';
    direction: TxDirection;
    title: string;            // For UI, e.g., "Received RBTC", "Transferred to @user"
    from: string;
    to: string;
    amount: string;           // formatted, e.g., "150.00"
    rawAmount: string;        // bigint string
    timestamp: number;        // unix timestamp (milliseconds)
    status: TxStatus;
    usdValue?: string;        // Optional USD value string, e.g., "$225.00"
    fee?: string;             // Optional gas fee
}

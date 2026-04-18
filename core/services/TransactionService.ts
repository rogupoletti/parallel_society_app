import { WalletTx } from '../types/Transaction';
import { blockscoutService } from './BlockscoutService';

/**
 * Service for fetching transaction history
 */
export class TransactionService {
    /**
     * getTransactions fetches history from Blockscout
     * @param address User's wallet address
     * @returns Array of WalletTx
     */
    async getTransactions(address: string): Promise<WalletTx[]> {
        try {
            const [rbtcHistory, lutHistory] = await Promise.all([
                blockscoutService.fetchRbtcTransactions(address),
                blockscoutService.fetchLutTransactions(address)
            ]);

            const allTransactions = [...rbtcHistory, ...lutHistory];

            // De-duplicate by hash (just in case)
            const seenHashes = new Set();
            const uniqueTransactions = allTransactions.filter(tx => {
                if (seenHashes.has(tx.hash)) return false;
                seenHashes.add(tx.hash);
                return true;
            });

            // Sort by timestamp descending
            return uniqueTransactions.sort((a, b) => b.timestamp - a.timestamp);

        } catch (error) {
            console.error('Error fetching transactions:', error);
            // In a real production app, we might fallback to cached data here
            // For now, return empty array or bubble error
            return [];
        }
    }

    /**
     * Gets a single transaction by hash
     * @param hash Transaction hash
     */
    async getTransaction(hash: string): Promise<WalletTx | undefined> {
        // Not implemented for Blockscout specifically in this scope,
        // relying on list data. Could directly fetch tx detail if needed.
        return undefined;
    }
}

export const transactionService = new TransactionService();

import { WalletTx, TxDirection, TxStatus } from '../types/Transaction';
import { BlockscoutResponse, BlockscoutTx, BlockscoutTokenTx } from '../types/Blockscout';
import { ethers } from 'ethers';
import { TOKENS } from '../config/tokens';

const BASE_URL = 'https://rootstock.blockscout.com/api';
// Using public endpoint, no API key needed for basic usage, but kept as placeholder
const API_KEY = process.env.EXPO_PUBLIC_BLOCKSCOUT_API_KEY;

export class BlockscoutService {

    private async fetch<T>(params: Record<string, string>): Promise<T[]> {
        try {
            const queryParams = new URLSearchParams(params);
            if (API_KEY) {
                queryParams.append('apikey', API_KEY);
            }

            const response = await fetch(`${BASE_URL}?${queryParams.toString()}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: BlockscoutResponse<T> = await response.json();

            if (data.status === '0' && data.message === 'No transactions found') {
                return [];
            }

            if (data.status !== '1') {
                console.warn('Blockscout API error:', data.message);
                return [];
            }

            return data.result;
        } catch (error) {
            console.error('Fetch error:', error);
            return [];
        }
    }

    async fetchRbtcTransactions(address: string): Promise<WalletTx[]> {
        const transactions = await this.fetch<BlockscoutTx>({
            module: 'account',
            action: 'txlist',
            address,
            startblock: '0',
            endblock: '99999999',
            sort: 'desc',
            offset: '1000' // Limit reasonable amount
        });

        return transactions
            .filter(tx => tx.value !== '0') // Only show value transfers for now
            .map(tx => this.mapToWalletTx(tx, address, 'RBTC'));
    }

    async fetchLutTransactions(address: string): Promise<WalletTx[]> {
        // Find LUT config
        const LutConfig = TOKENS.LUT;
        if (!LutConfig.address) return [];

        const transactions = await this.fetch<BlockscoutTokenTx>({
            module: 'account',
            action: 'tokentx',
            contractaddress: LutConfig.address,
            address,
            startblock: '0',
            endblock: '99999999',
            sort: 'desc',
            offset: '1000'
        });

        return transactions
            // .filter(tx => tx.tokenSymbol === 'LUT') // Removed strict check as we query by contract address
            .map(tx => this.mapToWalletTx(tx, address, 'LUT', 18)); // LUT usually 18 decimals
    }

    private mapToWalletTx(
        tx: BlockscoutTx | BlockscoutTokenTx,
        userAddress: string,
        token: 'RBTC' | 'LUT',
        decimals = 18
    ): WalletTx {
        const isIncoming = tx.to.toLowerCase() === userAddress.toLowerCase();
        const direction: TxDirection = isIncoming ? 'in' : 'out';
        // Note: 'contract' direction logic is complex without parsing input data, simplifying to in/out based on address match

        // Determine status
        let status: TxStatus = 'confirmed';
        if (tx.isError === '1') {
            status = 'failed';
        } else if (parseInt(tx.confirmations, 10) < 12) { // 12 confirmations is a safe bet for RSK
            status = 'pending';
        }

        // Format amount
        const rawAmount = tx.value;
        const amount = ethers.formatUnits(rawAmount, decimals);

        // Determine title
        let title = '';
        if (token === 'LUT') {
            title = isIncoming ? 'Received LUT' : 'Sent LUT';
        } else {
            // For RBTC, could be interaction with contract
            if (tx.input && tx.input !== '0x' && direction === 'out') {
                title = 'Contract Interaction';
                // Could refine 'direction' here if strictly desired
            } else {
                title = isIncoming ? 'Received RBTC' : 'Sent RBTC';
            }
        }

        return {
            hash: tx.hash,
            token,
            direction: (title === 'Contract Interaction') ? 'contract' : direction,
            title,
            from: tx.from,
            to: tx.to,
            amount,
            rawAmount,
            timestamp: parseInt(tx.timeStamp, 10) * 1000, // Convert to ms
            status,
            fee: ethers.formatEther(BigInt(tx.gasUsed) * BigInt(tx.gasPrice)) + ' RBTC'
        };
    }
}

export const blockscoutService = new BlockscoutService();

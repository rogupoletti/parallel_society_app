import { ethers } from 'ethers';
import { WalletTx, TxDirection, TxStatus } from '../types/Transaction';
import { TOKENS } from '../config/tokens';
import { ROOTSTOCK } from '../config/RootstockConfig';

// Standard ERC-20 Transfer Event Topic
// event Transfer(address indexed from, address indexed to, uint256 value)
const TRANSFER_EVENT_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

export class RpcHistoryService {
    private provider: ethers.JsonRpcProvider;

    constructor() {
        this.provider = new ethers.JsonRpcProvider(ROOTSTOCK.RPC_URL);
    }

    /**
     * Fetches LUT token transactions using standard RPC eth_getLogs
     * @param userAddress The user's wallet address
     */
    async fetchLutTransactions(userAddress: string): Promise<WalletTx[]> {
        const lutAddress = TOKENS.LUT.address;
        if (!lutAddress) return [];

        const paddedAddress = ethers.zeroPadValue(userAddress, 32);

        try {

            // Fetch logs where user is either Sender (topic[1]) OR Receiver (topic[2])
            // We need two separate queries or a more complex filter.
            // Standard JSON-RPC eth_getLogs filter supports arrays for OR: [topic0, [from, to]]
            // But let's be explicit and robust.

            // Get current block number to determine range
            // Get current block number to determine range
            const currentBlock = await this.provider.getBlockNumber();
            // Alchemy (and other premium RPCs) supports much larger ranges
            const BLOCKS_PER_CHUNK = 50000;
            const MAX_SEARCH_BLOCKS = 1000000; // Search last ~1M blocks use year of history

            const fromBlock = Math.max(0, currentBlock - MAX_SEARCH_BLOCKS);
            const toBlock = currentBlock;

            // Base filter
            const filter = {
                address: lutAddress
            };

            // Generate chunks ranges
            const chunks: [number, number][] = [];
            for (let i = fromBlock; i < toBlock; i += BLOCKS_PER_CHUNK) {
                const end = Math.min(i + BLOCKS_PER_CHUNK - 1, toBlock);
                chunks.push([i, end]);
            }

            // Limit concurrency if needed, but 25 chunks is okay for Promise.all usually
            // We fetch both Sent and Received for each chunk

            const logPromises = chunks.flatMap(([start, end]) => [
                // Sent logs
                this.provider.getLogs({
                    ...filter,
                    fromBlock: start,
                    toBlock: end,
                    topics: [TRANSFER_EVENT_TOPIC, paddedAddress]
                }),
                // Received logs
                this.provider.getLogs({
                    ...filter,
                    fromBlock: start,
                    toBlock: end,
                    topics: [TRANSFER_EVENT_TOPIC, null, paddedAddress]
                })
            ]);

            const logResults = await Promise.all(logPromises);

            // Flatten results
            const sentLogs = logResults.filter((_, i) => i % 2 === 0).flat();
            const receivedLogs = logResults.filter((_, i) => i % 2 === 1).flat();

            // Combine and deduplicate by transactionHash + logIndex
            const allLogs = [...sentLogs, ...receivedLogs];
            const uniqueLogs = Array.from(new Map(allLogs.map(log => [`${log.transactionHash}-${log.index}`, log])).values());

            // Fetch timestamps for blocks
            // This can be slow. Dedup blocks first.
            const blockNumbers = [...new Set(uniqueLogs.map(l => l.blockNumber))];
            const blockTimestamps: Record<number, number> = {};

            // Fetch blocks in parallel (limited batch size recommended usually)
            // Only fetch distinct blocks
            await Promise.all(blockNumbers.map(async (blockNum) => {
                const block = await this.provider.getBlock(blockNum);
                if (block) {
                    blockTimestamps[blockNum] = block.timestamp;
                }
            }));

            // Map to WalletTx
            const transactions: WalletTx[] = uniqueLogs.map(log => {
                // Parse Check
                // topic1 is from, topic2 is to. Data is amount.
                const from = ethers.stripZerosLeft(log.topics[1]);
                const to = ethers.stripZerosLeft(log.topics[2]);
                const rawAmount = BigInt(log.data).toString();
                const amount = ethers.formatUnits(rawAmount, TOKENS.LUT.decimals);

                const isIncoming = to.toLowerCase() === userAddress.toLowerCase();
                const title = isIncoming ? 'Received LUT' : 'Sent LUT';
                const direction: TxDirection = isIncoming ? 'in' : 'out';

                const timestamp = blockTimestamps[log.blockNumber]
                    ? blockTimestamps[log.blockNumber] * 1000
                    : Date.now();

                return {
                    hash: log.transactionHash,
                    token: 'LUT',
                    direction,
                    title,
                    from,
                    to,
                    amount,
                    rawAmount,
                    timestamp,
                    status: 'confirmed', // Logs existing implies confirmation
                    fee: '' // Fee not easily available from log without full tx receipt
                };
            });

            return transactions;

        } catch (error: any) {
            // Check for Alchemy 403 or typical limits error
            const isAlchemyError = error?.code === 'SERVER_ERROR' || error?.toString().includes('403');

            if (isAlchemyError && this.provider._getConnection().url.includes('alchemy')) {
                console.warn('Alchemy RPC failed (403/Limits). Falling back to Official RPC...');

                // Fallback Configuration
                const fallbackUrl = ROOTSTOCK.getOfficialRpcUrl();
                this.provider = new ethers.JsonRpcProvider(fallbackUrl);

                // Retry with stricter limits suitable for Official/Public nodes
                // Recursive call? Or just inline retry logic?
                // Inline is safer to avoid infinite loops easily.

                try {
                    const BLOCKS_PER_CHUNK = 2000;
                    const MAX_SEARCH_BLOCKS = 50000;
                    const currentBlock = await this.provider.getBlockNumber();
                    const fromBlock = Math.max(0, currentBlock - MAX_SEARCH_BLOCKS);
                    const toBlock = currentBlock;

                    const chunks: [number, number][] = [];
                    for (let i = fromBlock; i < toBlock; i += BLOCKS_PER_CHUNK) {
                        const end = Math.min(i + BLOCKS_PER_CHUNK - 1, toBlock);
                        chunks.push([i, end]);
                    }

                    const filter = { address: lutAddress };

                    const logPromises = chunks.flatMap(([start, end]) => [
                        this.provider.getLogs({ ...filter, fromBlock: start, toBlock: end, topics: [TRANSFER_EVENT_TOPIC, paddedAddress] }),
                        this.provider.getLogs({ ...filter, fromBlock: start, toBlock: end, topics: [TRANSFER_EVENT_TOPIC, null, paddedAddress] })
                    ]);

                    const logResults = await Promise.all(logPromises);
                    // Flatten results
                    const sentLogs = logResults.filter((_, i) => i % 2 === 0).flat();
                    const receivedLogs = logResults.filter((_, i) => i % 2 === 1).flat();

                    // Code duplication for processing logs - ideal to refactor invalid common method
                    // For now, map exactly as above
                    const allLogs = [...sentLogs, ...receivedLogs];
                    const uniqueLogs = Array.from(new Map(allLogs.map(log => [`${log.transactionHash}-${log.index}`, log])).values());

                    const blockNumbers = [...new Set(uniqueLogs.map(l => l.blockNumber))];
                    const blockTimestamps: Record<number, number> = {};
                    await Promise.all(blockNumbers.map(async (blockNum) => {
                        const block = await this.provider.getBlock(blockNum);
                        if (block) blockTimestamps[blockNum] = block.timestamp;
                    }));

                    return uniqueLogs.map(log => {
                        const from = ethers.stripZerosLeft(log.topics[1]);
                        const to = ethers.stripZerosLeft(log.topics[2]);
                        const rawAmount = BigInt(log.data).toString();
                        const amount = ethers.formatUnits(rawAmount, TOKENS.LUT.decimals);
                        const isIncoming = to.toLowerCase() === userAddress.toLowerCase();
                        const timestamp = blockTimestamps[log.blockNumber] ? blockTimestamps[log.blockNumber] * 1000 : Date.now();
                        return {
                            hash: log.transactionHash,
                            token: 'LUT',
                            direction: isIncoming ? 'in' : 'out',
                            title: isIncoming ? 'Received LUT' : 'Sent LUT',
                            from, to, amount, rawAmount, timestamp,
                            status: 'confirmed', fee: ''
                        };
                    });
                } catch (fallbackError) {
                    console.error('Fallback RPC also failed:', fallbackError);
                    return [];
                }
            }

            console.error('Error fetching RPC History:', error);
            return [];
        }
    }
}

export const rpcHistoryService = new RpcHistoryService();

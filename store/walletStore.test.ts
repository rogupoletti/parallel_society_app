// Mock dependencies before imports
jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn().mockResolvedValue(null),
    setItemAsync: jest.fn().mockResolvedValue(undefined),
    deleteItemAsync: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('@/core/services/BalanceService', () => ({
    balanceService: {
        fetchAllBalances: jest.fn()
    }
}));

jest.mock('@/core/services/TransactionService', () => ({
    transactionService: {
        getTransactions: jest.fn()
    }
}));

import { useWalletStore } from './walletStore';
import { balanceService } from '@/core/services/BalanceService';
import { transactionService } from '@/core/services/TransactionService';
import { act } from '@testing-library/react-native';

describe('walletStore', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset the store state between tests
        const { setState } = useWalletStore;
        setState({
            mnemonic: null,
            isWalletCreated: false,
            walletAddress: null,
            balances: { RBTC: null, LUT: null },
            loadingBalances: false,
            balanceError: null,
            txHistory: [],
            pendingTxs: [],
            loadingTxHistory: false
        });
    });

    describe('initial state', () => {
        it('should have correct default values', () => {
            const state = useWalletStore.getState();

            expect(state.mnemonic).toBeNull();
            expect(state.isWalletCreated).toBe(false);
            expect(state.walletAddress).toBeNull();
            expect(state.balances.RBTC).toBeNull();
            expect(state.balances.LUT).toBeNull();
            expect(state.loadingBalances).toBe(false);
            expect(state.balanceError).toBeNull();
        });
    });

    describe('setWalletAddress', () => {
        it('should set the wallet address', () => {
            const address = '0x1234567890123456789012345678901234567890';

            act(() => {
                useWalletStore.getState().setWalletAddress(address);
            });

            expect(useWalletStore.getState().walletAddress).toBe(address);
        });
    });

    describe('setMnemonic / clearMnemonic', () => {
        it('should set and clear mnemonic', () => {
            const mnemonic = ['word1', 'word2', 'word3'];

            act(() => {
                useWalletStore.getState().setMnemonic(mnemonic);
            });

            expect(useWalletStore.getState().mnemonic).toEqual(mnemonic);

            act(() => {
                useWalletStore.getState().clearMnemonic();
            });

            expect(useWalletStore.getState().mnemonic).toBeNull();
        });
    });

    describe('setWalletCreated', () => {
        it('should toggle wallet created flag', () => {
            act(() => {
                useWalletStore.getState().setWalletCreated(true);
            });

            expect(useWalletStore.getState().isWalletCreated).toBe(true);

            act(() => {
                useWalletStore.getState().setWalletCreated(false);
            });

            expect(useWalletStore.getState().isWalletCreated).toBe(false);
        });
    });

    describe('loadBalances', () => {
        const mockAddress = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
        const mockBalancesData = {
            RBTC: { formatted: '5.0', raw: '5000000000000000000' },
            LUT: { formatted: '250', raw: '250000000000000000000' }
        };

        it('should load balances successfully', async () => {
            (balanceService.fetchAllBalances as jest.Mock).mockResolvedValue(mockBalancesData);

            await act(async () => {
                await useWalletStore.getState().loadBalances(mockAddress);
            });

            const state = useWalletStore.getState();
            expect(state.balances).toEqual(mockBalancesData);
            expect(state.loadingBalances).toBe(false);
            expect(state.balanceError).toBeNull();
            expect(state.walletAddress).toBe(mockAddress);
        });

        it('should set error on failure', async () => {
            (balanceService.fetchAllBalances as jest.Mock).mockRejectedValue(
                new Error('Network error')
            );

            await act(async () => {
                await useWalletStore.getState().loadBalances(mockAddress);
            });

            const state = useWalletStore.getState();
            expect(state.loadingBalances).toBe(false);
            expect(state.balanceError).toBe('Network error');
        });

        it('should set error if no address provided and none stored', async () => {
            await act(async () => {
                await useWalletStore.getState().loadBalances();
            });

            const state = useWalletStore.getState();
            expect(state.balanceError).toBe('No wallet address provided');
        });

        it('should use stored walletAddress if no address passed', async () => {
            (balanceService.fetchAllBalances as jest.Mock).mockResolvedValue(mockBalancesData);

            act(() => {
                useWalletStore.getState().setWalletAddress(mockAddress);
            });

            await act(async () => {
                await useWalletStore.getState().loadBalances();
            });

            expect(balanceService.fetchAllBalances).toHaveBeenCalledWith(mockAddress);
        });
    });

    describe('addPendingTx', () => {
        it('should add a pending transaction to both pendingTxs and txHistory', () => {
            const mockTx = {
                hash: '0xabc123',
                from: '0x1111',
                to: '0x2222',
                value: '1000000000000000000',
                timestamp: Date.now(),
                status: 'pending' as const,
                token: 'RBTC' as const
            };

            act(() => {
                useWalletStore.getState().addPendingTx(mockTx as any);
            });

            const state = useWalletStore.getState();
            expect(state.pendingTxs).toHaveLength(1);
            expect(state.pendingTxs[0].hash).toBe('0xabc123');
            expect(state.txHistory).toHaveLength(1);
            expect(state.txHistory[0].hash).toBe('0xabc123');
        });

        it('should prepend new transactions (most recent first)', () => {
            const tx1 = { hash: '0xfirst', timestamp: 1000 } as any;
            const tx2 = { hash: '0xsecond', timestamp: 2000 } as any;

            act(() => {
                useWalletStore.getState().addPendingTx(tx1);
            });
            act(() => {
                useWalletStore.getState().addPendingTx(tx2);
            });

            const state = useWalletStore.getState();
            expect(state.pendingTxs[0].hash).toBe('0xsecond');
            expect(state.txHistory[0].hash).toBe('0xsecond');
        });
    });

    describe('loadTxHistory', () => {
        const mockAddress = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';

        it('should load transaction history', async () => {
            const mockHistory = [
                { hash: '0xh1', timestamp: 3000 },
                { hash: '0xh2', timestamp: 1000 }
            ];

            (transactionService.getTransactions as jest.Mock).mockResolvedValue(mockHistory);

            act(() => {
                useWalletStore.getState().setWalletAddress(mockAddress);
            });

            await act(async () => {
                await useWalletStore.getState().loadTxHistory();
            });

            const state = useWalletStore.getState();
            expect(state.txHistory).toHaveLength(2);
            expect(state.loadingTxHistory).toBe(false);
            // Should be sorted by timestamp descending
            expect(state.txHistory[0].timestamp).toBeGreaterThanOrEqual(state.txHistory[1].timestamp);
        });

        it('should merge pending txs that are not yet in history', async () => {
            const pendingTx = { hash: '0xpending', timestamp: 5000 } as any;
            const historyTxs = [
                { hash: '0xconfirmed', timestamp: 3000 }
            ];

            (transactionService.getTransactions as jest.Mock).mockResolvedValue(historyTxs);

            act(() => {
                useWalletStore.getState().setWalletAddress(mockAddress);
                useWalletStore.getState().addPendingTx(pendingTx);
            });

            await act(async () => {
                await useWalletStore.getState().loadTxHistory();
            });

            const state = useWalletStore.getState();
            expect(state.txHistory).toHaveLength(2);
            expect(state.txHistory[0].hash).toBe('0xpending'); // most recent
        });

        it('should remove pending tx from pending list if already in history', async () => {
            const pendingTx = { hash: '0xNowConfirmed', timestamp: 5000 } as any;
            const historyTxs = [
                { hash: '0xNowConfirmed', timestamp: 5000 } // same tx, now confirmed
            ];

            (transactionService.getTransactions as jest.Mock).mockResolvedValue(historyTxs);

            act(() => {
                useWalletStore.getState().setWalletAddress(mockAddress);
                useWalletStore.getState().addPendingTx(pendingTx);
            });

            await act(async () => {
                await useWalletStore.getState().loadTxHistory();
            });

            const state = useWalletStore.getState();
            // Should not have duplicate — pending should be filtered out
            expect(state.txHistory).toHaveLength(1);
            expect(state.txHistory[0].hash).toBe('0xNowConfirmed');
        });

        it('should not fetch if no address provided and none stored', async () => {
            await act(async () => {
                await useWalletStore.getState().loadTxHistory();
            });

            expect(transactionService.getTransactions).not.toHaveBeenCalled();
        });
    });
});

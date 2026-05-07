import { renderHook, act } from '@testing-library/react-native';
import { useProposal } from './useProposal';
import { ProposalService } from '@/core/services/api/ProposalService';

// Partial mocking to simulate environment
jest.mock('@/core/services/api/ProposalService', () => ({
    ProposalService: {
        fetchProposalById: jest.fn(),
        vote: jest.fn()
    }
}));

jest.mock('@/core/secure/SecureStorage', () => ({
    SecureStorage: {
        getEncryptedKey: jest.fn().mockResolvedValue('mocked_private_key')
    }
}));

jest.mock('@/core/wallet/eip712', () => ({
    signVote: jest.fn().mockResolvedValue('0xmockedsignature')
}));

jest.mock('@/core/services/BalanceService', () => ({
    balanceService: {
        fetchTokenBalance: jest.fn().mockResolvedValue({ raw: '5000000000000000000' }) // 5 LUT
    }
}));

const mockProposal = {
    id: 'prop_123',
    title: 'Test Proposal',
    status: 'ACTIVE',
    totalForRaw: '100000000000000000000', // 100
    totalAgainstRaw: '50000000000000000000' // 50
};

describe('useProposal Hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should initialize and load proposal accurately', async () => {
        (ProposalService.fetchProposalById as jest.Mock).mockResolvedValue(mockProposal);

        const { result } = renderHook(() => useProposal({
            id: 'prop_123',
            walletAddress: '0x123456'
        }));

        // Initially loading
        expect(result.current.loading).toBe(true);

        // Wait for async resolution
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 10)); // drain queue
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.proposal).toEqual(mockProposal);
        expect(result.current.userLutBalance).toBe('5000000000000000000');
    });

    it('should calculate metrics based on big int accurately', async () => {
        (ProposalService.fetchProposalById as jest.Mock).mockResolvedValue(mockProposal);

        const { result } = renderHook(() => useProposal({
            id: 'prop_123',
            walletAddress: '0x123456'
        }));

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
        });

        const metrics = result.current.getProposalMetrics();
        expect(metrics.totalFor.toString()).toBe('100000000000000000000');
        // 100 / 150 = 66.66%
        expect(metrics.pctFor).toBeCloseTo(66.66);
        expect(metrics.pctAgainst).toBeCloseTo(33.33);
        expect(result.current.isVotingClosed).toBe(false);
    });

    it('should prevent voting if wallet not connected', async () => {
        const { result } = renderHook(() => useProposal({
            id: 'prop_123',
            walletAddress: null
        }));

        await act(async () => {
            await expect(result.current.castVote('FOR')).rejects.toThrow('Proposal or Wallet Address is not initialized');
        });
    });
});

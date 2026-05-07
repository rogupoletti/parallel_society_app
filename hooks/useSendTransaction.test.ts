import { renderHook, act } from '@testing-library/react-native';
import { useSendTransaction } from './useSendTransaction';

// Mocks
jest.mock('@/core/services/SendService', () => ({
    sendService: {
        estimateSendFee: jest.fn().mockResolvedValue({
            totalFee: BigInt(50000),
            gasLimit: BigInt(21000),
            gasPrice: BigInt(2),
            formattedFee: '0.00005'
        })
    }
}));

describe('useSendTransaction', () => {
    const mockBalances = {
        RBTC: { symbol: 'RBTC' as const, formatted: '10.5', raw: '10500000000000000000' },
        LUT: { symbol: 'LUT' as const, formatted: '100', raw: '100000000000000000000' }
    };
    const mockWalletAddress = '0x1234567890123456789012345678901234567890';

    const renderSendHook = (overrides = {}) =>
        renderHook(() => useSendTransaction({
            initialToken: 'RBTC',
            balances: mockBalances,
            walletAddress: mockWalletAddress,
            ...overrides
        }));

    it('should initialize with default values', () => {
        const { result } = renderSendHook();

        expect(result.current.selectedToken).toBe('RBTC');
        expect(result.current.toAddress).toBe('');
        expect(result.current.amount).toBe('');
        expect(result.current.isAddressValid).toBe(true);
        expect(result.current.calculatingFee).toBe(false);
    });

    it('should reject an invalid ethereum address', () => {
        const { result } = renderSendHook();

        act(() => {
            result.current.handleAddressChange('invalid_address');
        });

        expect(result.current.isAddressValid).toBe(false);
        expect(result.current.errorData?.field).toBe('address');
    });

    it('should accept a valid ethereum address', () => {
        const { result } = renderSendHook();

        act(() => {
            result.current.handleAddressChange('0x5aedbeba14addabba19c21ff213fc0d5ebcbb83c');
        });

        expect(result.current.isAddressValid).toBe(true);
        expect(result.current.errorData).toBeNull();
    });

    describe('handleAmountChange', () => {
        it('should accept valid numeric input', () => {
            const { result } = renderSendHook();

            act(() => {
                result.current.handleAmountChange('1.5');
            });

            expect(result.current.amount).toBe('1.5');
        });

        it('should reject non-numeric characters', () => {
            const { result } = renderSendHook();

            act(() => {
                result.current.handleAmountChange('abc');
            });

            expect(result.current.amount).toBe('');
        });

        it('should convert comma to dot (locale handling)', () => {
            const { result } = renderSendHook();

            act(() => {
                result.current.handleAmountChange('1,5');
            });

            expect(result.current.amount).toBe('1.5');
        });

        it('should accept empty string (clearing the field)', () => {
            const { result } = renderSendHook();

            act(() => {
                result.current.handleAmountChange('5');
            });
            act(() => {
                result.current.handleAmountChange('');
            });

            expect(result.current.amount).toBe('');
        });

        it('should accept just a dot (starting decimal)', () => {
            const { result } = renderSendHook();

            act(() => {
                result.current.handleAmountChange('.');
            });

            // The regex /^\d*\.?\d*$/ matches "." so it should be accepted
            expect(result.current.amount).toBe('.');
        });
    });

    describe('handleSetMax', () => {
        it('should set full balance for LUT token', () => {
            const { result } = renderSendHook({ initialToken: 'LUT' });

            // Switch to LUT
            act(() => {
                result.current.setSelectedToken('LUT');
            });

            act(() => {
                result.current.handleSetMax();
            });

            expect(result.current.amount).toBe('100');
        });
    });

    describe('validateBeforeReview', () => {
        it('should fail if wallet address is null', () => {
            const { result } = renderSendHook({ walletAddress: null });

            let isValid: boolean = false;
            act(() => {
                isValid = result.current.validateBeforeReview();
            });

            expect(isValid).toBe(false);
        });

        it('should fail if toAddress is empty', () => {
            const { result } = renderSendHook();

            let isValid: boolean = false;
            act(() => {
                isValid = result.current.validateBeforeReview();
            });

            expect(isValid).toBe(false);
            expect(result.current.errorData?.field).toBe('address');
        });

        it('should fail if amount is zero', () => {
            const { result } = renderSendHook();

            act(() => {
                result.current.handleAddressChange('0x5aedbeba14addabba19c21ff213fc0d5ebcbb83c');
            });
            act(() => {
                result.current.handleAmountChange('0');
            });

            let isValid: boolean = false;
            act(() => {
                isValid = result.current.validateBeforeReview();
            });

            expect(isValid).toBe(false);
            expect(result.current.errorData?.field).toBe('amount');
        });

        it('should fail if amount exceeds balance', () => {
            const { result } = renderSendHook();

            act(() => {
                result.current.handleAddressChange('0x5aedbeba14addabba19c21ff213fc0d5ebcbb83c');
            });
            act(() => {
                result.current.handleAmountChange('999999');
            });

            let isValid: boolean = false;
            act(() => {
                isValid = result.current.validateBeforeReview();
            });

            expect(isValid).toBe(false);
            expect(result.current.errorData?.field).toBe('amount');
            expect(result.current.errorData?.message).toContain('Insufficient');
        });

        it('should pass with valid address and amount within balance', () => {
            const { result } = renderSendHook();

            act(() => {
                result.current.handleAddressChange('0x5aedbeba14addabba19c21ff213fc0d5ebcbb83c');
            });
            act(() => {
                result.current.handleAmountChange('1.0');
            });

            let isValid: boolean = false;
            act(() => {
                isValid = result.current.validateBeforeReview();
            });

            expect(isValid).toBe(true);
        });
    });
});

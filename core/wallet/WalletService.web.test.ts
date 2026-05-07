/**
 * Tests for the web fallback of WalletService.
 * Validates mnemonic generation using Web Crypto API.
 */

// Mock window.crypto.getRandomValues
const mockGetRandomValues = jest.fn((array: Uint8Array) => {
    // Fill with deterministic but valid entropy for testing
    for (let i = 0; i < array.length; i++) {
        array[i] = (i * 17 + 42) % 256;
    }
    return array;
});

Object.defineProperty(globalThis, 'window', {
    value: {
        crypto: {
            getRandomValues: mockGetRandomValues,
        },
    },
    writable: true,
    configurable: true,
});

// Mock ethers to control mnemonic generation
jest.mock('ethers', () => {
    const actual = jest.requireActual('ethers');
    return {
        ...actual,
        ethers: {
            ...actual.ethers,
            Mnemonic: {
                fromEntropy: jest.fn(() => ({
                    phrase: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
                })),
            },
            Wallet: {
                fromPhrase: jest.fn((phrase: string) => ({
                    address: '0x1234567890abcdef1234567890abcdef12345678',
                    privateKey: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
                    mnemonic: { phrase },
                })),
            },
        },
    };
});

import { WalletService } from '@/core/wallet/WalletService.web';

describe('WalletService.web', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('generateMnemonic', () => {
        it('uses window.crypto.getRandomValues for entropy', () => {
            WalletService.generateMnemonic();
            expect(mockGetRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
        });

        it('requests 32 bytes (256 bits) of entropy', () => {
            WalletService.generateMnemonic();
            const call = mockGetRandomValues.mock.calls[0][0];
            expect(call.length).toBe(32);
        });

        it('returns an array of words', () => {
            const words = WalletService.generateMnemonic();
            expect(Array.isArray(words)).toBe(true);
            expect(words.length).toBeGreaterThan(0);
            words.forEach(word => expect(typeof word).toBe('string'));
        });
    });

    describe('importMnemonic', () => {
        it('returns a WalletAccount from valid words', () => {
            const words = ['abandon', 'abandon', 'abandon', 'abandon', 'abandon', 'abandon',
                'abandon', 'abandon', 'abandon', 'abandon', 'abandon', 'about'];
            const account = WalletService.importMnemonic(words);

            expect(account).toHaveProperty('address');
            expect(account).toHaveProperty('privateKey');
            expect(account).toHaveProperty('mnemonic');
            expect(account.mnemonic).toBe(words.join(' '));
        });
    });

    describe('deriveAddress', () => {
        it('returns an address string from mnemonic', () => {
            const address = WalletService.deriveAddress('test mnemonic phrase');
            expect(typeof address).toBe('string');
            expect(address).toMatch(/^0x/);
        });
    });
});

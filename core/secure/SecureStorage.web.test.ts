/**
 * Tests for the web fallback of SecureStorage.
 * Validates sessionStorage-based implementation and PIN no-op behavior.
 */

// Mock sessionStorage
const mockStorage: Record<string, string> = {};
const mockSessionStorage = {
    getItem: jest.fn((key: string) => mockStorage[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { mockStorage[key] = value; }),
    removeItem: jest.fn((key: string) => { delete mockStorage[key]; }),
};
Object.defineProperty(globalThis, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true,
    configurable: true,
});

// Import after mocking
import { SecureStorage } from '@/core/secure/SecureStorage.web';

describe('SecureStorage.web', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    });

    describe('saveEncryptedKey / getEncryptedKey', () => {
        it('saves a value to sessionStorage with correct prefix', async () => {
            await SecureStorage.saveEncryptedKey('test_key', 'test_value');
            expect(mockSessionStorage.setItem).toHaveBeenCalledWith('equinox_test_key', 'test_value');
        });

        it('retrieves a saved value', async () => {
            await SecureStorage.saveEncryptedKey('wallet', 'my_mnemonic');
            const result = await SecureStorage.getEncryptedKey('wallet');
            expect(result).toBe('my_mnemonic');
        });

        it('returns null for non-existent key', async () => {
            const result = await SecureStorage.getEncryptedKey('nonexistent');
            expect(result).toBeNull();
        });
    });

    describe('PIN (disabled on web)', () => {
        it('savePinHash is a no-op', async () => {
            await SecureStorage.savePinHash('some_hash');
            // Should NOT have called setItem
            expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
        });

        it('getPinHash always returns null', async () => {
            const result = await SecureStorage.getPinHash();
            expect(result).toBeNull();
        });
    });

    describe('deleteKey', () => {
        it('removes a key from sessionStorage', async () => {
            await SecureStorage.saveEncryptedKey('to_delete', 'value');
            await SecureStorage.deleteKey('to_delete');
            expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('equinox_to_delete');
            const result = await SecureStorage.getEncryptedKey('to_delete');
            expect(result).toBeNull();
        });
    });
});

/**
 * Web fallback for SecureStorage.
 * Uses sessionStorage instead of expo-secure-store.
 * Data is cleared when the browser tab is closed — this is intentional
 * for security (no mnemonic in browser, WalletConnect handles keys).
 */
export class SecureStorage {
    private static readonly KEY_PREFIX = 'equinox_';

    /**
     * Saves a value to sessionStorage.
     * @param key The key to store the value under.
     * @param value The value to store.
     */
    static async saveEncryptedKey(key: string, value: string): Promise<void> {
        try {
            sessionStorage.setItem(this.KEY_PREFIX + key, value);
        } catch (e) {
            console.warn('[SecureStorage.web] Failed to save:', key, e);
        }
    }

    /**
     * Retrieves a value from sessionStorage.
     * @param key The key to retrieve.
     * @returns The stored value or null if not found.
     */
    static async getEncryptedKey(key: string): Promise<string | null> {
        try {
            return sessionStorage.getItem(this.KEY_PREFIX + key);
        } catch (e) {
            console.warn('[SecureStorage.web] Failed to get:', key, e);
            return null;
        }
    }

    /**
     * PIN is not persisted on web.
     * Users reconnect via WalletConnect each session.
     */
    static async savePinHash(_hash: string): Promise<void> {
        // No-op on web — PIN not used
    }

    /**
     * Always returns null on web — no PIN flow.
     */
    static async getPinHash(): Promise<string | null> {
        return null;
    }

    /**
     * Deletes a key from sessionStorage.
     * @param key The key to delete.
     */
    static async deleteKey(key: string): Promise<void> {
        try {
            sessionStorage.removeItem(this.KEY_PREFIX + key);
        } catch (e) {
            console.warn('[SecureStorage.web] Failed to delete:', key, e);
        }
    }
}

import * as SecureStore from 'expo-secure-store';

export class SecureStorage {
    private static readonly KEY_PREFIX = 'equinox_';

    /**
     * Saves a value securely encrypted.
     * @param key The key to store the value under.
     * @param value The value to store.
     */
    static async saveEncryptedKey(key: string, value: string): Promise<void> {
        await SecureStore.setItemAsync(this.KEY_PREFIX + key, value, {
            keychainAccessible: SecureStore.WHEN_UNLOCKED,
        });
    }

    /**
     * Retrieves a securely stored value.
     * @param key The key to retrieve.
     * @returns The stored value or null if not found.
     */
    static async getEncryptedKey(key: string): Promise<string | null> {
        return await SecureStore.getItemAsync(this.KEY_PREFIX + key);
    }

    /**
     * Saves the PIN/password hash.
     * @param hash The hash of the PIN/password.
     */
    static async savePinHash(hash: string): Promise<void> {
        await this.saveEncryptedKey('pin_hash', hash);
    }

    /**
     * Retrieves the stored PIN/password hash.
     * @returns The stored hash or null if not set.
     */
    static async getPinHash(): Promise<string | null> {
        return await this.getEncryptedKey('pin_hash');
    }

    /**
     * Deletes a key from secure storage.
     * @param key The key to delete.
     */
    static async deleteKey(key: string): Promise<void> {
        await SecureStore.deleteItemAsync(this.KEY_PREFIX + key);
    }

}

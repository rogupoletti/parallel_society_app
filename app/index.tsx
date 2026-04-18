import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SecureStorage } from '@/core/secure/SecureStorage';
import { useWalletStore } from '@/store/walletStore';
import { useAuthStore } from '@/store/authStore';

export default function Index() {
    const [isLoading, setIsLoading] = useState(true);
    const [hasWallet, setHasWallet] = useState(false);
    const [hasPin, setHasPin] = useState(false);
    const setWalletCreated = useWalletStore((state) => state.setWalletCreated);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    useEffect(() => {
        checkWalletExists();
    }, []);

    const checkWalletExists = async () => {
        try {
            // 1. Check for PIN - this determines if the app is fully set up
            const pinHash = await SecureStorage.getPinHash();
            if (pinHash) {
                setHasPin(true);
            }

            // 2. Check for wallet
            const mnemonic = await SecureStorage.getEncryptedKey('mnemonic');
            if (mnemonic) {
                setHasWallet(true);
                setWalletCreated(true);
            } else {
                // Also check private_key for legacy or fallback
                const privateKey = await SecureStorage.getEncryptedKey('private_key');
                if (privateKey) {
                    setHasWallet(true);
                    setWalletCreated(true);
                }
            }
        } catch (e) {
            // No wallet or PIN found
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    // 1. If we have a Firebase session, go to the dashboard
    if (isAuthenticated) {
        return <Redirect href="/(tabs)/wallet" />;
    }

    // 2. If we have a local wallet AND a PIN, go to Lock screen
    if (hasWallet && hasPin) {
        return <Redirect href="/auth/lock" />;
    }

    // 3. If we have a local wallet but NO PIN, go to Set PIN screen
    if (hasWallet && !hasPin) {
        return <Redirect href="/auth/set-pin" />;
    }

    // 4. If no wallet at all, start onboarding
    return <Redirect href="/(tabs)/wallet/setup" />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});

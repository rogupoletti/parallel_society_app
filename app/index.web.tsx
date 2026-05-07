/**
 * Web entry point — simplified flow.
 * On web, users connect external wallets via WalletConnect.
 * No mnemonic/PIN/lock flow — just connect and go.
 */
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/authStore';

export default function WebIndex() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    // If already authenticated (Firebase session), go to dashboard
    if (isAuthenticated) {
        return <Redirect href="/(tabs)/wallet" />;
    }

    // On web, redirect to wallet connect screen
    return <Redirect href="/auth/connect" />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});

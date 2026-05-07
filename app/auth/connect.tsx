/**
 * Web wallet connection screen.
 * Uses Reown AppKit to connect external wallets (MetaMask, Trust, etc.)
 * After connection, auto-signs in via AuthService.signInWithExternalWallet.
 */
import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useWalletStore } from '@/store/walletStore';

// Conditionally import web-only modules
let useWalletConnect: any;

if (Platform.OS === 'web') {
    try {
        // Initialize AppKit config (side effect — must run before hooks)
        require('@/core/config/web3Config.web');

        // Import wallet connection hook
        const walletConnectModule = require('@/core/hooks/useWalletConnect');
        useWalletConnect = walletConnectModule.useWalletConnect;
    } catch (e) {
        console.warn('[connect.tsx] AppKit modules not available:', e);
    }
}

export default function ConnectWalletScreen() {
    const router = useRouter();
    const loginWithExternalWallet = useAuthStore((s) => s.loginWithExternalWallet);
    const setWalletAddress = useWalletStore((s) => s.setWalletAddress);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    const [isSigningIn, setIsSigningIn] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Use WalletConnect hook (web only)
    const walletConnect = useWalletConnect ? useWalletConnect() : null;
    const { address, isConnected, connect, signMessage } = walletConnect || {};

    // Auto sign-in when wallet connects
    useEffect(() => {
        if (isConnected && address && !isAuthenticated && !isSigningIn) {
            handleSignIn();
        }
    }, [isConnected, address]);

    // Redirect to dashboard after successful auth
    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/(tabs)/wallet');
        }
    }, [isAuthenticated]);

    const handleSignIn = async () => {
        if (!address || !signMessage) return;

        setIsSigningIn(true);
        setError(null);

        try {
            await loginWithExternalWallet(address, signMessage);
            setWalletAddress(address);
        } catch (e: any) {
            setError(e.message || 'Failed to sign in');
            console.error('[ConnectWallet] Sign-in failed:', e);
        } finally {
            setIsSigningIn(false);
        }
    };

    // Not on web — show unsupported message
    if (Platform.OS !== 'web') {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>This screen is for web only</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconCircle}>
                    <Ionicons name="link-outline" size={64} color="#007AFF" />
                </View>

                <Text style={styles.title}>Parallel Society</Text>
                <Text style={styles.subtitle}>
                    Connect your Web3 wallet to access the decentralized governance platform.
                </Text>

                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {isSigningIn ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007AFF" />
                        <Text style={styles.loadingText}>Signing in...</Text>
                        <Text style={styles.loadingSubtext}>Please confirm in your wallet</Text>
                    </View>
                ) : isConnected ? (
                    <View style={styles.connectedContainer}>
                        <Text style={styles.connectedLabel}>Connected Wallet</Text>
                        <Text style={styles.addressText}>
                            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                        </Text>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleSignIn}
                        >
                            <Text style={styles.buttonText}>Sign In</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.connectContainer}>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={connect}
                        >
                            <Text style={styles.buttonText}>Connect Wallet</Text>
                        </TouchableOpacity>
                        <Text style={styles.helpText}>
                            Supports MetaMask, Trust Wallet, and WalletConnect
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.footerLink}>
                <Text style={styles.linkText}>Powered by Rootstock & WalletConnect</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 24,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        maxWidth: 420,
        alignSelf: 'center',
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#e1f5fe',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 16,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 48,
        paddingHorizontal: 20,
    },
    button: {
        backgroundColor: '#007AFF',
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        // Fallback for web specific styles
        ...(Platform.OS === 'web' ? {
            elevation: 4,
            cursor: 'pointer',
        } : {
            elevation: 4,
        }),
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    loadingContainer: {
        alignItems: 'center',
        width: '100%',
        paddingVertical: 20,
    },
    loadingText: {
        color: '#1a1a1a',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    loadingSubtext: {
        color: '#666',
        fontSize: 14,
        marginTop: 8,
    },
    errorContainer: {
        backgroundColor: '#fff1f0',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        width: '100%',
        borderWidth: 1,
        borderColor: '#ffa39e',
    },
    errorText: {
        color: '#f5222d',
        fontSize: 14,
        textAlign: 'center',
    },
    connectedContainer: {
        alignItems: 'center',
        width: '100%',
    },
    connectedLabel: {
        color: '#34C759',
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    addressText: {
        color: '#666',
        fontSize: 16,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        marginBottom: 32,
    },
    connectContainer: {
        alignItems: 'center',
        width: '100%',
    },
    helpText: {
        color: '#999',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginTop: 16,
    },
    footerLink: {
        marginTop: 'auto',
        alignItems: 'center',
        padding: 16,
    },
    linkText: {
        color: '#999',
        fontSize: 14,
    },
});

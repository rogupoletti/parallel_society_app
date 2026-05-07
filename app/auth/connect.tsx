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
let AppKitButton: any;

if (Platform.OS === 'web') {
    try {
        // Dynamic import for web-only AppKit
        const walletConnectModule = require('@/core/hooks/useWalletConnect');
        useWalletConnect = walletConnectModule.useWalletConnect;

        // Initialize AppKit config (side effect)
        require('@/core/config/web3Config.web');

        const appkitReact = require('@reown/appkit/react');
        AppKitButton = appkitReact.AppKitButton;
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
            {/* Background gradient effect */}
            <View style={styles.gradientOverlay} />

            <View style={styles.card}>
                {/* Logo placeholder */}
                <View style={styles.logoContainer}>
                    <Text style={styles.logoText}>⚡</Text>
                </View>

                <Text style={styles.title}>Parallel Society</Text>
                <Text style={styles.subtitle}>Decentralized Governance on Rootstock</Text>

                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {isSigningIn ? (
                    <View style={styles.signingContainer}>
                        <ActivityIndicator size="large" color="#6C63FF" />
                        <Text style={styles.signingText}>Signing in...</Text>
                        <Text style={styles.signingSubtext}>Please confirm in your wallet</Text>
                    </View>
                ) : isConnected ? (
                    <View style={styles.connectedContainer}>
                        <Text style={styles.connectedLabel}>Connected</Text>
                        <Text style={styles.addressText}>
                            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                        </Text>
                        <Pressable
                            style={styles.signInButton}
                            onPress={handleSignIn}
                        >
                            <Text style={styles.signInButtonText}>Sign In</Text>
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.connectContainer}>
                        {/* Use AppKit's built-in button if available */}
                        {AppKitButton ? (
                            <AppKitButton />
                        ) : (
                            <Pressable
                                style={styles.connectButton}
                                onPress={connect}
                            >
                                <Text style={styles.connectButtonText}>Connect Wallet</Text>
                            </Pressable>
                        )}
                        <Text style={styles.helpText}>
                            Connect your MetaMask, Trust Wallet, or any WalletConnect-compatible wallet
                        </Text>
                    </View>
                )}
            </View>

            <Text style={styles.footer}>Powered by Rootstock & WalletConnect</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0a0a1a',
        padding: 20,
    },
    gradientOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0a0a1a',
        opacity: 0.95,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 24,
        padding: 40,
        width: '100%',
        maxWidth: 420,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        // Web-specific shadow
        ...(Platform.OS === 'web' ? {
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(16px)',
        } : {}),
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(108, 99, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    logoText: {
        fontSize: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.5)',
        marginBottom: 32,
        textAlign: 'center',
    },
    errorContainer: {
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(255, 59, 48, 0.2)',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 13,
        textAlign: 'center',
    },
    signingContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    signingText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 16,
    },
    signingSubtext: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 13,
        marginTop: 8,
    },
    connectedContainer: {
        alignItems: 'center',
        width: '100%',
    },
    connectedLabel: {
        color: '#34C759',
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    addressText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 15,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        marginBottom: 24,
    },
    signInButton: {
        backgroundColor: '#6C63FF',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 32,
        width: '100%',
        alignItems: 'center',
    },
    signInButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
    connectContainer: {
        alignItems: 'center',
        width: '100%',
    },
    connectButton: {
        backgroundColor: '#6C63FF',
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 32,
        width: '100%',
        alignItems: 'center',
        marginBottom: 16,
    },
    connectButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
    helpText: {
        color: 'rgba(255, 255, 255, 0.35)',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
    },
    footer: {
        position: 'absolute',
        bottom: 24,
        color: 'rgba(255, 255, 255, 0.2)',
        fontSize: 12,
    },
});

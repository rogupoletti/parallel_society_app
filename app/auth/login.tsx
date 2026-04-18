import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { SecureStorage } from '@/core/secure/SecureStorage';
import { InfoModal } from '@/components/ui/InfoModal';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
    const router = useRouter();
    const login = useAuthStore((state) => state.login);
    const [loading, setLoading] = useState(false);

    // Modal state
    const [modalConfig, setModalConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        variant: 'info' | 'error' | 'success' | 'warning';
    }>({
        visible: false,
        title: '',
        message: '',
        variant: 'error'
    });

    const handleLogin = async () => {
        setLoading(true);
        try {
            const mnemonic = await SecureStorage.getEncryptedKey('mnemonic');
            if (!mnemonic) {
                setModalConfig({
                    visible: true,
                    title: 'Error',
                    message: 'Wallet mnemonic not found. Please restore your wallet.',
                    variant: 'error'
                });
                setLoading(false);
                return;
            }

            await login(mnemonic);
            router.replace('/(tabs)/wallet');
        } catch (err: any) {
            setModalConfig({
                visible: true,
                title: 'Login Failed',
                message: err.message || 'An error occurred during authentication.',
                variant: 'error'
            });
            setLoading(false);
        }
    };


    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconCircle}>
                    <Ionicons name="shield-checkmark-outline" size={64} color="#007AFF" />
                </View>

                <Text style={styles.title}>Secure Sign-in</Text>
                <Text style={styles.subtitle}>
                    Please sign the authentication message with your wallet to access the Parallel Society Governance.
                </Text>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007AFF" />
                        <Text style={styles.loadingText}>Verifying signature...</Text>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.button} onPress={handleLogin}>
                        <Text style={styles.buttonText}>Sign in with Wallet</Text>
                    </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity
                style={styles.footerLink}
                onPress={() => router.push('/wallet/setup')}
                disabled={loading}
            >
                <Text style={styles.linkText}>Use a different wallet</Text>
            </TouchableOpacity>

            <InfoModal
                visible={modalConfig.visible}
                onClose={() => setModalConfig({ ...modalConfig, visible: false })}
                title={modalConfig.title}
                message={modalConfig.message}
                variant={modalConfig.variant}
            />
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
        elevation: 4,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    loadingContainer: {
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        color: '#666',
        fontSize: 16,
    },
    errorText: {
        color: '#FF3B30',
        marginTop: 16,
        textAlign: 'center',
    },
    footerLink: {
        marginTop: 'auto',
        alignItems: 'center',
        padding: 16,
    },
    linkText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '500',
    },
});

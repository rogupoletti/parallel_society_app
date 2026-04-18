import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SecureStorage } from '@/core/secure/SecureStorage';
import { useAuthStore } from '@/store/authStore';
import * as LocalAuthentication from 'expo-local-authentication';
import { ethers } from 'ethers';
import { Ionicons } from '@expo/vector-icons';
import { InfoModal } from '@/components/ui/InfoModal';

export default function LockScreen() {
    const router = useRouter();
    const { setIsLocked } = useAuthStore();
    const [pin, setPin] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [hasBiometrics, setHasBiometrics] = useState(false);

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

    const showAlert = (title: string, message: string, variant: 'info' | 'error' | 'success' | 'warning' = 'error') => {
        setModalConfig({ visible: true, title, message, variant });
    };

    useEffect(() => {
        checkBiometrics();
    }, []);

    const checkBiometrics = async () => {
        const useBiometrics = await SecureStorage.getEncryptedKey('use_biometrics');
        if (useBiometrics === 'true') {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            if (hasHardware && isEnrolled) {
                setHasBiometrics(true);
                handleBiometricAuth();
            }
        }
    };

    const handleBiometricAuth = async () => {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Unlock Parallel Society',
                fallbackLabel: 'Use PIN',
            });

            if (result.success) {
                unlock();
            }
        } catch (e) {
            console.error('Biometric auth error:', e);
        }
    };

    const handlePinSubmit = async (enteredPin: string) => {
        if (enteredPin.length === 6) {
            setIsVerifying(true);
            try {
                const storedHash = await SecureStorage.getPinHash();
                if (!storedHash) {
                    showAlert('Error', 'PIN not configured. Please contact support.');
                    return;
                }

                const hash = ethers.keccak256(ethers.toUtf8Bytes(enteredPin));
                if (hash === storedHash) {
                    unlock();
                } else {
                    showAlert('Incorrect PIN', 'The PIN you entered is incorrect.');
                    setPin('');
                }
            } catch (e) {
                showAlert('Error', 'Failed to verify PIN.');
            } finally {
                setIsVerifying(false);
            }
        }
    };

    const unlock = () => {
        setIsLocked(false);
        // Navigate based on whether we were redirected or just started
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(tabs)/wallet');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.iconCircle}>
                    <Ionicons name="lock-closed-outline" size={48} color="#007AFF" />
                </View>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Enter your PIN to unlock the app</Text>
            </View>

            <View style={styles.pinContainer}>
                <View style={styles.dotsRow}>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                pin.length > i && styles.dotFilled
                            ]}
                        />
                    ))}
                </View>

                <TextInput
                    style={styles.hiddenInput}
                    value={pin}
                    onChangeText={(text) => {
                        const cleaned = text.replace(/[^0-9]/g, '');
                        setPin(cleaned);
                        if (cleaned.length === 6) handlePinSubmit(cleaned);
                    }}
                    keyboardType="numeric"
                    maxLength={6}
                    autoFocus
                />

                {isVerifying && <ActivityIndicator style={styles.loader} color="#007AFF" />}
            </View>

            {hasBiometrics && !isVerifying && (
                <TouchableOpacity style={styles.biometricButton} onPress={handleBiometricAuth}>
                    <View style={styles.biometricCircle}>
                        <Ionicons name="finger-print" size={48} color="#007AFF" />
                    </View>
                    <Text style={styles.biometricText}>Unlock with Biometrics</Text>
                </TouchableOpacity>
            )}

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
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 64,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f0f7ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    pinContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 64,
    },
    dotsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        backgroundColor: '#fff',
    },
    dotFilled: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    hiddenInput: {
        position: 'absolute',
        width: '100%',
        height: 60,
        opacity: 0,
    },
    loader: {
        marginTop: 16,
    },
    biometricButton: {
        alignItems: 'center',
        padding: 20,
    },
    biometricCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f0f7ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e1f5fe',
    },
    biometricText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
    },
});

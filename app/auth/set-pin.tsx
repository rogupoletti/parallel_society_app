import { View, Text, StyleSheet, TextInput, TouchableOpacity, Switch, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { SecureStorage } from '@/core/secure/SecureStorage';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import * as LocalAuthentication from 'expo-local-authentication';
import { ethers } from 'ethers';
import { InfoModal } from '@/components/ui/InfoModal';

export default function SetPinScreen() {
    const router = useRouter();
    const { login, setBiometricsEnabled } = useAuthStore();
    const { username, email, reset: resetOnboarding } = useOnboardingStore();
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [useBiometrics, setUseBiometrics] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        variant: 'info'
    });

    const showAlert = (title: string, message: string, variant: 'info' | 'error' | 'success' | 'warning' = 'error') => {
        setModalConfig({ visible: true, title, message, variant });
    };

    const handleFinish = async () => {
        if (pin.length !== 6) {
            showAlert('Invalid PIN', 'PIN must be 6 digits.');
            return;
        }
        if (pin !== confirmPin) {
            showAlert('Mismatch', 'PINs do not match.');
            return;
        }

        setIsSubmitting(true);

        try {
            const hash = ethers.keccak256(ethers.toUtf8Bytes(pin));
            await SecureStorage.savePinHash(hash);

            if (useBiometrics) {
                const hasHardware = await LocalAuthentication.hasHardwareAsync();
                if (hasHardware) {
                    await SecureStorage.saveEncryptedKey('use_biometrics', 'true');
                    setBiometricsEnabled(true);
                }
            }

            // Automatic Login after onboarding
            const mnemonic = await SecureStorage.getEncryptedKey('mnemonic');
            if (mnemonic) {
                await login(mnemonic, username, email);
                resetOnboarding();
            }

            // Use replace to go home
            router.dismissAll();
            router.replace('/home');
        } catch (e: any) {
            showAlert('Error', e.message || 'Failed to save security settings.');
            setIsSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.title}>Set App Lock</Text>
                <Text style={styles.description}>
                    Create a 6-digit PIN to secure your wallet.
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="Enter 6-digit PIN"
                    value={pin}
                    onChangeText={setPin}
                    keyboardType="numeric"
                    maxLength={6}
                    secureTextEntry
                />

                <TextInput
                    style={styles.input}
                    placeholder="Confirm PIN"
                    value={confirmPin}
                    onChangeText={setConfirmPin}
                    keyboardType="numeric"
                    maxLength={6}
                    secureTextEntry
                />

                <View style={styles.switchContainer}>
                    <Text style={styles.switchLabel}>Use Biometrics for Quick Access</Text>
                    <Switch
                        value={useBiometrics}
                        onValueChange={setUseBiometrics}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, isSubmitting && styles.buttonDisabled]}
                    onPress={handleFinish}
                    disabled={isSubmitting}
                >
                    <Text style={styles.buttonText}>{isSubmitting ? 'Setting up...' : 'Finish Wallet Setup'}</Text>
                </TouchableOpacity>

                <InfoModal
                    visible={modalConfig.visible}
                    onClose={() => setModalConfig({ ...modalConfig, visible: false })}
                    title={modalConfig.title}
                    message={modalConfig.message}
                    variant={modalConfig.variant}
                />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        padding: 24,
        flexGrow: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 16,
        textAlign: 'center',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 16,
    },
    switchLabel: {
        fontSize: 16,
        color: '#333',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

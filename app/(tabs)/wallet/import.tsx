import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { WalletService } from '@/core/wallet/WalletService';
import { SecureStorage } from '@/core/secure/SecureStorage';
import { useWalletStore } from '@/store/walletStore';
import { InfoModal } from '@/components/ui/InfoModal';

export default function ImportWalletScreen() {
    const router = useRouter();
    const { setWalletCreated, setWalletAddress } = useWalletStore();
    const [mnemonicInput, setMnemonicInput] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    // Modal state
    const [modalConfig, setModalConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        variant?: 'info' | 'error' | 'success' | 'warning';
        onClose: () => void;
    }>({
        visible: false,
        title: '',
        message: '',
        onClose: () => { },
    });

    const closePortal = () => setModalConfig(prev => ({ ...prev, visible: false }));

    const handleImport = async () => {
        const words = mnemonicInput.trim().split(/\s+/);
        if (words.length !== 24 && words.length !== 12) {
            setModalConfig({
                visible: true,
                title: 'Invalid Phrase',
                message: 'Please enter a valid 12 or 24-word recovery phrase.',
                variant: 'error',
                onClose: closePortal
            });
            return;
        }

        setIsImporting(true);

        // Use setTimeout to allow the UI to render the loading state before the main thread is blocked by crypto work
        setTimeout(async () => {
            try {
                const wallet = WalletService.importMnemonic(words);
                await SecureStorage.saveEncryptedKey('private_key', wallet.privateKey);
                await SecureStorage.saveEncryptedKey('mnemonic', mnemonicInput.trim());

                // Save the wallet address to store
                setWalletAddress(wallet.address);

                setWalletCreated(true);
                router.push('/auth/set-pin');
            } catch (e) {
                setModalConfig({
                    visible: true,
                    title: 'Error',
                    message: 'Invalid recovery phrase. Please check and try again.',
                    variant: 'error',
                    onClose: closePortal
                });
                setIsImporting(false);
            }
        }, 100);
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <Text style={styles.title}>Import Wallet</Text>
                <Text style={styles.description}>
                    Enter your 12 or 24-word recovery phrase to restore your wallet.
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="Enter your recovery phrase here..."
                    multiline
                    numberOfLines={4}
                    value={mnemonicInput}
                    onChangeText={setMnemonicInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                />

                <TouchableOpacity
                    style={[styles.button, isImporting && styles.buttonDisabled]}
                    onPress={handleImport}
                    disabled={isImporting}
                >
                    {isImporting ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.buttonText}>Importing Secure Wallet...</Text>
                        </View>
                    ) : (
                        <Text style={styles.buttonText}>Import Wallet</Text>
                    )}
                </TouchableOpacity>

                <InfoModal
                    visible={modalConfig.visible}
                    onClose={modalConfig.onClose}
                    title={modalConfig.title}
                    message={modalConfig.message}
                    variant={modalConfig.variant}
                />
            </ScrollView >
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
        backgroundColor: '#f9f9f9',
        minHeight: 120,
        textAlignVertical: 'top',
        marginBottom: 24,
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
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

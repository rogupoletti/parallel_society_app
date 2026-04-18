import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useWalletStore } from '@/store/walletStore';
import { useState, useEffect } from 'react';
import { WalletService } from '@/core/wallet/WalletService';
import { SecureStorage } from '@/core/secure/SecureStorage';
import { BIP39_WORDLIST } from '@/core/wallet/wordlist';
import { InfoModal } from '@/components/ui/InfoModal';

export default function ConfirmPhraseScreen() {
    const router = useRouter();
    const { mnemonic, setWalletCreated, clearMnemonic, setWalletAddress } = useWalletStore();

    // State
    const [indices, setIndices] = useState<number[]>([]);
    const [options, setOptions] = useState<string[][]>([]);
    const [selectedWords, setSelectedWords] = useState<string[]>(['', '', '', '']);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    useEffect(() => {
        if (!mnemonic) {
            router.replace('/wallet/new/intro');
            return;
        }

        // 1. Generate 4 unique random indices
        const newIndices = new Set<number>();
        while (newIndices.size < 4) {
            newIndices.add(Math.floor(Math.random() * 24));
        }
        const sortedIndices = Array.from(newIndices).sort((a, b) => a - b);
        setIndices(sortedIndices);

        // 2. Generate options for each index
        const newOptions = sortedIndices.map(index => {
            const correctWord = mnemonic[index];
            const distractors = new Set<string>();
            while (distractors.size < 2) {
                const randomWord = BIP39_WORDLIST[Math.floor(Math.random() * BIP39_WORDLIST.length)];
                if (randomWord !== correctWord) {
                    distractors.add(randomWord);
                }
            }
            // Shuffle options
            return [correctWord, ...Array.from(distractors)].sort(() => Math.random() - 0.5);
        });
        setOptions(newOptions);
    }, [mnemonic]);

    const handleSelect = (word: string, index: number) => {
        const newSelected = [...selectedWords];
        newSelected[index] = word;
        setSelectedWords(newSelected);
        setError(null);
    };

    const handleConfirm = async () => {
        if (!mnemonic) return;

        // Check if all words are selected
        if (selectedWords.some(w => w === '')) {
            setError('Please select a word for each number.');
            return;
        }

        // Validate
        for (let i = 0; i < 4; i++) {
            if (selectedWords[i] !== mnemonic[indices[i]]) {
                setError(`Word #${indices[i] + 1} is incorrect.`);
                return;
            }
        }

        setIsSubmitting(true);

        // Use setTimeout to allow the UI to render the loading state before the main thread is blocked by crypto work
        setTimeout(async () => {
            try {
                // Derive and save
                const wallet = WalletService.importMnemonic(mnemonic);
                await SecureStorage.saveEncryptedKey('private_key', wallet.privateKey);
                await SecureStorage.saveEncryptedKey('mnemonic', mnemonic.join(' '));

                // Save the wallet address to store
                setWalletAddress(wallet.address);

                // Clear sensitive data from memory
                clearMnemonic();
                setWalletCreated(true);

                // Navigate to App Lock setup
                router.push('/auth/set-pin');
            } catch (e) {
                setModalConfig({
                    visible: true,
                    title: 'Error',
                    message: 'Failed to save wallet securely.',
                    variant: 'error',
                    onClose: closePortal
                });
                setIsSubmitting(false);
            }
        }, 100);
    };

    if (indices.length === 0 || options.length === 0) return null;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.stepIndicator}>Step 3 of 3</Text>
            <Text style={styles.title}>Confirm Your Recovery Phrase</Text>
            <Text style={styles.description}>
                Please tap the correct answer for the seed phrases below.
            </Text>

            <View style={styles.form}>
                {indices.map((wordIndex, i) => (
                    <View key={wordIndex} style={styles.questionContainer}>
                        <Text style={styles.label}>Word #{wordIndex + 1}</Text>
                        <View style={styles.optionsRow}>
                            {options[i].map((word) => {
                                const isSelected = selectedWords[i] === word;
                                return (
                                    <TouchableOpacity
                                        key={word}
                                        style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
                                        onPress={() => handleSelect(word, i)}
                                    >
                                        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                                            {word}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                ))}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
                style={[styles.button, isSubmitting && styles.buttonDisabled]}
                onPress={handleConfirm}
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.buttonText}>Creating Secure Wallet...</Text>
                    </View>
                ) : (
                    <Text style={styles.buttonText}>Confirm</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backButtonText}>Back to View Phrase</Text>
            </TouchableOpacity>

            <InfoModal
                visible={modalConfig.visible}
                onClose={modalConfig.onClose}
                title={modalConfig.title}
                message={modalConfig.message}
                variant={modalConfig.variant}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        padding: 24,
        paddingBottom: 100,
    },
    stepIndicator: {
        color: '#666',
        textAlign: 'center',
        marginBottom: 16,
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
        lineHeight: 24,
    },
    form: {
        gap: 24,
        marginBottom: 32,
    },
    questionContainer: {
        gap: 12,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    optionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    optionButton: {
        flex: 1,
        minWidth: '30%',
        backgroundColor: '#f0f0f0',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    optionButtonSelected: {
        backgroundColor: '#e6f2ff',
        borderColor: '#007AFF',
    },
    optionText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    optionTextSelected: {
        color: '#007AFF',
        fontWeight: '600',
    },
    errorText: {
        color: 'red',
        marginBottom: 16,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
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
    backButton: {
        alignItems: 'center',
    },
    backButtonText: {
        color: '#007AFF',
        fontSize: 16,
    },
});

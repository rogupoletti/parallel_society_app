import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useWalletStore } from '@/store/walletStore';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function DisplayPhraseScreen() {
    const router = useRouter();
    const mnemonic = useWalletStore((state) => state.mnemonic);
    const [confirmed, setConfirmed] = useState(false);
    const [showLarge, setShowLarge] = useState(false);

    if (!mnemonic) {
        router.replace('/wallet/new/intro');
        return null;
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.stepIndicator}>Step 2 of 3</Text>
            <Text style={styles.title}>Your Recovery Phrase</Text>

            <View style={styles.warningBanner}>
                <Ionicons name="warning" size={24} color="#856404" />
                <Text style={styles.warningText}>
                    CRITICAL: Do NOT screenshot. Write these words down on paper and store them safely.
                </Text>
            </View>

            <View style={styles.grid}>
                {mnemonic.map((word, index) => (
                    <View key={index} style={styles.wordContainer}>
                        <Text style={styles.wordNumber}>{index + 1}</Text>
                        <Text style={[styles.wordText, showLarge && styles.largeText]}>{word}</Text>
                    </View>
                ))}
            </View>

            <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setShowLarge(!showLarge)}
            >
                <Text style={styles.toggleText}>
                    {showLarge ? "Show Normal Font" : "Show in Large Font"}
                </Text>
            </TouchableOpacity>

            <View style={styles.checkboxContainer}>
                <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setConfirmed(!confirmed)}
                >
                    <View style={[styles.checkboxInner, confirmed && styles.checkboxChecked]} />
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>
                    I have written down my recovery phrase.
                </Text>
            </View>

            <TouchableOpacity
                style={[styles.button, !confirmed && styles.buttonDisabled]}
                onPress={() => router.push('/wallet/new/confirm')}
                disabled={!confirmed}
            >
                <Text style={styles.buttonText}>Next: Confirm Phrase</Text>
            </TouchableOpacity>
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
        marginBottom: 24,
    },
    warningBanner: {
        flexDirection: 'row',
        backgroundColor: '#fff3cd',
        padding: 16,
        borderRadius: 8,
        marginBottom: 24,
        alignItems: 'center',
    },
    warningText: {
        color: '#856404',
        marginLeft: 12,
        flex: 1,
        fontSize: 14,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    wordContainer: {
        width: '48%',
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        alignItems: 'center',
    },
    wordNumber: {
        color: '#999',
        width: 24,
        fontSize: 14,
    },
    wordText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    largeText: {
        fontSize: 20,
    },
    toggleButton: {
        alignItems: 'center',
        marginBottom: 32,
    },
    toggleText: {
        color: '#007AFF',
        fontSize: 16,
    },
    checkboxContainer: {
        flexDirection: 'row',
        marginBottom: 24,
        alignItems: 'center',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#ddd',
        borderRadius: 6,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxInner: {
        width: 14,
        height: 14,
        borderRadius: 2,
    },
    checkboxChecked: {
        backgroundColor: '#007AFF',
    },
    checkboxLabel: {
        flex: 1,
        fontSize: 14,
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

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { WalletService } from '@/core/wallet/WalletService';
import { useWalletStore } from '@/store/walletStore';

export default function WalletIntroScreen() {
    const router = useRouter();
    const setMnemonic = useWalletStore((state) => state.setMnemonic);

    const handleGenerate = () => {
        const mnemonic = WalletService.generateMnemonic();
        setMnemonic(mnemonic);
        router.push('/wallet/new/display');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.stepIndicator}>Step 1 of 3</Text>
            <Text style={styles.title}>Your Recovery Phrase</Text>

            <View style={styles.imageContainer}>
                {/* Placeholder for lock image */}
                <View style={styles.placeholderImage} />
            </View>

            <Text style={styles.description}>
                We will now generate a 24-word phrase that acts as the master key to your digital identity and assets.
            </Text>
            <Text style={styles.description}>
                This phrase is the only way to recover your account if you lose your device. We cannot recover it for you. Please get a pen and paper ready to write it down.
            </Text>

            <TouchableOpacity style={styles.button} onPress={handleGenerate}>
                <Text style={styles.buttonText}>Generate My 24-Word Phrase</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 24,
        alignItems: 'center',
    },
    stepIndicator: {
        color: '#666',
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 40,
        color: '#1a1a1a',
    },
    imageContainer: {
        marginBottom: 40,
    },
    placeholderImage: {
        width: 120,
        height: 120,
        backgroundColor: '#f0f0f0',
        borderRadius: 60,
    },
    description: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        marginTop: 'auto',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

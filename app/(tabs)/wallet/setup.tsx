import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOnboardingStore } from '@/store/onboardingStore';

export default function WalletSetupScreen() {
    const router = useRouter();
    const { setWalletMode } = useOnboardingStore();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.iconCircle}>
                    <Ionicons name="wallet-outline" size={48} color="#007AFF" />
                </View>
                <Text style={styles.title}>Your Digital Nation Wallet</Text>
                <Text style={styles.subtitle}>
                    Your wallet controls your tokens, voting power, and shares in this nation.
                </Text>
            </View>

            <View style={styles.cards}>
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => {
                        setWalletMode('CREATE');
                        router.push('/legal');
                    }}
                >
                    <View style={styles.cardIcon}>
                        <Ionicons name="add-circle-outline" size={32} color="#007AFF" />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Create New Wallet</Text>
                        <Text style={styles.cardDesc}>I'm new here, create a new secure wallet for me.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.card}
                    onPress={() => {
                        setWalletMode('IMPORT');
                        router.push('/legal');
                    }}
                >
                    <View style={styles.cardIcon}>
                        <Ionicons name="download-outline" size={32} color="#007AFF" />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Import Existing Wallet</Text>
                        <Text style={styles.cardDesc}>I already have a wallet and want to use my seed phrase.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#ccc" />
                </TouchableOpacity>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 48,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#e1f5fe',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
        color: '#1a1a1a',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
    },
    cards: {
        gap: 16,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardIcon: {
        width: 48,
        height: 48,
        backgroundColor: '#e1f5fe',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
        color: '#1a1a1a',
    },
    cardDesc: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
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

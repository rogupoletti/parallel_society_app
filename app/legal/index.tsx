import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function LegalScreen() {
    const router = useRouter();
    const [agreed, setAgreed] = useState(false);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.stepIndicator}>Step 1 of 3</Text>

            <Text style={styles.description}>
                Please review and agree to the following documents to become a citizen of our digital nation.
            </Text>

            <TouchableOpacity
                style={styles.card}
                onPress={() => router.push('/legal/principles')}
            >
                <View style={styles.iconPlaceholder} />
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Principles of Liberty</Text>
                    <Text style={styles.cardDesc}>These principles outline your rights, responsibilities, and our core values.</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.card}
                onPress={() => router.push('/legal/charter')}
            >
                <View style={styles.iconPlaceholder} />
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Digital Nation Charter</Text>
                    <Text style={styles.cardDesc}>This charter defines the core principles, governance, and values of our digital nation.</Text>
                </View>
            </TouchableOpacity>

            <View style={styles.agreementContainer}>
                <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setAgreed(!agreed)}
                >
                    <View style={[styles.checkboxInner, agreed && styles.checkboxChecked]} />
                </TouchableOpacity>
                <Text style={styles.agreementText}>
                    I have read, understood, and agree to the Principles of Liberty and the Digital Nation Charter.
                </Text>
            </View>

            <TouchableOpacity
                style={[styles.button, !agreed && styles.buttonDisabled]}
                onPress={() => router.push('/onboarding/create-profile')}
                disabled={!agreed}
            >
                <Text style={styles.buttonText}>Continue to Wallet Setup</Text>
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
        marginBottom: 24,
        marginTop: 8,
    },
    description: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
    },
    card: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        marginBottom: 16,
        alignItems: 'center',
    },
    iconPlaceholder: {
        width: 40,
        height: 40,
        backgroundColor: '#e1f5fe',
        borderRadius: 8,
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 14,
        color: '#666',
    },
    agreementContainer: {
        flexDirection: 'row',
        marginTop: 16,
        marginBottom: 32,
        alignItems: 'flex-start',
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
        marginTop: 2,
    },
    checkboxInner: {
        width: 14,
        height: 14,
        borderRadius: 2,
    },
    checkboxChecked: {
        backgroundColor: '#007AFF',
    },
    agreementText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
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

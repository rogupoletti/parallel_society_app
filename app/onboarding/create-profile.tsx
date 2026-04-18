import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useState, useEffect } from 'react';
import { AuthService } from '@/core/services/AuthService';

export default function CreateProfileScreen() {
    const router = useRouter();
    const { username, email, setUsername, setEmail, walletMode } = useOnboardingStore();
    const [isValidating, setIsValidating] = useState(false);
    const [availabilityError, setAvailabilityError] = useState<string | null>(null);
    const [isAvailable, setIsAvailable] = useState(false);

    useEffect(() => {
        if (!username) {
            setAvailabilityError(null);
            setIsAvailable(false);
            return;
        }

        // Basic client-side check first to save requests
        const usernameRegex = /^[a-z0-9_]{5,20}$/;
        if (!usernameRegex.test(username)) {
            setAvailabilityError('5-20 characters, lowercase, numbers, or underscores.');
            setIsAvailable(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsValidating(true);
            setAvailabilityError(null);
            try {
                const result = await AuthService.isUsernameAvailable(username);
                if (result.available) {
                    setIsAvailable(true);
                    setAvailabilityError(null);
                } else {
                    setIsAvailable(false);
                    setAvailabilityError(result.error || 'Username not available');
                }
            } catch (error) {
                setAvailabilityError('Failed to check availability');
            } finally {
                setIsValidating(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [username]);

    const navigateToWallet = () => {
        if (walletMode === 'CREATE') {
            router.push('/wallet/new/intro');
        } else if (walletMode === 'IMPORT') {
            router.push('/wallet/import');
        } else {
            router.push('/wallet/setup');
        }
    };

    const handleNext = () => {
        if (!isAvailable || isValidating) return;
        navigateToWallet();
    };

    const handleSkip = () => {
        // Clear username and email if skipping identification
        setUsername('');
        setEmail('');
        navigateToWallet();
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <Text style={styles.stepIndicator}>Step 2 of 3</Text>
                <Text style={styles.description}>
                    Let's start with the basics. Your username will be your public identity.
                </Text>

                <View style={styles.form}>
                    <View style={styles.labelRow}>
                        <Text style={styles.label}>Username</Text>
                        {isValidating && <ActivityIndicator size="small" color="#007AFF" />}
                    </View>
                    <TextInput
                        style={[
                            styles.input,
                            availabilityError ? styles.inputError : (isAvailable ? styles.inputSuccess : null)
                        ]}
                        placeholder="e.g., citizen_one"
                        value={username}
                        onChangeText={(text) => setUsername(text.toLowerCase().replace(/\s/g, ''))}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {availabilityError && <Text style={styles.errorText}>{availabilityError}</Text>}
                    {isAvailable && !isValidating && <Text style={styles.successText}>Username available!</Text>}

                    <Text style={[styles.label, { marginTop: 16 }]}>Email (Recommended)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="you@example.com"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.button, (!isAvailable || isValidating) && styles.buttonDisabled]}
                        onPress={handleNext}
                        disabled={!isAvailable || isValidating}
                    >
                        <Text style={styles.buttonText}>Next</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.skipButton}
                        onPress={handleSkip}
                    >
                        <Text style={styles.skipButtonText}>Skip identification</Text>
                    </TouchableOpacity>
                </View>
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
    },
    stepIndicator: {
        color: '#666',
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    form: {
        gap: 16,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1a1a1a',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    inputError: {
        borderColor: '#FF3B30',
        backgroundColor: '#FFF9F9',
    },
    inputSuccess: {
        borderColor: '#34C759',
        backgroundColor: '#F2FFF5',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    successText: {
        color: '#34C759',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    footer: {
        marginTop: 48,
        gap: 16,
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
    skipButton: {
        alignItems: 'center',
    },
    skipButtonText: {
        color: '#007AFF',
        fontSize: 16,
    },
});

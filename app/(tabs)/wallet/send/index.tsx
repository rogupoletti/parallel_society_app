import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWalletStore } from '@/store/walletStore';
import { TokenSymbol } from '@/core/config/tokens';
import { useSendTransaction } from '@/hooks/useSendTransaction';

export default function SendScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { balances, walletAddress } = useWalletStore();

    const {
        selectedToken,
        setSelectedToken,
        toAddress,
        handleAddressChange,
        amount,
        handleAmountChange,
        handleSetMax,
        isAddressValid,
        feeResult,
        calculatingFee,
        errorData,
        validateBeforeReview
    } = useSendTransaction({
        initialToken: (params.token as TokenSymbol) || 'RBTC',
        balances,
        walletAddress
    });

    const onNext = () => {
        if (validateBeforeReview() && feeResult) {
            router.push({
                pathname: '/wallet/send/review',
                params: {
                    token: selectedToken,
                    to: toAddress,
                    amount,
                    feeFormatted: feeResult.formattedFee,
                    feeRaw: feeResult.totalFee.toString(),
                    gasLimit: feeResult.gasLimit.toString(),
                    gasPrice: feeResult.gasPrice.toString()
                }
            });
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <Stack.Screen options={{ 
                title: `Send ${selectedToken}`, 
                headerBackTitle: 'Wallet',
                headerStyle: { backgroundColor: '#F8F9FB' },
                headerShadowVisible: false,
            }} />

            <ScrollView contentContainerStyle={styles.content}>

                {/* Token Selector - Glass effect */}
                <View style={styles.tokenGlassSelector}>
                    {(['RBTC', 'LUT'] as TokenSymbol[]).map((t) => (
                        <TouchableOpacity
                            key={t}
                            style={[
                                styles.tokenOption, 
                                selectedToken === t && styles.tokenOptionSelected
                            ]}
                            onPress={() => setSelectedToken(t)}
                        >
                            <Text style={[
                                styles.tokenOptionText, 
                                selectedToken === t && styles.tokenOptionTextSelected
                            ]}>
                                {t}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Available Balance */}
                <View style={styles.balanceContainer}>
                    <Text style={styles.balanceLabel}>Available Balance</Text>
                    <Text style={styles.balanceValue}>
                        {balances[selectedToken]?.formatted || '0.00'} <Text style={styles.balanceValueSymbol}>{selectedToken}</Text>
                    </Text>
                </View>

                {/* Glassmorphism Cards for Inputs */}
                <View style={styles.glassCard}>
                    {/* To Address */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Recipient Address</Text>
                        <TextInput
                            style={[styles.input, !isAddressValid && styles.inputError]}
                            placeholder="0x..."
                            placeholderTextColor="#A0AEC0"
                            value={toAddress}
                            onChangeText={handleAddressChange}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {errorData?.field === 'address' && (
                            <Text style={styles.errorText}>{errorData.message}</Text>
                        )}
                    </View>

                    {/* Amount */}
                    <View style={styles.inputGroup}>
                        <View style={styles.labelRow}>
                            <Text style={styles.label}>Amount</Text>
                            <TouchableOpacity onPress={handleSetMax} style={styles.maxButton}>
                                <Text style={styles.maxButtonText}>MAX</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.amountInputContainer, errorData?.field === 'amount' && styles.inputError]}>
                            <TextInput
                                style={styles.amountInput}
                                placeholder="0.00"
                                placeholderTextColor="#A0AEC0"
                                value={amount}
                                onChangeText={handleAmountChange}
                                keyboardType="decimal-pad"
                            />
                            <Text style={styles.inputSuffix}>{selectedToken}</Text>
                        </View>
                        {errorData?.field === 'amount' && (
                            <Text style={styles.errorText}>{errorData.message}</Text>
                        )}
                    </View>
                </View>

                {/* Fee Estimate */}
                <View style={styles.feeGlassContainer}>
                    <View style={styles.feeRow}>
                        <Text style={styles.feeLabel}>Network Fee Estimate</Text>
                        {calculatingFee ? (
                            <ActivityIndicator size="small" color="#4A5568" />
                        ) : feeResult ? (
                            <Text style={styles.feeValue}>{parseFloat(feeResult.formattedFee).toFixed(6)} RBTC</Text>
                        ) : (
                            <Text style={styles.feeValue}>--</Text>
                        )}
                    </View>
                    {errorData?.field === 'fee' && (
                        <Text style={styles.errorTextCenter}>{errorData.message}</Text>
                    )}
                </View>

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.primaryButton,
                        (!toAddress || !amount || !feeResult || calculatingFee) && styles.primaryButtonDisabled
                    ]}
                    onPress={onNext}
                    disabled={!toAddress || !amount || !feeResult || calculatingFee}
                >
                    <Text style={styles.primaryButtonText}>Review & Send</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FB', // Soft off-white backdrop
    },
    content: {
        padding: 24,
    },
    tokenGlassSelector: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 16,
        padding: 6,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 1,
    },
    tokenOption: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 12,
    },
    tokenOptionSelected: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    tokenOptionText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#A0AEC0',
    },
    tokenOptionTextSelected: {
        color: '#2D3748',
    },
    balanceContainer: {
        alignItems: 'center',
        marginBottom: 36,
    },
    balanceLabel: {
        fontSize: 14,
        color: '#718096',
        marginBottom: 8,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    balanceValue: {
        fontSize: 36,
        fontWeight: '800',
        color: '#1A202C',
        letterSpacing: -1,
    },
    balanceValueSymbol: {
        fontSize: 20,
        fontWeight: '600',
        color: '#4A5568',
    },
    glassCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 1)',
        shadowColor: '#4A5568',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 2,
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A5568',
        marginBottom: 8,
    },
    maxButton: {
        backgroundColor: '#EBF4FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    maxButtonText: {
        fontSize: 12,
        color: '#3182CE',
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        color: '#2D3748',
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        paddingHorizontal: 16,
    },
    amountInput: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 20,
        fontWeight: '700',
        color: '#2D3748',
    },
    inputSuffix: {
        fontSize: 16,
        fontWeight: '700',
        color: '#A0AEC0',
        marginLeft: 8,
    },
    inputError: {
        borderColor: '#FC8181',
        backgroundColor: '#FFF5F5',
    },
    errorText: {
        color: '#E53E3E',
        fontSize: 13,
        marginTop: 6,
        fontWeight: '500',
    },
    errorTextCenter: {
        color: '#E53E3E',
        fontSize: 13,
        marginTop: 6,
        textAlign: 'center',
        fontWeight: '500',
    },
    feeGlassContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    feeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    feeLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#718096',
    },
    feeValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2D3748',
    },
    footer: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        backgroundColor: '#F8F9FB',
    },
    primaryButton: {
        backgroundColor: '#3182CE',
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#3182CE',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 4,
    },
    primaryButtonDisabled: {
        backgroundColor: '#A0AEC0',
        shadowOpacity: 0,
        elevation: 0,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});

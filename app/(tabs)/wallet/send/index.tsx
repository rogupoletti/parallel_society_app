import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useWalletStore } from '@/store/walletStore';
import { TOKENS, TokenSymbol } from '@/core/config/tokens';
import { sendService, FeeResult } from '@/core/services/SendService';
import { ethers } from 'ethers';
import { debounce } from 'lodash';

export default function SendScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { balances, walletAddress } = useWalletStore();

    // State
    const [selectedToken, setSelectedToken] = useState<TokenSymbol>((params.token as TokenSymbol) || 'RBTC');
    const [toAddress, setToAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [isAddressValid, setIsAddressValid] = useState(true);
    const [feeResult, setFeeResult] = useState<FeeResult | null>(null);
    const [calculatingFee, setCalculatingFee] = useState(false);
    const [errorData, setErrorData] = useState<{ field: 'address' | 'amount' | 'fee'; message: string } | null>(null);

    // Debounced Fee Estimation
    const estimateFee = useCallback(
        async (token: TokenSymbol, to: string, amt: string) => {
            if (!ethers.isAddress(to) || !walletAddress) return;

            setCalculatingFee(true);
            setFeeResult(null);
            setErrorData(null); // Clear previous errors during calculation

            try {
                const result = await sendService.estimateSendFee({
                    token,
                    to,
                    amount: amt || '0',
                    from: walletAddress
                });
                setFeeResult(result);
            } catch (error) {
                console.error('Fee estimation error:', error);
                setErrorData({ field: 'fee', message: 'Failed to estimate gas fee' });
            } finally {
                setCalculatingFee(false);
            }
        },
        [walletAddress]
    );

    // Debounce the estimator
    useEffect(() => {
        const handler = setTimeout(() => {
            if (walletAddress && ethers.isAddress(toAddress)) {
                estimateFee(selectedToken, toAddress, amount);
            } else {
                setFeeResult(null);
            }
        }, 500);

        return () => clearTimeout(handler);
    }, [selectedToken, toAddress, amount, walletAddress]);

    // Input Handlers
    const handleAddressChange = (text: string) => {
        setToAddress(text);
        setIsAddressValid(text === '' || ethers.isAddress(text));
        if (text !== '' && !ethers.isAddress(text)) {
            setErrorData({ field: 'address', message: 'Invalid address format' });
        } else {
            // Clear address error if valid
            if (errorData?.field === 'address') setErrorData(null);
        }
    };

    const handleAmountChange = (text: string) => {
        // Normalize: replace comma with dot to support all keyboards
        const normalizedText = text.replace(',', '.');

        // Allow decimals
        if (/^\d*\.?\d*$/.test(normalizedText) || text === '') {
            setAmount(normalizedText);
            if (errorData?.field === 'amount') setErrorData(null);
        }
    };

    const handleSetMax = () => {
        const balance = balances[selectedToken]?.formatted || '0';

        if (selectedToken === 'RBTC' && feeResult) {
            // For RBTC, subtract fee from balance
            // This is a naive estimation, user might need to adjust manually if fee changes
            // Converting everything to BigInt for precision would be better, but strings work for simple case
            const feeVal = parseFloat(feeResult.formattedFee);
            const balanceVal = parseFloat(balance);
            const max = Math.max(0, balanceVal - feeVal * 1.5); // 1.5x buffer for safety
            setAmount(max.toFixed(6));
        } else {
            // For Tokens, full balance
            setAmount(balance);
        }
    };

    const validateBeforeReview = () => {
        if (!walletAddress) return false;
        if (!isAddressValid || !toAddress) {
            setErrorData({ field: 'address', message: 'Valid address required' });
            return false;
        }

        const amtVal = parseFloat(amount || '0');
        if (amtVal <= 0) {
            setErrorData({ field: 'amount', message: 'Amount must be greater than 0' });
            return false;
        }

        const balanceVal = parseFloat(balances[selectedToken]?.formatted || '0');
        if (amtVal > balanceVal) {
            setErrorData({ field: 'amount', message: 'Insufficient balance' });
            return false;
        }

        if (selectedToken === 'LUT' && feeResult) {
            // Check if we have enough RBTC for fee
            const rbtcBalance = parseFloat(balances.RBTC?.formatted || '0');
            const feeVal = parseFloat(feeResult.formattedFee);
            if (feeVal > rbtcBalance) {
                setErrorData({ field: 'fee', message: 'Insufficient RBTC for network fee' });
                return false;
            }
        }

        return true;
    };

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
            <Stack.Screen options={{ title: `Send ${selectedToken}`, headerBackTitle: 'Wallet' }} />

            <ScrollView contentContainerStyle={styles.content}>

                {/* Token Selector */}
                <View style={styles.tokenSelector}>
                    {(['RBTC', 'LUT'] as TokenSymbol[]).map((t) => (
                        <TouchableOpacity
                            key={t}
                            style={[styles.tokenOption, selectedToken === t && styles.tokenOptionSelected]}
                            onPress={() => setSelectedToken(t)}
                        >
                            <Text style={[styles.tokenOptionText, selectedToken === t && styles.tokenOptionTextSelected]}>
                                {t}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Available Balance */}
                <View style={styles.balanceContainer}>
                    <Text style={styles.balanceLabel}>Available Balance</Text>
                    <Text style={styles.balanceValue}>
                        {balances[selectedToken]?.formatted || '0.00'} {selectedToken}
                    </Text>
                </View>

                {/* To Address */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>To Address</Text>
                    <TextInput
                        style={[styles.input, !isAddressValid && styles.inputError]}
                        placeholder="0x..."
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
                        <TouchableOpacity onPress={handleSetMax}>
                            <Text style={styles.maxButton}>Max</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.amountInputContainer}>
                        <TextInput
                            style={[styles.amountInput]}
                            placeholder="0.00"
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

                {/* Fee Estimate */}
                <View style={styles.feeContainer}>
                    <View style={styles.feeRow}>
                        <Text style={styles.feeLabel}>Estimated Fee</Text>
                        {calculatingFee ? (
                            <ActivityIndicator size="small" color="#666" />
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
        backgroundColor: '#fff',
    },
    content: {
        padding: 24,
    },
    tokenSelector: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 4,
        marginBottom: 24,
    },
    tokenOption: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    tokenOptionSelected: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tokenOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    tokenOptionTextSelected: {
        color: '#007AFF',
    },
    balanceContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    balanceLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    balanceValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    inputGroup: {
        marginBottom: 24,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    maxButton: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '600',
        backgroundColor: '#e1f5fe',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    input: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#e1e1e1',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1a1a1a',
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#e1e1e1',
        borderRadius: 12,
        paddingHorizontal: 16,
    },
    amountInput: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    inputSuffix: {
        fontSize: 16,
        fontWeight: '600',
        color: '#999',
        marginLeft: 8,
    },
    inputError: {
        borderColor: '#dc3545',
    },
    errorText: {
        color: '#dc3545',
        fontSize: 12,
        marginTop: 4,
    },
    errorTextCenter: {
        color: '#dc3545',
        fontSize: 12,
        marginTop: 4,
        textAlign: 'center',
    },
    feeContainer: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 12,
        marginTop: 8,
    },
    feeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    feeLabel: {
        fontSize: 14,
        color: '#666',
    },
    feeValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1a1a1a',
    },
    footer: {
        padding: 24,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    primaryButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    primaryButtonDisabled: {
        backgroundColor: '#9ccaf9',
        opacity: 0.7,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

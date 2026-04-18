import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useWalletStore } from '@/store/walletStore';
import { sendService } from '@/core/services/SendService';
import { SecureStorage } from '@/core/secure/SecureStorage';
import { ethers } from 'ethers';
import { TokenSymbol } from '@/core/config/tokens';
import { InfoModal } from '@/components/ui/InfoModal';

export default function ReviewScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { addPendingTx } = useWalletStore();
    const [sending, setSending] = useState(false);

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

    // Params
    const token = params.token as TokenSymbol;
    const to = params.to as string;
    const amount = params.amount as string;
    const feeFormatted = params.feeFormatted as string;
    const feeRaw = params.feeRaw as string; // used for logging if needed
    const gasLimit = params.gasLimit as string;
    const gasPrice = params.gasPrice as string;

    // Attempt to reconstruct numbers
    const totalDisplay = token === 'RBTC'
        ? (parseFloat(amount) + parseFloat(feeFormatted)).toFixed(6) + ' RBTC'
        : `${amount} ${token} + ${parseFloat(feeFormatted).toFixed(6)} RBTC`;

    const handleConfirm = async () => {
        setSending(true);
        try {
            // 1. Get Private Key
            const privateKey = await SecureStorage.getEncryptedKey('private_key');
            if (!privateKey) {
                throw new Error('Wallet not initialized properly');
            }

            // 2. Create Wallet Instance
            const wallet = new ethers.Wallet(privateKey);

            // 3. Send
            const txResponse = await sendService.sendTransaction({
                token,
                to,
                amount,
                wallet,
                gasLimit: gasLimit ? BigInt(gasLimit) : undefined,
                gasPrice: gasPrice ? BigInt(gasPrice) : undefined
            });

            console.log('Transaction sent:', txResponse.hash);

            // 4. Add to Pending Store
            addPendingTx({
                hash: txResponse.hash,
                token: token,
                direction: 'out',
                title: `Sent ${token}`,
                from: wallet.address,
                to,
                amount: amount,
                rawAmount: token === 'RBTC' ? ethers.parseEther(amount).toString() : ethers.parseUnits(amount, 18).toString(),
                timestamp: Date.now(),
                status: 'pending'
            });

            // 5. Show Success Modal
            setModalConfig({
                visible: true,
                title: 'Success',
                message: 'Transaction Sent!',
                variant: 'success',
                onClose: () => {
                    setModalConfig(prev => ({ ...prev, visible: false }));
                    router.replace('/wallet');
                }
            });

        } catch (error) {
            console.error('Send failed:', error);
            setModalConfig({
                visible: true,
                title: 'Transaction Failed',
                message: (error as Error).message,
                variant: 'error',
                onClose: () => setModalConfig(prev => ({ ...prev, visible: false }))
            });
        } finally {
            setSending(false);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Review Transaction', headerBackTitle: 'Back' }} />

            <View style={styles.content}>

                {/* Warning Card */}
                <View style={styles.warningCard}>
                    <Ionicons name="warning-outline" size={24} color="#856404" />
                    <Text style={styles.warningText}>
                        Transactions on Rootstock are irreversible. Double-check the address and amount.
                    </Text>
                </View>

                {/* Amount Display */}
                <View style={styles.amountContainer}>
                    <Text style={styles.amountValue}>{amount} {token}</Text>
                    <Text style={styles.amountLabel}>SENDING AMOUNT</Text>
                </View>

                {/* Details Card */}
                <View style={styles.detailsCard}>
                    <View style={styles.row}>
                        <Text style={styles.label}>To</Text>
                        <View style={styles.addressBox}>
                            <Text style={styles.value} numberOfLines={1} ellipsizeMode="middle">
                                {to}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.row}>
                        <Text style={styles.label}>Network Fee</Text>
                        <Text style={styles.value}>{parseFloat(feeFormatted).toFixed(6)} RBTC</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.row}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>{totalDisplay}</Text>
                    </View>
                </View>

            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.primaryButton, sending && styles.primaryButtonDisabled]}
                    onPress={handleConfirm}
                    disabled={sending}
                >
                    {sending ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.primaryButtonText}>Confirm & Send</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => router.back()}
                    disabled={sending}
                >
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
            </View>

            <InfoModal
                visible={modalConfig.visible}
                onClose={modalConfig.onClose}
                title={modalConfig.title}
                message={modalConfig.message}
                variant={modalConfig.variant}
            />
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    content: {
        flex: 1,
        padding: 24,
    },
    warningCard: {
        flexDirection: 'row',
        backgroundColor: '#fff3cd',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        alignItems: 'center',
    },
    warningText: {
        flex: 1,
        marginLeft: 12,
        color: '#856404',
        fontSize: 14,
        lineHeight: 20,
    },
    amountContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    amountValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    amountLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#999',
        letterSpacing: 1,
    },
    detailsCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    label: {
        fontSize: 14,
        color: '#666',
    },
    value: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1a1a1a',
    },
    addressBox: {
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        maxWidth: 160,
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 12,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    totalValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
    footer: {
        padding: 24,
        backgroundColor: '#fff',
    },
    primaryButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    primaryButtonDisabled: {
        backgroundColor: '#9ccaf9',
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '500',
    },
});

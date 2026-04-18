import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useWalletStore } from '@/store/walletStore';
import { WalletTx, TxStatus } from '@/core/types/Transaction';
import { ROOTSTOCK } from '@/core/config/RootstockConfig';

export default function TransactionDetailsScreen() {
    const { id } = useLocalSearchParams(); // This is the transaction hash
    const hash = Array.isArray(id) ? id[0] : id; // Normalize expo router params
    const { txHistory } = useWalletStore();
    const [tx, setTx] = useState<WalletTx | null>(null);

    useEffect(() => {
        if (hash) {
            const found = txHistory.find(t => t.hash === hash);
            setTx(found || null);
        }
    }, [hash, txHistory]);

    if (!tx) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Transaction not found</Text>
            </View>
        );
    }

    const openExplorer = () => {
        // Fallback to testnet if not specified, but this should be configurable
        const explorerUrl = process.env.EXPO_PUBLIC_RSK_RPC_URL?.includes('testnet')
            ? `https://explorer.testnet.rsk.co/tx/${tx.hash}`
            : `https://explorer.rsk.co/tx/${tx.hash}`;

        Linking.openURL(explorerUrl);
    };

    const getStatusColor = (status: TxStatus) => {
        switch (status) {
            case 'confirmed': return '#28a745';
            case 'pending': return '#ffc107';
            case 'failed': return '#dc3545';
        }
    };

    const InfoRow = ({ label, value, copyable = false }: { label: string, value: string, copyable?: boolean }) => (
        <View style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity
                disabled={!copyable}
                onPress={() => {/* Copy logic could go here */ }}
                style={styles.valueContainer}
            >
                <Text style={styles.value} numberOfLines={1} ellipsizeMode="middle">
                    {value}
                </Text>
                {copyable && <Ionicons name="copy-outline" size={14} color="#007AFF" style={{ marginLeft: 6 }} />}
            </TouchableOpacity>
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            <Stack.Screen options={{ title: 'Transaction Details', headerBackTitle: 'History' }} />

            <View style={styles.header}>
                <View style={[styles.iconContainer, {
                    backgroundColor: tx.direction === 'in' ? '#e0f2f1' : '#f5f5f5'
                }]}>
                    <Ionicons
                        name={tx.direction === 'in' ? 'arrow-down' : 'arrow-up'}
                        size={32}
                        color={tx.direction === 'in' ? '#009688' : '#757575'}
                    />
                </View>
                <Text style={styles.headerTitle}>{tx.title}</Text>
                <Text style={[styles.headerAmount, {
                    color: tx.direction === 'in' ? '#28a745' : '#1a1a1a'
                }]}>
                    {tx.direction === 'in' ? '+' : '-'}{tx.amount} {tx.token}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tx.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(tx.status) }]}>
                        {tx.status.toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.card}>
                <InfoRow label="Date" value={new Date(tx.timestamp).toLocaleString()} />
                <View style={styles.separator} />

                <InfoRow label="From" value={tx.from} copyable />
                <View style={styles.separator} />

                <InfoRow label="To" value={tx.to} copyable />
                <View style={styles.separator} />

                <InfoRow label="Hash" value={tx.hash} copyable />

                {tx.fee && (
                    <>
                        <View style={styles.separator} />
                        <InfoRow label="Gas Fee" value={tx.fee} />
                    </>
                )}
            </View>

            <TouchableOpacity style={styles.explorerButton} onPress={openExplorer}>
                <Text style={styles.explorerButtonText}>View on Explorer</Text>
                <Ionicons name="open-outline" size={18} color="#007AFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 16,
    },
    errorText: {
        textAlign: 'center',
        marginTop: 48,
        fontSize: 16,
        color: '#666',
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 12,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '500',
        color: '#666',
        marginBottom: 8,
    },
    headerAmount: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    separator: {
        height: 1,
        backgroundColor: '#f0f0f0',
    },
    label: {
        fontSize: 14,
        color: '#666',
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'flex-end',
        marginLeft: 16,
    },
    value: {
        fontSize: 14,
        color: '#1a1a1a',
        fontWeight: '500',
        maxWidth: 200,
    },
    explorerButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    explorerButtonText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '600',
    },
});

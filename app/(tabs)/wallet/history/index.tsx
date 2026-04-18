import { View, Text, StyleSheet, TouchableOpacity, FlatList, SectionList, ScrollView } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { useWalletStore } from '@/store/walletStore';
import { WalletTx, TxDirection, TxStatus } from '@/core/types/Transaction';
import { InfoModal } from '@/components/ui/InfoModal';

type FilterType = 'All' | 'Received' | 'Sent' | 'Contract' | 'RBTC' | 'LUT';

export default function TransactionHistoryScreen() {
    const router = useRouter();
    const { filter } = useLocalSearchParams();
    const { txHistory, loadTxHistory, loadingTxHistory, walletAddress } = useWalletStore();

    // Modal state
    const [modalConfig, setModalConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        variant?: 'info' | 'error' | 'success' | 'warning';
        actions?: { text: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'danger' }[];
    }>({
        visible: false,
        title: '',
        message: '',
    });

    const closePortal = () => setModalConfig(prev => ({ ...prev, visible: false }));

    // Initialize filter from params if available and valid, otherwise default to 'All'
    const initialFilter = (filter && ['All', 'Received', 'Sent', 'Contract', 'RBTC', 'LUT'].includes(filter as string))
        ? (filter as FilterType)
        : 'All';

    const [activeFilter, setActiveFilter] = useState<FilterType>(initialFilter);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadTxHistory();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadTxHistory();
        setRefreshing(false);
    }, [loadTxHistory]);

    // Filtering logic
    const filteredTransactions = txHistory.filter(tx => {
        if (activeFilter === 'All') return true;
        if (activeFilter === 'Received') return tx.direction === 'in';
        if (activeFilter === 'Sent') return tx.direction === 'out';
        if (activeFilter === 'Contract') return tx.direction === 'contract';
        if (activeFilter === 'RBTC') return tx.token === 'RBTC';
        if (activeFilter === 'LUT') return tx.token === 'LUT';
        return true;
    });

    // Grouping by Date
    const groupedTransactions = filteredTransactions.reduce((groups, tx) => {
        const date = new Date(tx.timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let title = '';
        if (date.toDateString() === today.toDateString()) {
            title = 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            title = 'Yesterday';
        } else {
            title = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }

        if (!groups[title]) {
            groups[title] = [];
        }
        groups[title].push(tx);
        return groups;
    }, {} as Record<string, WalletTx[]>);

    const sections = Object.keys(groupedTransactions).map(title => ({
        title,
        data: groupedTransactions[title]
    }));

    const getDirectionIcon = (direction: TxDirection) => {
        switch (direction) {
            case 'in': return 'arrow-down';
            case 'out': return 'arrow-up';
            case 'contract': return 'document-text'; // or 'lock-closed'
        }
    };

    const getStatusColor = (status: TxStatus) => {
        switch (status) {
            case 'confirmed': return '#28a745'; // Green
            case 'pending': return '#ffc107';   // Orange
            case 'failed': return '#dc3545';    // Red
        }
    };

    const renderItem = ({ item }: { item: WalletTx }) => (
        <TouchableOpacity
            style={styles.txRow}
            onPress={() => router.push(`/wallet/history/${item.hash}`)}
        >
            <View style={[styles.iconContainer, {
                backgroundColor: item.direction === 'in' ? '#e0f2f1' : '#f5f5f5'
            }]}>
                <Ionicons
                    name={getDirectionIcon(item.direction) as any}
                    size={20}
                    color={item.direction === 'in' ? '#009688' : '#757575'}
                />
            </View>

            <View style={styles.txInfo}>
                <Text style={styles.txTitle}>{item.title}</Text>
                <Text style={styles.txDate}>
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>

            <View style={styles.txAmountContainer}>
                <Text style={[styles.txAmount, {
                    color: item.direction === 'in' ? '#28a745' : '#1a1a1a'
                }]}>
                    {item.direction === 'in' ? '+' : '-'}{item.amount} {item.token}
                </Text>
                {item.status !== 'confirmed' ? (
                    <View style={styles.statusBadge}>
                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Text>
                    </View>
                ) : (
                    item.usdValue && <Text style={styles.txUsd}>{item.usdValue}</Text>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Transaction History', headerBackTitle: 'Wallet' }} />

            {/* Subtitle */}
            <Text style={styles.subtitle}>All Tokens</Text>

            {/* Filter Bar */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {(['All', 'Received', 'Sent', 'RBTC', 'LUT'] as FilterType[]).map((filter) => (
                        <TouchableOpacity
                            key={filter}
                            style={[styles.filterChip, activeFilter === filter && styles.activeFilterChip]}
                            onPress={() => setActiveFilter(filter)}
                        >
                            <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>
                                {filter}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Transaction List */}
            <SectionList
                sections={sections}
                keyExtractor={(item) => item.hash}
                renderItem={renderItem}
                renderSectionHeader={({ section: { title } }) => (
                    <Text style={styles.sectionHeader}>{title}</Text>
                )}
                contentContainerStyle={styles.listContent}
                refreshing={refreshing}
                onRefresh={onRefresh}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No transactions found</Text>
                    </View>
                }
                ListFooterComponent={
                    <View style={styles.footerContainer}>
                        <TouchableOpacity
                            style={styles.footerButton}
                            onPress={() => {
                                setModalConfig({
                                    visible: true,
                                    title: 'Receive Assets',
                                    message: 'Select token to receive',
                                    variant: 'info',
                                    actions: [
                                        {
                                            text: 'RBTC',
                                            onPress: () => {
                                                closePortal();
                                                router.push({ pathname: '/wallet/receive', params: { token: 'RBTC' } });
                                            },
                                            variant: 'primary'
                                        },
                                        {
                                            text: 'LUT',
                                            onPress: () => {
                                                closePortal();
                                                router.push({ pathname: '/wallet/receive', params: { token: 'LUT' } });
                                            },
                                            variant: 'primary'
                                        },
                                        {
                                            text: 'Cancel',
                                            onPress: closePortal,
                                            variant: 'secondary'
                                        }
                                    ]
                                });
                            }}
                        >
                            <Ionicons name="arrow-down" size={20} color="#fff" />
                            <Text style={styles.footerButtonText}>Receive</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.footerButton, styles.sendButton]}
                            onPress={() => {
                                const token = (activeFilter === 'LUT' || activeFilter === 'RBTC')
                                    ? activeFilter
                                    : 'RBTC';
                                router.push({ pathname: '/wallet/send', params: { token } });
                            }}
                        >
                            <Ionicons name="arrow-up" size={20} color="#fff" />
                            <Text style={styles.footerButtonText}>Send</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            <InfoModal
                visible={modalConfig.visible}
                onClose={closePortal}
                title={modalConfig.title}
                message={modalConfig.message}
                variant={modalConfig.variant}
                actions={modalConfig.actions}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
    },
    filterContainer: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        marginRight: 8,
    },
    activeFilterChip: {
        backgroundColor: '#007AFF', // Using app primary color based on dashboard
    },
    filterText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    activeFilterText: {
        color: '#fff',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
        backgroundColor: '#fff',
        paddingVertical: 12,
        marginTop: 8,
    },
    txRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f9f9f9',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    txInfo: {
        flex: 1,
    },
    txTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1a1a1a',
        marginBottom: 2,
    },
    txDate: {
        fontSize: 12,
        color: '#999',
    },
    txAmountContainer: {
        alignItems: 'flex-end',
    },
    txAmount: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    txUsd: {
        fontSize: 12,
        color: '#999',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 48,
    },
    emptyText: {
        color: '#999',
        fontSize: 16,
    },
    footerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 24,
        gap: 16,
    },
    footerButton: {
        flexDirection: 'row',
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sendButton: {
        backgroundColor: '#007AFF',
    },
    footerButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    }
});

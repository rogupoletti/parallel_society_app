import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Platform, ToastAndroid } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWalletStore } from '@/store/walletStore';
import { useEffect, useState, useCallback } from 'react';
import { TOKENS } from '@/core/config/tokens';
import { SecureStorage } from '@/core/secure/SecureStorage';
import { ethers } from 'ethers';
import * as Clipboard from 'expo-clipboard';
import { InfoModal } from '@/components/ui/InfoModal';

// Mock USD prices for display (replace with real price feed later)
const MOCK_USD_PRICES = {
    RBTC: 43250.00, // Mock BTC-ish price
    LUT: 0          // No market value for LUT yet
};

export default function WalletDashboardScreen() {
    const router = useRouter();
    const {
        balances,
        loadingBalances,
        balanceError,
        walletAddress,
        loadBalances,
        refreshBalances,
        setWalletAddress
    } = useWalletStore();

    const [refreshing, setRefreshing] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [copied, setCopied] = useState(false);

    // Modal state
    const [modalConfig, setModalConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        description?: string;
        variant?: 'info' | 'error' | 'success' | 'warning';
        actions?: { text: string; onPress: () => void; variant?: 'primary' | 'secondary' }[];
    }>({
        visible: false,
        title: '',
        message: '',
    });

    const closePortal = () => setModalConfig({ ...modalConfig, visible: false });

    // Load wallet address and balances on mount
    useEffect(() => {
        initializeWallet();
    }, []);

    const initializeWallet = async () => {
        try {
            let address = walletAddress;

            // If no address in store, try to derive from stored private key
            if (!address) {
                const privateKey = await SecureStorage.getEncryptedKey('private_key');
                if (privateKey) {
                    const wallet = new ethers.Wallet(privateKey);
                    address = wallet.address;
                    setWalletAddress(address);
                }
            }

            // Load balances with the address (or mock if none)
            const targetAddress = address || '0x742d35Cc6634C0532925a3b844Bc9e7595f1fD45';
            await loadBalances(targetAddress);
        } catch (error) {
            console.error('Failed to initialize wallet:', error);
        } finally {
            setIsInitializing(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refreshBalances();
        setRefreshing(false);
    }, [refreshBalances]);

    // Calculate total USD value
    const calculateTotalUSD = () => {
        let total = 0;

        if (balances.RBTC) {
            const rbtcValue = parseFloat(balances.RBTC.formatted.replace(/,/g, ''));
            total += rbtcValue * MOCK_USD_PRICES.RBTC;
        }

        if (balances.LUT) {
            const lutValue = parseFloat(balances.LUT.formatted.replace(/,/g, ''));
            total += lutValue * MOCK_USD_PRICES.LUT;
        }

        return total.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // Format shortened address
    const shortenAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const copyAddressToClipboard = async () => {
        if (walletAddress) {
            await Clipboard.setStringAsync(walletAddress);
            setCopied(true);

            // Show feedback
            if (Platform.OS === 'android') {
                ToastAndroid.show('Address copied to clipboard', ToastAndroid.SHORT);
            } else {
                setModalConfig({
                    visible: true,
                    title: 'Copied',
                    message: 'Address copied to clipboard',
                    variant: 'success'
                });
            }

            // Reset icon after delay
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="#007AFF"
                />
            }
        >
            {/* Balance Card */}
            <View style={styles.balanceCard}>
                <View style={styles.cardHeader}>
                    <Ionicons name="wallet" size={24} color="#fff" />
                    <Text style={styles.cardTitle}>Total Balance</Text>
                </View>

                {loadingBalances ? (
                    <ActivityIndicator size="large" color="#fff" style={styles.loader} />
                ) : (
                    <>
                        <Text style={styles.totalBalance}>{calculateTotalUSD()}</Text>
                        <TouchableOpacity style={styles.addressContainer} onPress={copyAddressToClipboard}>
                            <Text style={styles.addressText}>
                                {walletAddress ? shortenAddress(walletAddress) : 'No wallet connected'}
                            </Text>
                            <Ionicons
                                name={copied ? "checkmark-circle" : "copy-outline"}
                                size={16}
                                color={copied ? "#34C759" : "rgba(255, 255, 255, 0.7)"}
                                style={{ marginLeft: 6 }}
                            />
                        </TouchableOpacity>
                    </>
                )}
            </View>

            {/* Error Banner */}
            {balanceError && (
                <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={20} color="#dc3545" />
                    <Text style={styles.errorText}>{balanceError}</Text>
                </View>
            )}

            {/* Token List */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Assets</Text>

                {/* RBTC Token */}
                <TouchableOpacity
                    style={styles.tokenCard}
                    onPress={() => router.push({ pathname: '/wallet/history', params: { filter: 'RBTC' } })}
                >
                    <View style={styles.tokenIcon}>
                        <Text style={styles.tokenIconText}>₿</Text>
                    </View>
                    <View style={styles.tokenInfo}>
                        <Text style={styles.tokenName}>Rootstock Bitcoin</Text>
                        <Text style={styles.tokenSymbol}>{TOKENS.RBTC.symbol}</Text>
                    </View>
                    <View style={styles.tokenBalance}>
                        {loadingBalances ? (
                            <ActivityIndicator size="small" color="#007AFF" />
                        ) : (
                            <>
                                <Text style={styles.tokenAmount}>
                                    {balances.RBTC?.formatted || '0.00'}
                                </Text>
                                {MOCK_USD_PRICES.RBTC > 0 && (
                                    <Text style={styles.tokenUsd}>
                                        ≈ ${balances.RBTC
                                            ? (parseFloat(balances.RBTC.formatted.replace(/,/g, '')) * MOCK_USD_PRICES.RBTC).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                            : '0.00'}
                                    </Text>
                                )}
                            </>
                        )}
                    </View>
                </TouchableOpacity>

                {/* LUT Token */}
                <TouchableOpacity
                    style={styles.tokenCard}
                    onPress={() => router.push({ pathname: '/wallet/history', params: { filter: 'LUT' } })}
                >
                    <View style={[styles.tokenIcon, styles.lutIcon]}>
                        <Text style={styles.tokenIconText}>◈</Text>
                    </View>
                    <View style={styles.tokenInfo}>
                        <Text style={styles.tokenName}>Libertarian Universe Token</Text>
                        <Text style={styles.tokenSymbol}>{TOKENS.LUT.symbol}</Text>
                    </View>
                    <View style={styles.tokenBalance}>
                        {loadingBalances ? (
                            <ActivityIndicator size="small" color="#007AFF" />
                        ) : (
                            <>
                                <Text style={styles.tokenAmount}>
                                    {balances.LUT?.formatted || '0.00'}
                                </Text>
                                {MOCK_USD_PRICES.LUT > 0 && (
                                    <Text style={styles.tokenUsd}>
                                        ≈ ${balances.LUT
                                            ? (parseFloat(balances.LUT.formatted.replace(/,/g, '')) * MOCK_USD_PRICES.LUT).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                            : '0.00'}
                                    </Text>
                                )}
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                        router.push('/wallet/history');
                    }}
                >
                    <View style={styles.actionIcon}>
                        <Ionicons name="time-outline" size={24} color="#007AFF" />
                    </View>
                    <Text style={styles.actionText}>History</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                        setModalConfig({
                            visible: true,
                            title: 'Receive Assets',
                            message: 'Select token to receive',
                            actions: [
                                {
                                    text: 'RBTC (Rootstock Bitcoin)',
                                    onPress: () => {
                                        closePortal();
                                        router.push({ pathname: '/wallet/receive', params: { token: 'RBTC' } });
                                    }
                                },
                                {
                                    text: 'LUT (Governance Token)',
                                    onPress: () => {
                                        closePortal();
                                        router.push({ pathname: '/wallet/receive', params: { token: 'LUT' } });
                                    }
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
                    <View style={styles.actionIcon}>
                        <Ionicons name="arrow-down-outline" size={24} color="#007AFF" />
                    </View>
                    <Text style={styles.actionText}>Receive</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                        // Send
                        router.push('/wallet/send');
                    }}
                >
                    <View style={styles.actionIcon}>
                        <Ionicons name="arrow-up-outline" size={24} color="#007AFF" />
                    </View>
                    <Text style={styles.actionText}>Send</Text>
                </TouchableOpacity>
            </View>

            {/* Info Text */}
            <Text style={styles.infoText}>
                Pull down to refresh balances
            </Text>

            <InfoModal
                visible={modalConfig.visible}
                onClose={closePortal}
                title={modalConfig.title}
                message={modalConfig.message}
                variant={modalConfig.variant}
                actions={modalConfig.actions}
            />
        </ScrollView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    content: {
        padding: 24,
        paddingBottom: 48,
    },
    balanceCard: {
        backgroundColor: '#007AFF',
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 16,
        marginLeft: 8,
        fontWeight: '500',
    },
    loader: {
        marginVertical: 24,
    },
    totalBalance: {
        color: '#fff',
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    addressText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    errorBanner: {
        flexDirection: 'row',
        backgroundColor: '#f8d7da',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        alignItems: 'center',
    },
    errorText: {
        color: '#721c24',
        marginLeft: 8,
        flex: 1,
        fontSize: 14,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 16,
    },
    tokenCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    tokenIcon: {
        width: 48,
        height: 48,
        backgroundColor: '#f7931a',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    lutIcon: {
        backgroundColor: '#6366f1',
    },
    tokenIconText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    tokenInfo: {
        flex: 1,
    },
    tokenName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 2,
    },
    tokenSymbol: {
        fontSize: 14,
        color: '#666',
    },
    tokenBalance: {
        alignItems: 'flex-end',
    },
    tokenAmount: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 2,
    },
    tokenUsd: {
        fontSize: 14,
        color: '#666',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 24,
    },
    actionButton: {
        alignItems: 'center',
    },
    actionIcon: {
        width: 56,
        height: 56,
        backgroundColor: '#e1f5fe',
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
    infoText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 12,
    },
});

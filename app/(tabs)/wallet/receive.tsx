import { View, Text, StyleSheet, TouchableOpacity, Share, ActivityIndicator, ToastAndroid, Platform } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useWalletStore } from '@/store/walletStore';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useState, useEffect } from 'react';
import { TOKENS } from '@/core/config/tokens';
import { InfoModal } from '@/components/ui/InfoModal';

export default function ReceiveScreen() {
    const { token } = useLocalSearchParams<{ token: 'RBTC' | 'LUT' }>();
    const { walletAddress } = useWalletStore();
    const router = useRouter();

    // Default to RBTC if no token specified or invalid
    const activeToken = (token === 'LUT') ? 'LUT' : 'RBTC';
    const tokenConfig = TOKENS[activeToken];

    const [copied, setCopied] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    const handleCopy = async () => {
        if (!walletAddress) return;

        await Clipboard.setStringAsync(walletAddress);
        setCopied(true);

        // Show feedback
        if (Platform.OS === 'android') {
            ToastAndroid.show('Address copied to clipboard', ToastAndroid.SHORT);
        } else {
            setModalVisible(true);
        }

        // Reset icon after delay
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        if (!walletAddress) return;

        try {
            await Share.share({
                message: `My ${activeToken} address on Rootstock: ${walletAddress}`,
                title: `Share ${activeToken} Address`,
            });
        } catch (error) {
            console.error('Error sharing address:', error);
        }
    };

    if (!walletAddress) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading wallet address...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: `Receive ${activeToken}`,
                    headerTitleStyle: {
                        fontSize: 18,
                        fontWeight: '600',
                    },
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: '#f8f9fa' },
                }}
            />

            <View style={styles.content}>
                <Text style={styles.subtitle}>
                    {activeToken === 'RBTC' ? 'Rootstock Native Coin' : 'LUT Governance Token'}
                </Text>

                <View style={styles.qrCard}>
                    <View style={styles.qrContainer}>
                        <QRCode
                            value={walletAddress}
                            size={200}
                            color="black"
                            backgroundColor="white"
                        />
                    </View>

                    <Text style={styles.shortAddress}>
                        {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
                    </Text>
                </View>

                {/* Full Address Block */}
                <TouchableOpacity
                    style={styles.addressBlock}
                    onPress={handleCopy}
                    activeOpacity={0.7}
                >
                    <Text style={styles.addressLabel}>Wallet Address</Text>
                    <View style={styles.addressRow}>
                        <Text style={styles.fullAddress} numberOfLines={1} ellipsizeMode="middle">
                            {walletAddress}
                        </Text>
                        <Ionicons
                            name={copied ? "checkmark-circle" : "copy-outline"}
                            size={20}
                            color={copied ? "#34C759" : "#007AFF"}
                        />
                    </View>
                </TouchableOpacity>

                {/* Network Warning */}
                <View style={[styles.warningContainer, activeToken === 'LUT' && styles.warningContainerLUT]}>
                    <Ionicons
                        name="warning-outline"
                        size={20}
                        color={activeToken === 'LUT' ? "#854d0e" : "#B45309"}
                        style={styles.warningIcon}
                    />
                    <Text style={[styles.warningText, activeToken === 'LUT' && styles.warningTextLUT]}>
                        {activeToken === 'RBTC'
                            ? "Send only RBTC on the Rootstock (RSK) network to this address. Sending other assets may result in permanent loss."
                            : "Send only LUT tokens on the Rootstock (RSK) network to this address."
                        }
                    </Text>
                </View>
            </View>

            {/* Bottom Actions */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.copyButton]}
                    onPress={handleCopy}
                >
                    <Ionicons name="copy-outline" size={20} color="#007AFF" />
                    <Text style={styles.copyButtonText}>Copy Address</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.shareButton]}
                    onPress={handleShare}
                >
                    <Ionicons name="share-outline" size={20} color="#fff" />
                    <Text style={styles.shareButtonText}>Share</Text>
                </TouchableOpacity>
            </View>

            <InfoModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                title="Copied"
                message="Address copied to clipboard"
                variant="success"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 16,
        color: '#666',
        fontSize: 16,
    },
    content: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 32,
        fontWeight: '500',
    },
    qrCard: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        marginBottom: 32,
        width: '100%',
        maxWidth: 320,
    },
    qrContainer: {
        marginBottom: 24,
    },
    shortAddress: {
        fontSize: 18,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontWeight: '600',
        color: '#1a1a1a',
        letterSpacing: 1,
    },
    addressBlock: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        width: '100%',
        borderWidth: 1,
        borderColor: '#e1e4e8',
        marginBottom: 24,
    },
    addressLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    fullAddress: {
        flex: 1,
        fontSize: 14,
        color: '#1a1a1a',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        marginRight: 8,
    },
    warningContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff7ed',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ffedd5',
        width: '100%',
    },
    warningContainerLUT: {
        backgroundColor: '#fefce8',
        borderColor: '#fef08a',
    },
    warningIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    warningText: {
        flex: 1,
        fontSize: 13,
        color: '#9a3412',
        lineHeight: 18,
    },
    warningTextLUT: {
        color: '#854d0e',
    },
    footer: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 48 : 24,
        flexDirection: 'row',
        gap: 16,
        backgroundColor: '#f8f9fa',
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    copyButton: {
        backgroundColor: '#e1f5fe',
    },
    copyButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
    shareButton: {
        backgroundColor: '#007AFF',
    },
    shareButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});

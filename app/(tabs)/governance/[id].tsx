import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Linking } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ProposalService } from '@/core/services/api/ProposalService';
import { Proposal, ProposalUpdate } from '@/core/types/Proposal';
import { Ionicons } from '@expo/vector-icons';
import Markdown, { RenderRules } from 'react-native-markdown-display';
import { Image, Pressable } from 'react-native';
import { ethers } from 'ethers';
import { SecureStorage } from '@/core/secure/SecureStorage';
import { signVote, VoteMessage } from '@/core/wallet/eip712';
import { useWalletStore } from '@/store/walletStore';
import { firebaseAuth } from '@/core/config/firebase';
import { InfoModal } from '@/components/ui/InfoModal';
import { ProposalUpdatesList } from '@/components/governance/ProposalUpdatesList';
import { AddProposalUpdateModal } from '@/components/governance/AddProposalUpdateModal';
import { balanceService } from '@/core/services/BalanceService';
import { TOKENS } from '@/core/config/tokens';

export default function ProposalDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [proposal, setProposal] = useState<Proposal | null>(null);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { walletAddress } = useWalletStore();

    // Proposal Updates state
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [editingUpdate, setEditingUpdate] = useState<ProposalUpdate | null>(null);
    const [userLutBalance, setUserLutBalance] = useState<string>('0');
    const [refreshUpdates, setRefreshUpdates] = useState(0);

    // Generic Modal State
    const [modalConfig, setModalConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        description?: string;
        variant?: 'info' | 'error' | 'success' | 'warning';
        actions?: { text: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'danger' }[];
    }>({
        visible: false,
        title: '',
        message: '',
    });

    const closePortal = () => setModalConfig(prev => ({ ...prev, visible: false }));

    const loadProposal = useCallback(async () => {
        if (!id || typeof id !== 'string') return;
        setLoading(true);
        setError(null);
        try {
            const data = await ProposalService.fetchProposalById(id);
            setProposal(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load proposal');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadProposal();
    }, [loadProposal]);

    // Load user LUT balance for permission check
    useEffect(() => {
        const loadBalance = async () => {
            if (!walletAddress) return;
            try {
                const lutBalance = await balanceService.fetchTokenBalance(
                    walletAddress,
                    TOKENS.LUT.address!,
                    'LUT'
                );
                setUserLutBalance(lutBalance.raw);
            } catch (err) {
                console.error('[ProposalDetails] Failed to load balance:', err);
            }
        };
        loadBalance();
    }, [walletAddress]);

    const handleVote = async (choice: 'FOR' | 'AGAINST') => {
        if (!proposal || !walletAddress) return;

        const powerRaw = proposal.userVotingPowerRaw || '0';

        if (BigInt(powerRaw) === 0n) {
            setModalConfig({
                visible: true,
                title: "Voting Power",
                message: "You don’t have any voting power for this proposal.",
                description: "Voting power is determined by your LUT balance at the snapshot block. Add LUT to your wallet to participate in future proposals.",
                variant: 'info'
            });
            return;
        }

        const formattedPower = formatTokens(powerRaw);

        setModalConfig({
            visible: true,
            title: "Confirm Vote",
            message: `You are about to vote ${choice} with ${formattedPower} voting power.`,
            description: `Based on snapshot block ${proposal.snapshotBlock || 'latest'}.`,
            variant: 'info',
            actions: [
                {
                    text: "Cancel",
                    onPress: closePortal,
                    variant: 'secondary'
                },
                {
                    text: "Confirm",
                    onPress: async () => {
                        closePortal();
                        setVoting(true);
                        try {
                            const privateKey = await SecureStorage.getEncryptedKey('private_key');
                            if (!privateKey) throw new Error('Private key not found.');

                            const timestamp = Math.floor(Date.now() / 1000);
                            const voteMessage: VoteMessage = {
                                proposalId: proposal.id,
                                voter: walletAddress.toLowerCase(),
                                choice,
                                snapshotBlock: proposal.snapshotBlock || 0,
                                timestamp
                            };

                            const signature = await signVote(privateKey, voteMessage);
                            await ProposalService.vote(proposal.id, choice, signature, timestamp);

                            setModalConfig({
                                visible: true,
                                title: 'Success',
                                message: 'Vote cast successfully',
                                variant: 'success',
                            });
                            loadProposal();
                        } catch (err: any) {
                            setModalConfig({
                                visible: true,
                                title: 'Error',
                                message: err.message || 'Failed to cast vote',
                                variant: 'error',
                            });
                        } finally {
                            setVoting(false);
                        }
                    }
                }
            ]
        });
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    if (error || !proposal) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{error || 'Proposal not found'}</Text>
                <TouchableOpacity onPress={loadProposal} style={styles.retryButton}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Calculations
    // Use BigInt for raw string arithmetic
    const totalFor = BigInt(proposal.totalForRaw || '0');
    const totalAgainst = BigInt(proposal.totalAgainstRaw || '0');
    const totalVotes = totalFor + totalAgainst;

    // Percentages (avoid division by zero)
    const pctFor = totalVotes > 0n ? Number((totalFor * 10000n) / totalVotes) / 100 : 0;
    const pctAgainst = totalVotes > 0n ? Number((totalAgainst * 10000n) / totalVotes) / 100 : 0;

    // Formatting tokens (assuming 18 decimals for LUT - normally fetched from config or env)
    // Using simple formatUnits for display
    const formatTokens = (raw: string) => {
        try {
            const val = parseFloat(ethers.formatUnits(raw, 18));
            return val.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' LUT';
        } catch (e) {
            return '0 LUT';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return styles.statusActive;
            case 'PASSED': return styles.statusPassed;
            case 'FAILED': return styles.statusFailed;
            case 'UPCOMING': return styles.statusUpcoming;
            default: return styles.statusClosed;
        }
    };

    const getStatusTextColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return styles.statusTextActive;
            case 'PASSED': return styles.statusTextPassed;
            case 'FAILED': return styles.statusTextFailed;
            case 'UPCOMING': return styles.statusTextUpcoming;
            default: return styles.statusTextClosed;
        }
    };

    const isVotingClosed = ['CLOSED', 'PASSED', 'FAILED'].includes(proposal.status);

    const shortenAddress = (addr: string) => {
        if (!addr) return '';
        if (addr.length < 15) return addr;
        return `${addr.substring(0, 10)}...${addr.substring(addr.length - 4)}`;
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Stack.Screen options={{ title: 'Proposal Details' }} />

            <View style={styles.header}>
                <View style={styles.badgesRow}>
                    <View style={[styles.statusBadge, getStatusColor(proposal.status)]}>
                        <Text style={[styles.statusText, getStatusTextColor(proposal.status)]}>
                            {proposal.status}
                        </Text>
                    </View>
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{proposal.category}</Text>
                    </View>
                </View>
                <Text style={styles.dateText}>
                    Created {new Date(proposal.createdAt).toLocaleDateString()}
                </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                <Text style={[styles.title, { marginBottom: 0 }]}>{proposal.title}</Text>
                {proposal.proposalCid && (
                    <TouchableOpacity onPress={() => Linking.openURL(`https://ipfs.filebase.io/ipfs/${proposal.proposalCid}`)}>
                        <Ionicons name="open-outline" size={18} color="#007AFF" />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.authorRow}>
                <Text style={styles.authorLabel}>Proposed by</Text>
                <Text style={styles.authorAddress}>
                    {proposal.authorName || shortenAddress(proposal.authorAddress)}
                </Text>
            </View>

            {/* Snapshot Info */}
            {proposal.snapshotBlock && (
                <View style={styles.snapshotContainer}>
                    <Ionicons name="camera-outline" size={16} color="#666" />
                    <Text style={styles.snapshotText}>
                        Snapshot Block: <Text style={styles.snapshotValue}>{proposal.snapshotBlock}</Text>
                    </Text>
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <View style={styles.markdownBox}>
                    <Markdown style={markdownStyles} rules={markdownRules}>
                        {proposal.description}
                    </Markdown>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{isVotingClosed ? 'Results' : 'Current Results'}</Text>

                {/* FOR Bar */}
                <View style={styles.resultRow}>
                    <View style={styles.resultLabelRow}>
                        <Text style={styles.resultLabel}>For</Text>
                        <Text style={styles.resultValue}>{formatTokens(proposal.totalForRaw)} ({pctFor.toFixed(2)}%)</Text>
                    </View>
                    <View style={styles.barBackground}>
                        <View style={[styles.barFill, { width: `${pctFor}%`, backgroundColor: '#1e7e34' }]} />
                    </View>
                </View>

                {/* AGAINST Bar */}
                <View style={styles.resultRow}>
                    <View style={styles.resultLabelRow}>
                        <Text style={styles.resultLabel}>Against</Text>
                        <Text style={styles.resultValue}>{formatTokens(proposal.totalAgainstRaw)} ({pctAgainst.toFixed(2)}%)</Text>
                    </View>
                    <View style={styles.barBackground}>
                        <View style={[styles.barFill, { width: `${pctAgainst}%`, backgroundColor: '#dc3545' }]} />
                    </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                    {proposal.resultsCid ? (
                        <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                            onPress={() => Linking.openURL(`https://ipfs.filebase.io/ipfs/${proposal.resultsCid}`)}
                        >
                            <Text style={{ fontSize: 12, color: '#007AFF', fontWeight: '500' }}>Results</Text>
                            <Ionicons name="open-outline" size={14} color="#007AFF" />
                        </TouchableOpacity>
                    ) : <View />}
                    <Text style={styles.totalVoters}>
                        Total Voters: {proposal.totalVoters}
                    </Text>
                </View>
            </View>

            {/* My Vote & Power */}
            {(!isVotingClosed || proposal.myVote) && (
                <View style={styles.myVoteContainer}>
                    {proposal.myVote ? (
                        <>
                            <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                            <Text style={styles.myVoteText}>
                                You voted <Text style={{ fontWeight: '700' }}>{proposal.myVote.choice}</Text> with {formatTokens(proposal.myVote.weightRaw)}
                            </Text>
                        </>
                    ) : (
                        <>
                            <Ionicons name="information-circle-outline" size={20} color="#666" />
                            <Text style={styles.myVoteText}>
                                Your voting power for this proposal: <Text style={{ fontWeight: '700' }}>{formatTokens(proposal.userVotingPowerRaw || '0')}</Text>
                            </Text>
                        </>
                    )}
                </View>
            )}

            {/* Voting Actions */}
            {!isVotingClosed && (
                <View style={styles.voteActions}>
                    <TouchableOpacity
                        style={[
                            styles.voteButton,
                            styles.voteButtonFor,
                            (voting || BigInt(proposal.userVotingPowerRaw || '0') === 0n) && styles.voteButtonDisabled
                        ]}
                        onPress={() => handleVote('FOR')}
                        disabled={voting}
                    >
                        <Text style={styles.voteButtonText}>Vote For</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.voteButton,
                            styles.voteButtonAgainst,
                            (voting || BigInt(proposal.userVotingPowerRaw || '0') === 0n) && styles.voteButtonDisabled
                        ]}
                        onPress={() => handleVote('AGAINST')}
                        disabled={voting}
                    >
                        <Text style={styles.voteButtonText}>Vote Against</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Implementation Updates Section - Only for PASSED proposals */}
            {proposal.status === 'PASSED' && (
                <View style={styles.section}>
                    <ProposalUpdatesList
                        proposalId={proposal.id}
                        onRefresh={() => {
                            setRefreshUpdates(prev => prev + 1);
                            loadProposal();
                        }}
                        onEdit={(update) => {
                            setEditingUpdate(update);
                            setShowUpdateModal(true);
                        }}
                    />
                </View>
            )}

            {/* Add Update Button - Floating */}
            {proposal.status === 'PASSED' && firebaseAuth.currentUser && walletAddress && proposal.authorAddress && walletAddress.toLowerCase() === proposal.authorAddress.toLowerCase() && (
                <TouchableOpacity
                    style={[
                        styles.floatingButton,
                        BigInt(userLutBalance) < BigInt('2000000000000000000000') && styles.floatingButtonDisabled
                    ]}
                    onPress={() => {
                        if (BigInt(userLutBalance) < BigInt('2000000000000000000000')) {
                            setModalConfig({
                                visible: true,
                                title: 'Insufficient Balance',
                                message: 'You need at least 2000 LUTs to add implementation updates.',
                                description: 'Add more LUT tokens to your wallet to participate in proposal updates.',
                                variant: 'warning'
                            });
                        } else {
                            setEditingUpdate(null);
                            setShowUpdateModal(true);
                        }
                    }}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                    <Text style={styles.floatingButtonText}>Add Status Update</Text>
                </TouchableOpacity>
            )
            }

            <InfoModal
                visible={modalConfig.visible}
                onClose={closePortal}
                title={modalConfig.title}
                message={modalConfig.message}
                description={modalConfig.description}
                variant={modalConfig.variant}
                actions={modalConfig.actions as any}
            />

            {loading && <ActivityIndicator style={{ marginTop: 20 }} />}

            {/* Add Proposal Update Modal */}
            <AddProposalUpdateModal
                visible={showUpdateModal}
                onClose={() => {
                    setShowUpdateModal(false);
                    setEditingUpdate(null);
                }}
                proposalId={proposal.id}
                initialData={editingUpdate}
                onSuccess={() => {
                    setRefreshUpdates(prev => prev + 1);
                    loadProposal(); // Refresh proposal data
                }}
            />

        </ScrollView >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    content: { padding: 20, paddingBottom: 40 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#dc3545', marginBottom: 12 },
    retryButton: { padding: 10, backgroundColor: '#007AFF', borderRadius: 8 },
    retryText: { color: '#fff' },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    badgesRow: { flexDirection: 'row', gap: 8 },
    dateText: { fontSize: 12, color: '#999' },

    title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginBottom: 16 },

    authorRow: { flexDirection: 'row', gap: 6, marginBottom: 20 },
    authorLabel: { color: '#666' },
    authorAddress: { color: '#007AFF', fontFamily: 'monospace' },

    snapshotContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#e9ecef',
        padding: 8,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 20
    },
    snapshotText: { fontSize: 13, color: '#495057' },
    snapshotValue: { fontWeight: '700', fontFamily: 'monospace' },

    section: { marginBottom: 24, backgroundColor: '#fff', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#333' },

    markdownBox: { minHeight: 60 },

    resultRow: { marginBottom: 16 },
    resultLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    resultLabel: { fontWeight: '600', color: '#333' },
    resultValue: { color: '#666', fontSize: 13 },
    barBackground: { height: 8, backgroundColor: '#e9ecef', borderRadius: 4, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 4 },
    totalVoters: { fontSize: 12, color: '#999', textAlign: 'right', marginTop: 4 },

    myVoteContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#e7f5ff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#007AFF20'
    },
    myVoteText: { color: '#004085', fontSize: 14 },

    voteActions: { flexDirection: 'row', gap: 12 },
    voteButton: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
    voteButtonFor: { backgroundColor: '#1e7e34' },
    voteButtonAgainst: { backgroundColor: '#dc3545' },
    voteButtonDisabled: { opacity: 0.6 },
    voteButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },

    // Status Styles (copied from index based on provided code)
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    statusActive: { backgroundColor: '#e6f4ea' },
    statusPassed: { backgroundColor: '#d1e7dd' },
    statusFailed: { backgroundColor: '#f8d7da' },
    statusUpcoming: { backgroundColor: '#e2e3e5' },
    statusClosed: { backgroundColor: '#f0f0f0' },
    statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    statusTextActive: { color: '#1e7e34' },
    statusTextPassed: { color: '#0f5132' },
    statusTextFailed: { color: '#842029' },
    statusTextUpcoming: { color: '#41464b' },
    statusTextClosed: { color: '#666' },

    categoryBadge: { backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    categoryText: { fontSize: 12, color: '#555', fontWeight: '500' },

    floatingButton: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        backgroundColor: '#007AFF',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    floatingButtonDisabled: {
        opacity: 0.6,
    },
    floatingButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
});

const markdownStyles = {
    body: { fontSize: 15, color: '#333', lineHeight: 24 },
};

const markdownRules: RenderRules = {
    image: (node, children, parent, styles, inheritedStyles) => {
        const { src, alt } = node.attributes;
        return (
            <Pressable key={node.key} onPress={() => Linking.openURL(src)}>
                <Image
                    source={{ uri: src }}
                    style={{
                        width: '100%',
                        height: 200,
                        borderRadius: 8,
                        resizeMode: 'contain',
                        marginVertical: 10
                    }}
                    accessibilityLabel={alt}
                />
            </Pressable>
        );
    }
};

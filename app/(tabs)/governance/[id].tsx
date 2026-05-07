import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Linking, Image, Pressable, Platform, KeyboardAvoidingView } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Markdown, { RenderRules } from 'react-native-markdown-display';
import { useWalletStore } from '@/store/walletStore';
import { firebaseAuth } from '@/core/config/firebase';
import { InfoModal } from '@/components/ui/InfoModal';
import { ProposalUpdatesList } from '@/components/governance/ProposalUpdatesList';
import { AddProposalUpdateModal } from '@/components/governance/AddProposalUpdateModal';
import { useProposal } from '@/hooks/useProposal';
import { ProposalUpdate } from '@/core/types/Proposal';

export default function ProposalDetailsScreen() {
    const { id } = useLocalSearchParams();
    const { walletAddress } = useWalletStore();

    // Use our customized orchestrator hook
    const {
        proposal,
        loading,
        error,
        voting,
        userLutBalance,
        loadProposal,
        castVote,
        getProposalMetrics,
        formatTokens,
        isVotingClosed
    } = useProposal({ id, walletAddress });

    // Modals internal states
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [editingUpdate, setEditingUpdate] = useState<ProposalUpdate | null>(null);
    const [refreshUpdates, setRefreshUpdates] = useState(0);

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

    const handleVoteSequence = (choice: 'FOR' | 'AGAINST') => {
        if (!proposal) return;

        const powerRaw = proposal.userVotingPowerRaw || '0';
        if (BigInt(powerRaw) === 0n) {
            setModalConfig({
                visible: true,
                title: "Voting Power",
                message: "You don't have any voting power for this proposal.",
                description: "Voting power is determined by your LUT balance at the snapshot block.",
                variant: 'info'
            });
            return;
        }

        setModalConfig({
            visible: true,
            title: "Confirm Vote",
            message: `You are about to vote ${choice} with ${formatTokens(powerRaw)} voting power.`,
            description: `Based on snapshot block ${proposal.snapshotBlock || 'latest'}.`,
            variant: 'info',
            actions: [
                { text: "Cancel", onPress: closePortal, variant: 'secondary' },
                {
                    text: "Confirm",
                    onPress: async () => {
                        closePortal();
                        try {
                            await castVote(choice);
                            setModalConfig({
                                visible: true, title: 'Success', message: 'Vote cast successfully!', variant: 'success'
                            });
                        } catch (err: any) {
                            setModalConfig({
                                visible: true, title: 'Error', message: err.message || 'Signature Failed.', variant: 'error'
                            });
                        }
                    }
                }
            ]
        });
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#3182CE" />
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

    const { pctFor, pctAgainst } = getProposalMetrics();

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.wrapper}>
            <Stack.Screen options={{ 
                title: 'Proposal Details',
                headerStyle: { backgroundColor: '#F8F9FB' },
                headerShadowVisible: false,
            }} />

            <ScrollView contentContainerStyle={styles.container}>

                {/* Hero Card Glassmorphism */}
                <View style={styles.glassCard}>
                    <View style={styles.badgesRow}>
                        <View style={[styles.statusBadge, styles[`status${proposal.status}` as keyof typeof styles] || styles.statusCLOSED]}>
                            <Text style={styles.statusText}>{proposal.status}</Text>
                        </View>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{proposal.category}</Text>
                        </View>
                    </View>

                    <Text style={styles.title}>{proposal.title}</Text>
                    
                    <View style={styles.metaRow}>
                        <View>
                            <Text style={styles.metaLabel}>Proposed by</Text>
                            <Text style={styles.metaValue}>
                                {proposal.authorName || shortenAddress(proposal.authorAddress)}
                            </Text>
                        </View>
                        {proposal.proposalCid && (
                            <TouchableOpacity onPress={() => Linking.openURL(`https://ipfs.filebase.io/ipfs/${proposal.proposalCid}`)}>
                                <Ionicons name="documents-outline" size={24} color="#3182CE" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Description View */}
                <View style={[styles.glassCard, { marginTop: 16 }]}>
                    <Text style={styles.sectionTitle}>Overview</Text>
                    <Markdown style={markdownStyles} rules={markdownRules}>
                        {proposal.description}
                    </Markdown>
                </View>

                {/* Voting Metrics View */}
                <View style={[styles.glassCard, { marginTop: 16 }]}>
                    <Text style={styles.sectionTitle}>{isVotingClosed ? 'Final Results' : 'Live Metrics'}</Text>
                    
                    <View style={styles.metricContainer}>
                        <View style={styles.metricRow}>
                            <Text style={styles.metricLabelFor}>For</Text>
                            <Text style={styles.metricValue}>{pctFor.toFixed(2)}%</Text>
                        </View>
                        <View style={styles.barBackground}>
                            <View style={[styles.barFill, { width: `${pctFor}%`, backgroundColor: '#48BB78' }]} />
                        </View>
                    </View>

                    <View style={styles.metricContainer}>
                        <View style={styles.metricRow}>
                            <Text style={styles.metricLabelAgainst}>Against</Text>
                            <Text style={styles.metricValue}>{pctAgainst.toFixed(2)}%</Text>
                        </View>
                        <View style={styles.barBackground}>
                            <View style={[styles.barFill, { width: `${pctAgainst}%`, backgroundColor: '#F56565' }]} />
                        </View>
                    </View>
                    
                    <Text style={styles.totalVoters}>Total Voters: {proposal.totalVoters}</Text>
                </View>

                {/* User Voting Area */}
                {(!isVotingClosed || proposal.myVote) && (
                    <View style={styles.interactionZone}>
                        {proposal.myVote ? (
                            <View style={styles.votedBadge}>
                                <Ionicons name="checkmark-circle" size={22} color="#3182CE" />
                                <Text style={styles.votedBadgeText}>
                                    Voted <Text style={{fontWeight: '700'}}>{proposal.myVote.choice}</Text>
                                </Text>
                            </View>
                        ) : (
                            <Text style={styles.votingPowerHint}>
                                Your active power: <Text style={{fontWeight: 'bold'}}>{formatTokens(proposal.userVotingPowerRaw || '0')}</Text>
                            </Text>
                        )}

                        {!isVotingClosed && (
                            <View style={styles.actionButtonsRow}>
                                <TouchableOpacity
                                    style={[styles.primaryButton, styles.buttonFor, voting && styles.buttonDisabled]}
                                    onPress={() => handleVoteSequence('FOR')}
                                    disabled={voting}
                                >
                                    {voting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Vote For</Text>}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.primaryButton, styles.buttonAgainst, voting && styles.buttonDisabled]}
                                    onPress={() => handleVoteSequence('AGAINST')}
                                    disabled={voting}
                                >
                                    <Text style={styles.buttonText}>Vote Against</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                {/* Implementation Updates (Timeline) */}
                {proposal.status === 'PASSED' && (
                    <View style={{ marginTop: 24, paddingBottom: 60 }}>
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

            </ScrollView>

            {/* Floating Updates Button */}
            {proposal.status === 'PASSED' && firebaseAuth.currentUser && walletAddress?.toLowerCase() === proposal.authorAddress?.toLowerCase() && (
                <TouchableOpacity
                    style={styles.floatingButton}
                    onPress={() => {
                        setEditingUpdate(null);
                        setShowUpdateModal(true);
                    }}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                    <Text style={styles.floatingButtonText}>Add Update</Text>
                </TouchableOpacity>
            )}

            {/* System Modals */}
            <InfoModal
                visible={modalConfig.visible} onClose={closePortal}
                title={modalConfig.title} message={modalConfig.message}
                description={modalConfig.description} variant={modalConfig.variant}
                actions={modalConfig.actions as any}
            />

            <AddProposalUpdateModal
                visible={showUpdateModal}
                onClose={() => { setShowUpdateModal(false); setEditingUpdate(null); }}
                proposalId={proposal.id} initialData={editingUpdate}
                onSuccess={() => { setRefreshUpdates(prev => prev + 1); loadProposal(); }}
            />
        </KeyboardAvoidingView>
    );
}

// Helpers
const shortenAddress = (addr: string) => addr?.length > 15 ? `${addr.substring(0, 10)}...${addr.substring(addr.length - 4)}` : addr;

// --- Glassmorphism StyleSheet ---
const styles = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: '#F8F9FB' },
    container: { padding: 16 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FB' },
    
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
    },
    
    badgesRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
    statusACTIVE: { backgroundColor: '#C6F6D5' },
    statusPASSED: { backgroundColor: '#BEE3F8' },
    statusFAILED: { backgroundColor: '#FED7D7' },
    statusCLOSED: { backgroundColor: '#E2E8F0' },
    statusText: { fontSize: 11, fontWeight: '800', color: '#2D3748', textTransform: 'uppercase', letterSpacing: 0.5 },
    categoryBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.8)' },
    categoryText: { fontSize: 11, fontWeight: '700', color: '#718096' },

    title: { fontSize: 24, fontWeight: '800', color: '#1A202C', letterSpacing: -0.5, marginBottom: 16 },
    
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    metaLabel: { fontSize: 12, color: '#A0AEC0', fontWeight: '600', textTransform: 'uppercase' },
    metaValue: { fontSize: 14, color: '#3182CE', fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 2 },

    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#2D3748', marginBottom: 12 },

    metricContainer: { marginBottom: 16 },
    metricRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    metricLabelFor: { fontSize: 14, fontWeight: '700', color: '#276749' },
    metricLabelAgainst: { fontSize: 14, fontWeight: '700', color: '#9B2C2C' },
    metricValue: { fontSize: 14, fontWeight: '600', color: '#4A5568' },
    barBackground: { height: 10, backgroundColor: 'rgba(226, 232, 240, 0.6)', borderRadius: 5, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 5 },
    totalVoters: { fontSize: 12, color: '#A0AEC0', textAlign: 'right', fontWeight: '600' },

    interactionZone: { marginTop: 20, alignItems: 'center' },
    votedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(235, 248, 255, 0.8)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    votedBadgeText: { fontSize: 14, color: '#2B6CB0' },
    votingPowerHint: { fontSize: 13, color: '#718096', marginBottom: 12 },

    actionButtonsRow: { flexDirection: 'row', gap: 12, width: '100%' },
    primaryButton: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', shadowOffset: { width:0, height:4 }, shadowOpacity: 0.1, elevation: 2 },
    buttonFor: { backgroundColor: '#48BB78', shadowColor: '#48BB78' },
    buttonAgainst: { backgroundColor: '#F56565', shadowColor: '#F56565' },
    buttonDisabled: { opacity: 0.5 },
    buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

    floatingButton: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#3182CE', flexDirection: 'row', padding: 16, borderRadius: 30, shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity: 0.2, elevation: 5 },
    floatingButtonText: { color: '#FFF', fontWeight: '700', marginLeft: 8 },

    errorText: { color: '#E53E3E', marginBottom: 12, fontSize: 16, fontWeight: '600' },
    retryButton: { backgroundColor: '#EDF2F7', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
    retryText: { color: '#4A5568', fontWeight: '700' },
});

const markdownStyles = {
    body: { fontSize: 15, color: '#4A5568', lineHeight: 24, fontWeight: '400' },
    heading1: { color: '#1A202C', fontWeight: '800' },
    strong: { color: '#2D3748', fontWeight: '700' }
};

const markdownRules: RenderRules = {
    image: (node, children, parent, styles, inheritedStyles) => {
        const { src, alt } = node.attributes;
        return (
            <Pressable key={node.key} onPress={() => Linking.openURL(src)}>
                <Image source={{ uri: src }} style={{ width: '100%', height: 200, borderRadius: 16, marginTop: 12, marginBottom:12 }} />
            </Pressable>
        );
    }
};

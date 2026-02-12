import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProposalRevision } from '@/core/types/ProposalRevision';
import { ProposalRevisionService } from '@/core/services/api/ProposalRevisionService';
import { formatTimeAgo } from '@/core/utils/governanceUtils';

interface RevisionHistoryProps {
    visible: boolean;
    proposalId: string;
    onClose: () => void;
}

export const RevisionHistory: React.FC<RevisionHistoryProps> = ({
    visible,
    proposalId,
    onClose,
}) => {
    const [revisions, setRevisions] = useState<ProposalRevision[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedRevision, setSelectedRevision] = useState<ProposalRevision | null>(null);

    useEffect(() => {
        if (visible) {
            loadRevisions();
        }
    }, [visible, proposalId]);

    const loadRevisions = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await ProposalRevisionService.fetchRevisions(proposalId);
            setRevisions(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load revisions');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Revision History</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#007AFF" />
                    </View>
                ) : error ? (
                    <View style={styles.center}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity onPress={loadRevisions} style={styles.retryButton}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : selectedRevision ? (
                    // Detail view
                    <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollPadding}>
                        <TouchableOpacity
                            onPress={() => setSelectedRevision(null)}
                            style={styles.backButton}
                        >
                            <Ionicons name="arrow-back" size={18} color="#007AFF" />
                            <Text style={styles.backText}>All Revisions</Text>
                        </TouchableOpacity>

                        <View style={styles.revisionDetail}>
                            <Text style={styles.revisionDetailTitle}>
                                Revision #{selectedRevision.revisionNumber}
                            </Text>
                            <Text style={styles.revisionDetailDate}>
                                {new Date(selectedRevision.createdAt).toLocaleString()}
                            </Text>

                            {selectedRevision.changeNote && (
                                <View style={styles.changeNoteBox}>
                                    <Ionicons name="pencil-outline" size={14} color="#084298" />
                                    <Text style={styles.changeNoteText}>
                                        {selectedRevision.changeNote}
                                    </Text>
                                </View>
                            )}

                            <Text style={styles.sectionLabel}>Title</Text>
                            <Text style={styles.detailText}>{selectedRevision.title}</Text>

                            <Text style={styles.sectionLabel}>Summary</Text>
                            <Text style={styles.detailText}>{selectedRevision.summary}</Text>

                            <Text style={styles.sectionLabel}>Body</Text>
                            <Text style={styles.detailText}>{selectedRevision.bodyMarkdown}</Text>
                        </View>
                    </ScrollView>
                ) : (
                    // List view
                    <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollPadding}>
                        {revisions.length === 0 ? (
                            <View style={styles.center}>
                                <Text style={styles.emptyText}>No revisions yet</Text>
                            </View>
                        ) : (
                            revisions.map((rev) => (
                                <TouchableOpacity
                                    key={rev.id}
                                    style={styles.revisionItem}
                                    onPress={() => setSelectedRevision(rev)}
                                >
                                    <View style={styles.revisionItemLeft}>
                                        <View style={styles.revisionNumber}>
                                            <Text style={styles.revisionNumberText}>
                                                #{rev.revisionNumber}
                                            </Text>
                                        </View>
                                        <View style={styles.revisionInfo}>
                                            <Text style={styles.revisionTime}>
                                                {formatTimeAgo(rev.createdAt)}
                                            </Text>
                                            {rev.changeNote && (
                                                <Text style={styles.changeNote} numberOfLines={1}>
                                                    {rev.changeNote}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color="#ccc" />
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    closeButton: {
        padding: 4,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    errorText: {
        color: '#dc3545',
        fontSize: 14,
        marginBottom: 12,
    },
    retryButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#007AFF',
        borderRadius: 8,
    },
    retryText: {
        color: '#fff',
        fontWeight: '600',
    },
    emptyText: {
        color: '#999',
        fontSize: 15,
    },
    scrollContent: {
        flex: 1,
    },
    scrollPadding: {
        padding: 20,
    },
    revisionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
    },
    revisionItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    revisionNumber: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f0f7ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    revisionNumberText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#007AFF',
    },
    revisionInfo: {
        flex: 1,
    },
    revisionTime: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    changeNote: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    // Detail view
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 16,
    },
    backText: {
        fontSize: 15,
        color: '#007AFF',
        fontWeight: '500',
    },
    revisionDetail: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
    },
    revisionDetailTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    revisionDetailDate: {
        fontSize: 13,
        color: '#999',
        marginBottom: 12,
    },
    changeNoteBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#cfe2ff',
        padding: 10,
        borderRadius: 8,
        marginBottom: 16,
    },
    changeNoteText: {
        fontSize: 13,
        color: '#084298',
        flex: 1,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 12,
        marginBottom: 4,
    },
    detailText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
});

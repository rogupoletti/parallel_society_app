import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProposalStatusBadge } from './ProposalStatusBadge';
import { ProposalStatus, GOVERNANCE_STRINGS, DISCUSSION_OPEN_STATUSES } from '@/core/constants/governance';
import { formatTimeRemaining } from '@/core/utils/governanceUtils';

interface ProposalStatusStripProps {
    status: ProposalStatus;
    discussionEndsAt?: number;
    endTime?: number;
    isAuthor: boolean;
    onPublish?: () => void;
    onStartVote?: () => void;
    onCancel?: () => void;
}

export const ProposalStatusStrip: React.FC<ProposalStatusStripProps> = ({
    status,
    discussionEndsAt,
    endTime,
    isAuthor,
    onPublish,
    onStartVote,
    onCancel,
}) => {
    const getContextInfo = (): string => {
        switch (status) {
            case 'DRAFT':
                return isAuthor ? 'Draft — publish when ready' : 'Draft proposal';
            case 'IN_DISCUSSION':
                if (discussionEndsAt) {
                    return GOVERNANCE_STRINGS.DISCUSSION_ENDS_IN(formatTimeRemaining(discussionEndsAt));
                }
                return 'Discussion is open';
            case 'READY_FOR_VOTING':
                return isAuthor
                    ? GOVERNANCE_STRINGS.READY_FOR_VOTING_BANNER
                    : GOVERNANCE_STRINGS.DISCUSSION_COMPLETED;
            case 'VOTING_LIVE':
                if (endTime) {
                    return `Voting ends in ${formatTimeRemaining(endTime)}`;
                }
                return GOVERNANCE_STRINGS.VOTING_IS_LIVE;
            case 'VOTING_ENDED':
                return 'Voting has ended';
            case 'ACCEPTED':
                return 'Proposal accepted';
            case 'REJECTED':
                return 'Proposal rejected';
            case 'CANCELED':
                return 'Proposal canceled';
            default:
                return '';
        }
    };

    const getIcon = (): string => {
        switch (status) {
            case 'DRAFT': return 'document-text-outline';
            case 'IN_DISCUSSION': return 'chatbubbles-outline';
            case 'READY_FOR_VOTING': return 'checkmark-circle-outline';
            case 'VOTING_LIVE': return 'hand-left-outline';
            case 'VOTING_ENDED': return 'flag-outline';
            case 'ACCEPTED': return 'checkmark-done-outline';
            case 'REJECTED': return 'close-circle-outline';
            case 'CANCELED': return 'ban-outline';
            default: return 'information-circle-outline';
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.infoRow}>
                <Ionicons name={getIcon() as any} size={18} color="#555" />
                <ProposalStatusBadge status={status} />
                <Text style={styles.contextText} numberOfLines={1}>
                    {getContextInfo()}
                </Text>
            </View>

            {isAuthor && (
                <View style={styles.actionsRow}>
                    {status === 'DRAFT' && onPublish && (
                        <TouchableOpacity style={styles.actionButton} onPress={onPublish}>
                            <Ionicons name="send-outline" size={16} color="#007AFF" />
                            <Text style={styles.actionText}>
                                {GOVERNANCE_STRINGS.PUBLISH_TO_DISCUSSION}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {status === 'READY_FOR_VOTING' && onStartVote && (
                        <TouchableOpacity style={[styles.actionButton, styles.actionButtonPrimary]} onPress={onStartVote}>
                            <Ionicons name="play-outline" size={16} color="#fff" />
                            <Text style={[styles.actionText, styles.actionTextPrimary]}>
                                {GOVERNANCE_STRINGS.START_VOTE}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {(status === 'DRAFT' || status === 'IN_DISCUSSION') && onCancel && (
                        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                            <Text style={styles.cancelText}>
                                {GOVERNANCE_STRINGS.CANCEL_PROPOSAL}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 0,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    contextText: {
        flex: 1,
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: '#f0f7ff',
        flex: 1,
        justifyContent: 'center',
    },
    actionButtonPrimary: {
        backgroundColor: '#007AFF',
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
    },
    actionTextPrimary: {
        color: '#fff',
    },
    cancelButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#e5e5ea',
        justifyContent: 'center',
    },
    cancelText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#999',
    },
});

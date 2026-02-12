import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Comment } from '@/core/types/Discussion';
import { formatTimeAgo, formatVoteCount } from '@/core/utils/governanceUtils';
import { GOVERNANCE_CONFIG } from '@/core/constants/governance';

interface CommentCardProps {
    comment: Comment;
    isProposalAuthor: boolean;
    canInteract: boolean; // false when discussion is locked
    onReply?: (comment: Comment) => void;
    onVote?: (commentId: string, direction: 'UP' | 'DOWN') => void;
    onHide?: (commentId: string) => void;
    onReport?: (commentId: string) => void;
    onLoadReplies?: (parentId: string) => void;
    replies?: Comment[];
    isNested?: boolean;
}

export const CommentCard: React.FC<CommentCardProps> = ({
    comment,
    isProposalAuthor,
    canInteract,
    onReply,
    onVote,
    onHide,
    onReport,
    onLoadReplies,
    replies = [],
    isNested = false,
}) => {
    const [showOverflow, setShowOverflow] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [showReplies, setShowReplies] = useState(false);

    const textIsLong = comment.text.length > 200;

    const handleUpvote = useCallback(() => {
        if (!canInteract || !onVote) return;
        onVote(comment.id, comment.myVote === 'UP' ? 'DOWN' : 'UP');
    }, [canInteract, onVote, comment.id, comment.myVote]);

    const handleDownvote = useCallback(() => {
        if (!canInteract || !onVote) return;
        onVote(comment.id, comment.myVote === 'DOWN' ? 'UP' : 'DOWN');
    }, [canInteract, onVote, comment.id, comment.myVote]);

    if (comment.isHidden) {
        return (
            <View style={[styles.container, isNested && styles.nested]}>
                <View style={styles.hiddenContainer}>
                    <Ionicons name="eye-off-outline" size={14} color="#999" />
                    <Text style={styles.hiddenText}>Comment hidden by proposal author</Text>
                </View>
            </View>
        );
    }

    const displayName = comment.author.displayName
        || `${comment.author.address.slice(0, 6)}...${comment.author.address.slice(-4)}`;

    const avatarInitial = displayName.charAt(0).toUpperCase();

    return (
        <View style={[styles.container, isNested && styles.nested]}>
            {isNested && <View style={styles.threadLine} />}

            <View style={styles.commentBody}>
                {/* Header: Avatar + Name + Time */}
                <View style={styles.header}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{avatarInitial}</Text>
                    </View>
                    <Text style={styles.authorName}>{displayName}</Text>
                    <Text style={styles.timeAgo}>{formatTimeAgo(comment.createdAt)}</Text>
                    {comment.isEdited && (
                        <Text style={styles.editedLabel}>(edited)</Text>
                    )}
                </View>

                {/* Comment Text */}
                <Text
                    style={styles.commentText}
                    numberOfLines={expanded ? undefined : 4}
                >
                    {comment.text}
                </Text>
                {textIsLong && !expanded && (
                    <TouchableOpacity onPress={() => setExpanded(true)}>
                        <Text style={styles.readMore}>Read more</Text>
                    </TouchableOpacity>
                )}

                {/* Actions Row */}
                <View style={styles.actionsRow}>
                    {/* Upvote */}
                    <TouchableOpacity
                        style={styles.voteButton}
                        onPress={handleUpvote}
                        disabled={!canInteract}
                    >
                        <Ionicons
                            name={comment.myVote === 'UP' ? 'arrow-up' : 'arrow-up-outline'}
                            size={16}
                            color={comment.myVote === 'UP' ? '#007AFF' : '#666'}
                        />
                        <Text style={[
                            styles.voteCount,
                            comment.myVote === 'UP' && styles.voteCountActive,
                        ]}>
                            {formatVoteCount(comment.vote.score)}
                        </Text>
                    </TouchableOpacity>

                    {/* Downvote */}
                    <TouchableOpacity
                        style={styles.voteButton}
                        onPress={handleDownvote}
                        disabled={!canInteract}
                    >
                        <Ionicons
                            name={comment.myVote === 'DOWN' ? 'arrow-down' : 'arrow-down-outline'}
                            size={16}
                            color={comment.myVote === 'DOWN' ? '#dc3545' : '#666'}
                        />
                    </TouchableOpacity>

                    {/* Reply */}
                    {canInteract && !isNested && onReply && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => onReply(comment)}
                        >
                            <Ionicons name="chatbubble-outline" size={14} color="#666" />
                            <Text style={styles.actionLabel}>Reply</Text>
                        </TouchableOpacity>
                    )}

                    {/* Overflow Menu */}
                    <TouchableOpacity
                        style={[styles.actionButton, { marginLeft: 'auto' }]}
                        onPress={() => setShowOverflow(!showOverflow)}
                    >
                        <Ionicons name="ellipsis-horizontal" size={16} color="#999" />
                    </TouchableOpacity>
                </View>

                {/* Overflow Menu Dropdown */}
                {showOverflow && (
                    <View style={styles.overflowMenu}>
                        {isProposalAuthor && onHide && (
                            <TouchableOpacity
                                style={styles.overflowItem}
                                onPress={() => {
                                    setShowOverflow(false);
                                    onHide(comment.id);
                                }}
                            >
                                <Ionicons name="eye-off-outline" size={16} color="#666" />
                                <Text style={styles.overflowText}>Hide comment</Text>
                            </TouchableOpacity>
                        )}
                        {onReport && (
                            <TouchableOpacity
                                style={styles.overflowItem}
                                onPress={() => {
                                    setShowOverflow(false);
                                    onReport(comment.id);
                                }}
                            >
                                <Ionicons name="flag-outline" size={16} color="#dc3545" />
                                <Text style={[styles.overflowText, { color: '#dc3545' }]}>
                                    Report
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Replies */}
                {!isNested && comment.replyCount > 0 && (
                    <View style={styles.repliesSection}>
                        {!showReplies ? (
                            <TouchableOpacity
                                style={styles.showRepliesButton}
                                onPress={() => {
                                    setShowReplies(true);
                                    if (onLoadReplies) onLoadReplies(comment.id);
                                }}
                            >
                                <Ionicons name="chatbubbles-outline" size={14} color="#007AFF" />
                                <Text style={styles.showRepliesText}>
                                    {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <>
                                {replies.slice(0, GOVERNANCE_CONFIG.REPLIES_PREVIEW_COUNT).map(reply => (
                                    <CommentCard
                                        key={reply.id}
                                        comment={reply}
                                        isProposalAuthor={isProposalAuthor}
                                        canInteract={canInteract}
                                        onVote={onVote}
                                        onHide={onHide}
                                        onReport={onReport}
                                        isNested
                                    />
                                ))}
                                {replies.length > GOVERNANCE_CONFIG.REPLIES_PREVIEW_COUNT && (
                                    <TouchableOpacity
                                        style={styles.showRepliesButton}
                                        onPress={() => onLoadReplies?.(comment.id)}
                                    >
                                        <Text style={styles.showRepliesText}>
                                            Load more replies
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 4,
    },
    nested: {
        marginLeft: 24,
        paddingLeft: 12,
        borderLeftWidth: 2,
        borderLeftColor: '#e5e5ea',
    },
    threadLine: {
        // Placeholder for thread line styling if needed
    },
    commentBody: {
        paddingVertical: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#e2e3e5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#555',
    },
    authorName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    timeAgo: {
        fontSize: 12,
        color: '#999',
    },
    editedLabel: {
        fontSize: 11,
        color: '#bbb',
        fontStyle: 'italic',
    },
    commentText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
        marginBottom: 8,
    },
    readMore: {
        fontSize: 13,
        color: '#007AFF',
        fontWeight: '500',
        marginBottom: 8,
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    voteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingVertical: 4,
        paddingHorizontal: 6,
        borderRadius: 6,
    },
    voteCount: {
        fontSize: 13,
        color: '#666',
        fontWeight: '600',
    },
    voteCountActive: {
        color: '#007AFF',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
    },
    actionLabel: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    overflowMenu: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 4,
        marginTop: 6,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    overflowItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    overflowText: {
        fontSize: 14,
        color: '#333',
    },
    repliesSection: {
        marginTop: 8,
    },
    showRepliesButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
    },
    showRepliesText: {
        fontSize: 13,
        color: '#007AFF',
        fontWeight: '500',
    },
    hiddenContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
    },
    hiddenText: {
        fontSize: 13,
        color: '#999',
        fontStyle: 'italic',
    },
});

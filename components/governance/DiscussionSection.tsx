import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Comment, CommentSortOption, CommentsResponse } from '@/core/types/Discussion';
import { DiscussionService } from '@/core/services/api/DiscussionService';
import { CommentCard } from './CommentCard';
import { CommentComposer } from './CommentComposer';
import {
    DISCUSSION_OPEN_STATUSES,
    DISCUSSION_VISIBLE_STATUSES,
    GOVERNANCE_STRINGS,
    ProposalStatus,
} from '@/core/constants/governance';

interface DiscussionSectionProps {
    proposalId: string;
    proposalStatus: ProposalStatus;
    isProposalAuthor: boolean;
}

const SORT_TABS: { key: CommentSortOption; label: string }[] = [
    { key: 'TOP', label: 'Top' },
    { key: 'NEWEST', label: 'Newest' },
    { key: 'MOST_INFLUENTIAL', label: 'Most Influential' },
];

export const DiscussionSection: React.FC<DiscussionSectionProps> = ({
    proposalId,
    proposalStatus,
    isProposalAuthor,
}) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [sortBy, setSortBy] = useState<CommentSortOption>('TOP');
    const [cursor, setCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reply state
    const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);

    // Replies store: parentId -> Comment[]
    const [repliesMap, setRepliesMap] = useState<Record<string, Comment[]>>({});

    // Whether discussion is open for new comments
    const canComment = DISCUSSION_OPEN_STATUSES.includes(proposalStatus);
    const isVisible = DISCUSSION_VISIBLE_STATUSES.includes(proposalStatus);
    const isLocked = !canComment && isVisible;

    const loadComments = useCallback(async (isRefresh = true) => {
        if (isRefresh) {
            setLoading(true);
            setCursor(null);
        } else {
            setLoadingMore(true);
        }
        setError(null);

        try {
            const response: CommentsResponse = await DiscussionService.fetchComments(
                proposalId,
                sortBy,
                isRefresh ? undefined : cursor
            );

            if (isRefresh) {
                setComments(response.items);
            } else {
                setComments(prev => [...prev, ...response.items]);
            }

            setCursor(response.nextCursor);
            setHasMore(!!response.nextCursor);
        } catch (err: any) {
            // For locked/finalized proposals, silently treat errors as "no comments"
            if (isLocked) {
                setComments([]);
                setHasMore(false);
            } else {
                // Strip HTML from error messages (e.g. raw 404 pages)
                const rawMsg = err.message || 'Failed to load comments';
                const cleanMsg = rawMsg.includes('<html') || rawMsg.includes('<body')
                    ? 'Discussion service is not available yet'
                    : rawMsg;
                setError(cleanMsg);
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [proposalId, sortBy, cursor, isLocked]);

    useEffect(() => {
        if (isVisible) {
            loadComments(true);
        }
    }, [proposalId, sortBy, isVisible]);

    const handleSortChange = (newSort: CommentSortOption) => {
        if (newSort === sortBy) return;
        setSortBy(newSort);
        // loadComments will be triggered by the useEffect above
    };

    const handlePostComment = async (text: string, parentId?: string | null) => {
        const newComment = await DiscussionService.postComment(proposalId, text, parentId);

        if (parentId) {
            // Add to replies map
            setRepliesMap(prev => ({
                ...prev,
                [parentId]: [...(prev[parentId] || []), newComment],
            }));
            // Increment reply count on parent
            setComments(prev =>
                prev.map(c =>
                    c.id === parentId ? { ...c, replyCount: c.replyCount + 1 } : c
                )
            );
        } else {
            // Add to top of list
            setComments(prev => [newComment, ...prev]);
        }
    };

    const handleVote = async (commentId: string, direction: 'UP' | 'DOWN') => {
        try {
            await DiscussionService.voteComment(commentId, direction);
            // Optimistic update
            const updateVote = (c: Comment): Comment => {
                if (c.id !== commentId) return c;
                const wasUp = c.myVote === 'UP';
                const wasDown = c.myVote === 'DOWN';
                const newMyVote = c.myVote === direction ? null : direction;

                let upDelta = 0;
                let downDelta = 0;

                if (direction === 'UP') {
                    if (wasUp) { upDelta = -1; } // undo
                    else { upDelta = 1; if (wasDown) downDelta = -1; }
                } else {
                    if (wasDown) { downDelta = -1; } // undo
                    else { downDelta = 1; if (wasUp) upDelta = -1; }
                }

                return {
                    ...c,
                    myVote: newMyVote,
                    vote: {
                        ...c.vote,
                        up: c.vote.up + upDelta,
                        down: c.vote.down + downDelta,
                        score: c.vote.score + upDelta - downDelta,
                    },
                };
            };

            setComments(prev => prev.map(updateVote));
            // Also update replies
            setRepliesMap(prev => {
                const newMap = { ...prev };
                for (const key of Object.keys(newMap)) {
                    newMap[key] = newMap[key].map(updateVote);
                }
                return newMap;
            });
        } catch (err: any) {
            console.error('[DiscussionSection] Vote error:', err);
        }
    };

    const handleHide = async (commentId: string) => {
        try {
            await DiscussionService.hideComment(commentId);
            // Mark as hidden
            setComments(prev =>
                prev.map(c => c.id === commentId ? { ...c, isHidden: true } : c)
            );
        } catch (err: any) {
            console.error('[DiscussionSection] Hide error:', err);
        }
    };

    const handleReport = async (commentId: string) => {
        try {
            await DiscussionService.reportComment(commentId, 'Inappropriate content');
        } catch (err: any) {
            console.error('[DiscussionSection] Report error:', err);
        }
    };

    const handleLoadReplies = async (parentId: string) => {
        try {
            const response = await DiscussionService.fetchReplies(proposalId, parentId);
            setRepliesMap(prev => ({
                ...prev,
                [parentId]: response.items,
            }));
        } catch (err: any) {
            console.error('[DiscussionSection] Load replies error:', err);
        }
    };

    if (!isVisible) return null;

    return (
        <View style={styles.container}>
            {/* Section Header */}
            <Text style={styles.sectionTitle}>Discussion</Text>

            {/* Locked Banner */}
            {isLocked && (
                <View style={styles.lockedBanner}>
                    <Ionicons name="lock-closed-outline" size={14} color="#666" />
                    <Text style={styles.lockedText}>{GOVERNANCE_STRINGS.DISCUSSION_LOCKED}</Text>
                </View>
            )}

            {/* Sort Tabs */}
            <View style={styles.sortTabs}>
                {SORT_TABS.map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[
                            styles.sortTab,
                            sortBy === tab.key && styles.sortTabActive,
                        ]}
                        onPress={() => handleSortChange(tab.key)}
                    >
                        <Text style={[
                            styles.sortTabText,
                            sortBy === tab.key && styles.sortTabTextActive,
                        ]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Comments List */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="small" color="#007AFF" />
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={() => loadComments(true)}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : comments.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="chatbubble-ellipses-outline" size={32} color="#ddd" />
                    <Text style={styles.emptyText}>
                        {canComment
                            ? 'Be the first to comment on this proposal'
                            : isLocked
                                ? 'No discussions were held for this proposal'
                                : 'No comments yet'}
                    </Text>
                </View>
            ) : (
                <>
                    {comments.map(comment => (
                        <CommentCard
                            key={comment.id}
                            comment={comment}
                            isProposalAuthor={isProposalAuthor}
                            canInteract={canComment}
                            onReply={(c) => setReplyingTo({
                                id: c.id,
                                authorName: c.author.displayName || c.author.address.slice(0, 10),
                            })}
                            onVote={handleVote}
                            onHide={handleHide}
                            onReport={handleReport}
                            onLoadReplies={handleLoadReplies}
                            replies={repliesMap[comment.id] || []}
                        />
                    ))}

                    {hasMore && (
                        <TouchableOpacity
                            style={styles.loadMoreButton}
                            onPress={() => loadComments(false)}
                            disabled={loadingMore}
                        >
                            {loadingMore ? (
                                <ActivityIndicator size="small" color="#007AFF" />
                            ) : (
                                <Text style={styles.loadMoreText}>Load more comments</Text>
                            )}
                        </TouchableOpacity>
                    )}
                </>
            )}

            {/* Composer */}
            {canComment && (
                <CommentComposer
                    replyingTo={replyingTo}
                    onSubmit={handlePostComment}
                    onCancel={() => setReplyingTo(null)}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    lockedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#f8f9fa',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    lockedText: {
        fontSize: 13,
        color: '#666',
        fontStyle: 'italic',
    },
    sortTabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        marginBottom: 12,
    },
    sortTab: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginRight: 4,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    sortTabActive: {
        borderBottomColor: '#007AFF',
    },
    sortTabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#999',
    },
    sortTabTextActive: {
        color: '#007AFF',
        fontWeight: '600',
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
        gap: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    errorText: {
        fontSize: 14,
        color: '#dc3545',
    },
    retryText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '600',
    },
    loadMoreButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    loadMoreText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
});

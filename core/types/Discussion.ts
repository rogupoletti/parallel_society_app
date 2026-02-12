/**
 * Discussion types for the governance proposal discussion system.
 */

export interface CommentAuthor {
    address: string;
    displayName?: string;
    avatarUrl?: string;
}

export interface CommentVoteData {
    up: number;
    down: number;
    score: number; // up - down
    influenceScore?: number; // weighted by reputation/tokens
}

export interface Comment {
    id: string;
    proposalId: string;
    author: CommentAuthor;
    createdAt: number;
    text: string;
    vote: CommentVoteData;
    replyCount: number;
    parentId: string | null; // null = top-level comment
    isHidden: boolean; // moderated/hidden by author
    isEdited?: boolean;
    lastEditedAt?: number;
    // User's current vote on this comment (null if not voted)
    myVote?: 'UP' | 'DOWN' | null;
}

export interface CommentVote {
    commentId: string;
    voterAddress: string;
    direction: 'UP' | 'DOWN';
    createdAt: number;
}

export type CommentSortOption = 'TOP' | 'NEWEST' | 'MOST_INFLUENTIAL';

export interface CommentsResponse {
    items: Comment[];
    nextCursor: string | null;
    totalCount?: number;
}

export interface CreateCommentPayload {
    text: string;
    parentId?: string | null;
}

export interface VoteCommentPayload {
    direction: 'UP' | 'DOWN';
}

export interface ReportCommentPayload {
    reason: string;
}

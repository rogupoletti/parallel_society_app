import { firebaseAuth as auth } from '../../config/firebase';
import { Comment, CommentsResponse, CommentSortOption, CommentVote } from '../../types/Discussion';

const BACKEND_URL = process.env.EXPO_PUBLIC_AUTH_BACKEND_URL;

export const DiscussionService = {
    /**
     * Fetch comments for a proposal with sorting and cursor-based pagination.
     */
    async fetchComments(
        proposalId: string,
        sort: CommentSortOption = 'TOP',
        cursor?: string | null
    ): Promise<CommentsResponse> {
        const user = auth.currentUser;
        const idToken = user ? await user.getIdToken() : null;

        const params = new URLSearchParams({
            sort,
            ...(cursor ? { cursor } : {}),
        });

        const response = await fetch(
            `${BACKEND_URL}/getProposalComments?proposalId=${proposalId}&${params.toString()}`,
            {
                headers: idToken ? { 'Authorization': `Bearer ${idToken}` } : {},
            }
        );

        if (!response.ok) {
            let errorMessage = `Failed to fetch comments (${response.status})`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                // Response is not JSON (e.g. raw 404 page) — use generic message
            }
            throw new Error(errorMessage);
        }

        return response.json();
    },

    /**
     * Fetch replies to a specific comment.
     */
    async fetchReplies(
        proposalId: string,
        parentId: string,
        cursor?: string | null
    ): Promise<CommentsResponse> {
        const user = auth.currentUser;
        const idToken = user ? await user.getIdToken() : null;

        const params = new URLSearchParams({
            parentId,
            ...(cursor ? { cursor } : {}),
        });

        const response = await fetch(
            `${BACKEND_URL}/getProposalComments?proposalId=${proposalId}&${params.toString()}`,
            {
                headers: idToken ? { 'Authorization': `Bearer ${idToken}` } : {},
            }
        );

        if (!response.ok) {
            let errorMessage = `Failed to fetch replies (${response.status})`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                // Response is not JSON — use generic message
            }
            throw new Error(errorMessage);
        }

        return response.json();
    },

    /**
     * Post a new comment or reply to a proposal.
     */
    async postComment(
        proposalId: string,
        text: string,
        parentId?: string | null
    ): Promise<Comment> {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('You must be logged in to comment');
        }

        const idToken = await user.getIdToken();

        const response = await fetch(`${BACKEND_URL}/addProposalComment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({
                proposalId,
                text,
                parentId: parentId || null,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'Failed to post comment';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            throw new Error(errorMessage);
        }

        return response.json();
    },

    /**
     * Vote (upvote/downvote) on a comment.
     */
    async voteComment(
        commentId: string,
        direction: 'UP' | 'DOWN'
    ): Promise<CommentVote> {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('You must be logged in to vote on comments');
        }

        const idToken = await user.getIdToken();

        const response = await fetch(`${BACKEND_URL}/voteOnComment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({ commentId, direction }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'Failed to vote on comment';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            throw new Error(errorMessage);
        }

        return response.json();
    },

    /**
     * Hide a comment (proposal author only — moderation).
     */
    async hideComment(commentId: string): Promise<void> {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('You must be logged in to hide comments');
        }

        const idToken = await user.getIdToken();

        const response = await fetch(`${BACKEND_URL}/hideComment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({ commentId }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'Failed to hide comment';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            throw new Error(errorMessage);
        }
    },

    /**
     * Report a comment for moderation.
     */
    async reportComment(commentId: string, reason: string): Promise<void> {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('You must be logged in to report comments');
        }

        const idToken = await user.getIdToken();

        const response = await fetch(`${BACKEND_URL}/reportComment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({ commentId, reason }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'Failed to report comment';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            throw new Error(errorMessage);
        }
    },
};

import { firebaseAuth as auth } from '../../config/firebase';
import { ProposalRevision, CreateRevisionPayload } from '../../types/ProposalRevision';

const BACKEND_URL = process.env.EXPO_PUBLIC_AUTH_BACKEND_URL;

export const ProposalRevisionService = {
    /**
     * Fetch all revisions for a proposal (ordered by revisionNumber desc).
     */
    async fetchRevisions(proposalId: string): Promise<ProposalRevision[]> {
        const user = auth.currentUser;
        const idToken = user ? await user.getIdToken() : null;

        const response = await fetch(
            `${BACKEND_URL}/getProposalRevisions?proposalId=${proposalId}`,
            {
                headers: idToken ? { 'Authorization': `Bearer ${idToken}` } : {},
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch revisions: ${response.status} ${errorText}`);
        }

        const revisions: ProposalRevision[] = await response.json();
        return revisions.sort((a, b) => b.revisionNumber - a.revisionNumber);
    },

    /**
     * Create a new revision (edit proposal text). Author only.
     * In IN_DISCUSSION status, changeNote is required.
     */
    async createRevision(
        proposalId: string,
        payload: CreateRevisionPayload
    ): Promise<ProposalRevision> {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('You must be logged in to edit a proposal');
        }

        const idToken = await user.getIdToken();

        const response = await fetch(`${BACKEND_URL}/createProposalRevision`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({
                proposalId,
                ...payload,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'Failed to save revision';
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
};

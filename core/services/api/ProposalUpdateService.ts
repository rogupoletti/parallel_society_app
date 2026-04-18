import { firebaseAuth as auth } from '../../config/firebase';
import { ProposalUpdate, ProposalUpdateAttachment } from '../../types/Proposal';

const BACKEND_URL = process.env.EXPO_PUBLIC_AUTH_BACKEND_URL;

export interface CreateProposalUpdateData {
    proposalId: string;
    status: 'Planning' | 'In Progress' | 'Delayed' | 'Completed' | 'Started';
    content: string;
    attachments?: ProposalUpdateAttachment[];
}

export const ProposalUpdateService = {
    /**
     * Fetch all updates for a specific proposal
     * @param proposalId The proposal ID
     * @returns Array of ProposalUpdate objects
     */
    async fetchProposalUpdates(proposalId: string): Promise<ProposalUpdate[]> {
        try {
            const user = auth.currentUser;
            const idToken = user ? await user.getIdToken() : null;

            const response = await fetch(`${BACKEND_URL}/getProposalUpdates?proposalId=${proposalId}`, {
                headers: idToken ? {
                    'Authorization': `Bearer ${idToken}`
                } : {}
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[ProposalUpdateService] fetchProposalUpdates failed:', response.status, response.statusText, errorText);
                throw new Error(`Failed to fetch proposal updates: ${response.status} ${errorText}`);
            }

            const updates = await response.json();
            // Sort by createdAt descending (newest first)
            return updates.sort((a: ProposalUpdate, b: ProposalUpdate) => b.createdAt - a.createdAt);
        } catch (error: any) {
            console.error('[ProposalUpdateService] fetchProposalUpdates error:', error);
            throw error;
        }
    },

    /**
     * Add a new implementation update to a proposal
     * @param data CreateProposalUpdateData
     * @returns The created ProposalUpdate
     */
    async addProposalUpdate(data: CreateProposalUpdateData): Promise<ProposalUpdate> {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('You must be logged in to add a proposal update');
        }

        const idToken = await user.getIdToken();

        try {
            const response = await fetch(`${BACKEND_URL}/addProposalUpdate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    proposalId: data.proposalId,
                    status: data.status,
                    content: data.content,
                    attachments: data.attachments || []
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = 'Failed to add proposal update';
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) {
                    errorMessage = errorText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            return response.json();
        } catch (error: any) {
            console.error('[ProposalUpdateService] addProposalUpdate error:', error);
            throw error;
        }
    },

    /**
     * Edit an existing proposal update
     * @param updateId The ID of the update to edit
     * @param data Partial data to update
     * @returns The updated ProposalUpdate
     */
    async editProposalUpdate(updateId: string, data: Partial<CreateProposalUpdateData>): Promise<ProposalUpdate> {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('You must be logged in to edit a proposal update');
        }

        const idToken = await user.getIdToken();

        try {
            const response = await fetch(`${BACKEND_URL}/editProposalUpdate?id=${updateId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = 'Failed to edit proposal update';
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) {
                    errorMessage = errorText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            return response.json();
        } catch (error: any) {
            console.error('[ProposalUpdateService] editProposalUpdate error:', error);
            throw error;
        }
    },

    /**
     * Delete a proposal update
     * @param updateId The ID of the update to delete
     */
    async deleteProposalUpdate(updateId: string): Promise<void> {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('You must be logged in to delete a proposal update');
        }

        const idToken = await user.getIdToken();

        try {
            const response = await fetch(`${BACKEND_URL}/deleteProposalUpdate?id=${updateId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = 'Failed to delete proposal update';
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) {
                    errorMessage = errorText || errorMessage;
                }
                throw new Error(errorMessage);
            }
        } catch (error: any) {
            console.error('[ProposalUpdateService] deleteProposalUpdate error:', error);
            throw error;
        }
    }
};

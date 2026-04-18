import { firebaseAuth as auth } from '../../config/firebase';

const BACKEND_URL = process.env.EXPO_PUBLIC_AUTH_BACKEND_URL;

import { Proposal } from '../../types/Proposal';
import { signProposal, EIP712_DOMAIN, EIP712_TYPES, ProposalMessage } from '../../wallet/eip712';
import { balanceService } from '../BalanceService';
import { ethers } from 'ethers';

export const ProposalService = {
    async fetchProposals(): Promise<Proposal[]> {
        const response = await fetch(`${BACKEND_URL}/listProposals`);
        if (!response.ok) {
            throw new Error('Failed to fetch proposals');
        }
        return response.json();
    },

    async fetchProposalById(id: string): Promise<Proposal> {
        const user = auth.currentUser;
        const idToken = user ? await user.getIdToken() : null;

        const response = await fetch(`${BACKEND_URL}/getProposal?id=${id}`, {
            headers: idToken ? {
                'Authorization': `Bearer ${idToken}`
            } : {}
        });
        if (!response.ok) {
            throw new Error('Failed to fetch proposal details');
        }
        return response.json();
    },

    async vote(proposalId: string, choice: 'FOR' | 'AGAINST', signature: string, timestamp: number): Promise<any> {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('You must be logged in to vote');
        }

        const idToken = await user.getIdToken();

        const response = await fetch(`${BACKEND_URL}/voteOnProposal`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
                id: proposalId,
                choice,
                signature,
                timestamp
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'Failed to cast vote';
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

    async createProposal(
        titleOrParams: string | { title: string, category: string, description: string, authorAddress: string, privateKey: string, endTime?: number },
        category?: string,
        description?: string,
        authorAddressArg?: string,
        privateKeyArg?: string,
        endTimeArg?: number
    ): Promise<Proposal> {
        let title: string;
        let cat: string;
        let desc: string;
        let authorAddress: string;
        let privateKey: string;
        let endTimeVal: number | undefined;

        console.log('[ProposalService] createProposal called with:', {
            isObject: typeof titleOrParams === 'object',
            arg1Type: typeof titleOrParams,
            arg2Type: typeof category,
            arg3Type: typeof description,
            arg4Type: typeof authorAddressArg,
            arg5Type: typeof privateKeyArg
        });

        if (typeof titleOrParams === 'object' && titleOrParams !== null) {
            // New object-based call
            title = titleOrParams.title;
            cat = titleOrParams.category;
            desc = titleOrParams.description;
            authorAddress = titleOrParams.authorAddress;
            privateKey = titleOrParams.privateKey;
            endTimeVal = titleOrParams.endTime;
        } else {
            // Old positional call
            title = titleOrParams as string;
            cat = category || '';
            desc = description || '';
            authorAddress = authorAddressArg || '';
            privateKey = privateKeyArg || '';
            endTimeVal = endTimeArg;
        }

        console.log('[ProposalService] Creating proposal:', {
            title,
            category: cat,
            author: typeof authorAddress === 'string' ? `${authorAddress.substring(0, 10)}...` : 'INVALID'
        });

        if (!authorAddress || typeof authorAddress !== 'string') {
            throw new Error(`Invalid authorAddress: expected string, got ${typeof authorAddress}.`);
        }
        if (!privateKey || typeof privateKey !== 'string') {
            throw new Error(`Invalid privateKey: expected string, got ${typeof privateKey}.`);
        }
        if (typeof endTimeVal !== 'number') {
            endTimeVal = Date.now() + 7 * 24 * 60 * 60 * 1000;
        }

        const user = auth.currentUser;
        if (!user) {
            throw new Error('You must be logged in to create a proposal');
        }

        const idToken = await user.getIdToken();

        // 1. Get current block number for snapshot
        const snapshotBlock = await balanceService.getProvider().getBlockNumber();
        const timestamp = Math.floor(Date.now() / 1000);
        const startTime = Date.now();
        const finalEndTime = endTimeVal; // Use the potentially updated endTimeVal

        // 2. Build the message
        const message: ProposalMessage = {
            from: authorAddress.toLowerCase(),
            space: "parallel-society",
            timestamp: timestamp,
            type: "single-choice",
            title: title,
            body: desc, // Use 'desc' for body
            discussion: "",
            choices: ["For", "Against"],
            start: Math.floor(startTime / 1000),
            end: Math.floor(finalEndTime / 1000), // Use finalEndTime
            snapshot: snapshotBlock,
            plugins: "{}",
            app: "parallel"
        };

        // 3. Sign the message
        const signature = await signProposal(privateKey, message);

        // 4. Compute message hash
        const messageHash = ethers.TypedDataEncoder.hash(
            EIP712_DOMAIN,
            { Proposal: EIP712_TYPES.Proposal },
            message
        );

        const response = await fetch(`${BACKEND_URL}/createProposal`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
                title,
                category: cat,
                description: desc,
                startTime: startTime,
                endTime: finalEndTime,
                signature,
                messageHash,
                timestamp,
                snapshotBlock
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'Failed to create proposal';
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

    async deleteProposal(id: string): Promise<void> {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('You must be logged in to delete a proposal');
        }

        const idToken = await user.getIdToken();

        const response = await fetch(`${BACKEND_URL}/deleteProposal`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ id })
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'Failed to delete proposal';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            throw new Error(errorMessage);
        }
    }
};

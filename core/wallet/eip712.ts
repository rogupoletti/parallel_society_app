import { ethers } from 'ethers';

/**
 * EIP-712 Domain for LUT Governance
 * Must match backend exactly
 */
/**
 * EIP-712 Domain for Parallel Society Governance
 * Must match backend exactly
 */
export const EIP712_DOMAIN = {
    name: 'parallel',
    version: '1'
};

/**
 * EIP-712 Types for Vote and Proposal
 */
export const EIP712_TYPES = {
    Vote: [
        { name: 'proposalId', type: 'string' },
        { name: 'voter', type: 'address' },
        { name: 'choice', type: 'string' },
        { name: 'snapshotBlock', type: 'uint256' },
        { name: 'timestamp', type: 'uint64' }
    ],
    Proposal: [
        { name: 'from', type: 'address' },
        { name: 'space', type: 'string' },
        { name: 'timestamp', type: 'uint64' },
        { name: 'type', type: 'string' },
        { name: 'title', type: 'string' },
        { name: 'body', type: 'string' },
        { name: 'discussion', type: 'string' },
        { name: 'choices', type: 'string[]' },
        { name: 'start', type: 'uint64' },
        { name: 'end', type: 'uint64' },
        { name: 'snapshot', type: 'uint64' },
        { name: 'plugins', type: 'string' },
        { name: 'app', type: 'string' }
    ]
};

/**
 * Vote message structure
 */
export interface VoteMessage {
    proposalId: string;
    voter: string;
    choice: 'FOR' | 'AGAINST';
    snapshotBlock: number;
    timestamp: number;
}

/**
 * Proposal message structure
 */
export interface ProposalMessage {
    from: string;
    space: string;
    timestamp: number;
    type: string;
    title: string;
    body: string;
    discussion: string;
    choices: string[];
    start: number;
    end: number;
    snapshot: number;
    plugins: string;
    app: string;
}

/**
 * Signs a vote using EIP-712 typed data
 */
export async function signVote(
    privateKey: string,
    message: VoteMessage
): Promise<string> {
    const wallet = new ethers.Wallet(privateKey);
    return await wallet.signTypedData(
        EIP712_DOMAIN,
        { Vote: EIP712_TYPES.Vote },
        message
    );
}

/**
 * Signs a proposal using EIP-712 typed data
 */
export async function signProposal(
    privateKey: string,
    message: ProposalMessage
): Promise<string> {
    const wallet = new ethers.Wallet(privateKey);
    return await wallet.signTypedData(
        EIP712_DOMAIN,
        { Proposal: EIP712_TYPES.Proposal },
        message
    );
}

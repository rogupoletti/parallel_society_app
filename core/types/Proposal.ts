import { ProposalStatus } from '../constants/governance';
export { ProposalStatus };

export interface ProposalPermissions {
    canEdit: boolean;
    canStartVote: boolean;
    canCancel: boolean;
    canComment: boolean;
    canModerate: boolean;
}

export interface Proposal {
    id: string;
    title: string;
    category: string;
    description: string;
    authorAddress: string;
    authorName?: string;
    createdAt: number;
    startTime: number;
    endTime: number;
    status: ProposalStatus;

    // Discussion fields
    discussionStartedAt?: number;
    discussionEndsAt?: number;
    discussionPeriodDays?: number; // default: 7
    isEdited?: boolean;
    lastEditedAt?: number;
    revisionCount?: number;
    commentCount?: number;

    // Permissions (computed by backend based on caller)
    permissions?: ProposalPermissions;

    // Snapshot strategy
    snapshotBlock?: number;
    snapshotChainId?: number;
    strategy?: string;

    // Tally in raw strings
    totalForRaw: string;
    totalAgainstRaw: string;
    tokenPowerVotedRaw: string;

    totalVoters: number;
    finalizedAt?: number;
    userVotingPowerRaw?: string;
    myVote?: {
        choice: 'FOR' | 'AGAINST';
        weightRaw: string;
    } | null;

    // IPFS Pinned Artifacts
    proposalCid?: string | null;
    proposalCidPinnedAt?: number | null;
    proposalCidStatus?: 'pinned' | 'pending' | 'failed';

    resultsCid?: string | null;
    resultsCidPinnedAt?: number | null;
    resultsCidStatus?: 'pinned' | 'pending' | 'failed';
}

export interface Vote {
    proposalId: string;
    voterAddress: string;
    choice: 'FOR' | 'AGAINST';
    weightRaw: string;
    createdAt: number;
    updatedAt: number;
}

export type ProposalCategory = 'Finance' | 'Operations' | 'Governance' | 'Other';

export const PROPOSAL_CATEGORIES: ProposalCategory[] = ['Finance', 'Operations', 'Governance', 'Other'];

export interface ProposalUpdate {
    id: string;
    proposalId: string;
    authorAddress: string;
    authorName?: string;
    status: 'Planning' | 'In Progress' | 'Delayed' | 'Completed' | 'Started';
    content: string; // Markdown text
    createdAt: number;
    attachments?: ProposalUpdateAttachment[];
}

export interface ProposalUpdateAttachment {
    id: string;
    name: string;
    type: 'document' | 'image' | 'link';
    url: string;
    size?: number;
}

export type ProposalUpdateStatus = 'Planning' | 'In Progress' | 'Delayed' | 'Completed' | 'Started';

export const PROPOSAL_UPDATE_STATUSES: ProposalUpdateStatus[] = ['Planning', 'In Progress', 'Delayed', 'Completed', 'Started'];

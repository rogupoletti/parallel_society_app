/**
 * Proposal revision types for tracking edits to proposal text.
 */

export interface ProposalRevision {
    id: string;
    proposalId: string;
    revisionNumber: number;
    title: string;
    summary: string;
    bodyMarkdown: string;
    changeNote: string; // required for edits during IN_DISCUSSION
    createdAt: number;
    createdBy: string; // author wallet address
}

export interface CreateRevisionPayload {
    title: string;
    summary: string;
    bodyMarkdown: string;
    changeNote: string;
}

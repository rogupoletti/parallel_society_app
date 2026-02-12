/**
 * Governance module constants: status labels, UI copy, colors, and config.
 */

// ─── Status Types ────────────────────────────────────────────────
export type ProposalStatus =
    | 'DRAFT'
    | 'IN_DISCUSSION'
    | 'READY_FOR_VOTING'
    | 'VOTING_LIVE'
    | 'VOTING_ENDED'
    | 'ACCEPTED'
    | 'REJECTED'
    | 'CANCELED'
    | 'ARCHIVED';

// ─── Status Labels ───────────────────────────────────────────────
export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
    DRAFT: 'Draft',
    IN_DISCUSSION: 'In Discussion',
    READY_FOR_VOTING: 'Ready for Voting',
    VOTING_LIVE: 'Voting Live',
    VOTING_ENDED: 'Voting Ended',
    ACCEPTED: 'Accepted',
    REJECTED: 'Rejected',
    CANCELED: 'Canceled',
    ARCHIVED: 'Archived',
};

// ─── Status Colors ───────────────────────────────────────────────
export const PROPOSAL_STATUS_COLORS: Record<ProposalStatus, { bg: string; text: string }> = {
    DRAFT: { bg: '#e2e3e5', text: '#41464b' },
    IN_DISCUSSION: { bg: '#cfe2ff', text: '#084298' },
    READY_FOR_VOTING: { bg: '#d1f2eb', text: '#0b7a5e' },
    VOTING_LIVE: { bg: '#e8d5f5', text: '#6f42c1' },
    VOTING_ENDED: { bg: '#e2e3e5', text: '#41464b' },
    ACCEPTED: { bg: '#d1e7dd', text: '#0f5132' },
    REJECTED: { bg: '#f8d7da', text: '#842029' },
    CANCELED: { bg: '#f8d7da', text: '#842029' },
    ARCHIVED: { bg: '#f0f0f0', text: '#666666' },
};

// ─── Discussion is open in these statuses ────────────────────────
export const DISCUSSION_OPEN_STATUSES: ProposalStatus[] = ['IN_DISCUSSION'];
export const PROPOSAL_EDITABLE_STATUSES: ProposalStatus[] = ['DRAFT', 'IN_DISCUSSION'];
export const DISCUSSION_VISIBLE_STATUSES: ProposalStatus[] = [
    'IN_DISCUSSION', 'READY_FOR_VOTING', 'VOTING_LIVE',
    'VOTING_ENDED', 'ACCEPTED', 'REJECTED',
];

// ─── Statuses where proposal text is locked ──────────────────────
export const PROPOSAL_LOCKED_STATUSES: ProposalStatus[] = [
    'READY_FOR_VOTING', 'VOTING_LIVE', 'VOTING_ENDED',
    'ACCEPTED', 'REJECTED', 'CANCELED', 'ARCHIVED',
];

// ─── UI Copy / Banners ──────────────────────────────────────────
export const GOVERNANCE_STRINGS = {
    // Banners
    DISCUSSION_ENDS_IN: (timeRemaining: string) => `Discussion ends in ${timeRemaining}`,
    DISCUSSION_COMPLETED: 'Discussion period completed',
    READY_FOR_VOTING_BANNER: 'Ready for voting — author can start the vote',
    VOTING_IS_LIVE: 'Voting is live — discussion is locked',
    DISCUSSION_LOCKED: 'Discussion is locked during and after voting.',

    // Buttons
    PUBLISH_TO_DISCUSSION: 'Publish to Discussion',
    EDIT_PROPOSAL: 'Edit Proposal',
    VIEW_REVISIONS: 'View Revisions',
    START_VOTE: 'Start Vote',
    CONFIRM_START_VOTE: 'Confirm & Start Vote',
    CANCEL: 'Cancel',
    CANCEL_PROPOSAL: 'Cancel Proposal',
    REPLY: 'Reply',
    REPORT: 'Report',
    POST: 'Post',
    HIDE_COMMENT: 'Hide Comment',

    // Modal
    START_VOTE_TITLE: 'Start Public Vote?',
    START_VOTE_DESCRIPTION: 'Once the vote starts, the proposal will be locked and visible to all citizens for the entire voting period.',
    START_VOTE_WARNING: 'This action cannot be undone',
    VOTING_PERIOD_LABEL: 'Voting Period',
    VOTING_PERIOD_VALUE: '7 Days',

    // Status info
    PROPOSAL_LABEL: 'Proposal',
    ACTION_LABEL: 'Action',
} as const;

// ─── Config ─────────────────────────────────────────────────────
export const GOVERNANCE_CONFIG = {
    DISCUSSION_PERIOD_DAYS: 7,
    VOTING_PERIOD_DAYS: 7,
    COMMENT_RATE_LIMIT: 5, // max comments per window
    COMMENT_RATE_WINDOW_MS: 10 * 60 * 1000, // 10 minutes
    MAX_URLS_PER_COMMENT: 2,
    MAX_COMMENT_LENGTH: 2000,
    REPLIES_PREVIEW_COUNT: 3, // show 3 replies, then "Load more"
    COMMENTS_PAGE_SIZE: 20,
} as const;

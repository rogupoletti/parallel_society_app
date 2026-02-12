/**
 * Utility functions for the governance module.
 */

/**
 * Format a time remaining in milliseconds to a human-readable string.
 * e.g. "3d 4h", "2h 15m", "45m", "< 1m"
 */
export function formatTimeRemaining(targetTimestamp: number): string {
    const now = Date.now();
    const diff = targetTimestamp - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return '< 1m';
}

/**
 * Format a timestamp to a relative "time ago" display.
 * e.g. "2h ago", "3d ago", "Just now"
 */
export function formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60 * 1000) return 'Just now';

    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;

    const years = Math.floor(months / 12);
    return `${years}y ago`;
}

/**
 * Format vote count to a compact display.
 * e.g. 1200 → "1.2k", 999 → "999"
 */
export function formatVoteCount(count: number): string {
    if (count < 0) {
        return `-${formatVoteCount(Math.abs(count))}`;
    }
    if (count >= 1_000_000) {
        return `${(count / 1_000_000).toFixed(1)}M`;
    }
    if (count >= 1_000) {
        return `${(count / 1_000).toFixed(1)}k`;
    }
    return count.toString();
}

/**
 * Client-side rate limiter for comment posting.
 * Uses in-memory timestamps. Resets on app restart.
 */
class CommentRateLimiter {
    private timestamps: number[] = [];
    private maxActions: number;
    private windowMs: number;

    constructor(maxActions: number, windowMs: number) {
        this.maxActions = maxActions;
        this.windowMs = windowMs;
    }

    canPost(): boolean {
        const now = Date.now();
        // Remove expired timestamps
        this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);
        return this.timestamps.length < this.maxActions;
    }

    record(): void {
        this.timestamps.push(Date.now());
    }

    getRemainingTime(): number {
        if (this.canPost()) return 0;
        const oldest = this.timestamps[0];
        return oldest + this.windowMs - Date.now();
    }
}

// Global rate limiter instance: 5 comments per 10 minutes
export const commentRateLimiter = new CommentRateLimiter(5, 10 * 60 * 1000);

/**
 * Basic spam detection for comment text.
 * Returns an error message if spam detected, null if ok.
 */
export function detectCommentSpam(text: string, maxUrls: number = 2): string | null {
    if (!text || text.trim().length === 0) {
        return 'Comment cannot be empty';
    }

    if (text.length > 2000) {
        return 'Comment is too long (max 2000 characters)';
    }

    // Count URLs
    const urlRegex = /https?:\/\/[^\s]+/gi;
    const urls = text.match(urlRegex);
    if (urls && urls.length > maxUrls) {
        return `Too many links (max ${maxUrls} per comment)`;
    }

    return null;
}

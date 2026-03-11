/**
 * lib/matching.ts
 *
 * Shared utilities for tag matching, session scoring, and shuffling.
 * Used by both app/api/chat/route.ts and lib/scheduler.ts.
 */

import { UserProfile } from './types';
import { JOB_TYPE_TAG_AFFINITY } from './constants';

/**
 * Fisher-Yates shuffle — unbiased in-place array randomization.
 * Returns a new shuffled array (does not mutate the original).
 */
export function shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Check if a session tag matches a user interest.
 *
 * Matching rules (case-insensitive):
 * 1. Exact match: "AI" === "AI"
 * 2. Interest appears as a complete word/phrase within the tag:
 *    - "Workflow automation" matches "Workflow automation for ABs and SBs"
 *    - "AI" matches "Leveraging the power of Agentic AI" (word boundary)
 *    - "AI" does NOT match "Catering Area" (partial within a word)
 */
export function matchesInterest(tag: string, interest: string): boolean {
    const t = tag.toLowerCase().trim();
    const i = interest.toLowerCase().trim();

    // Exact match
    if (t === i) return true;

    // Word-boundary match: interest appears as a standalone word/phrase in the tag
    const escaped = i.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|\\W)${escaped}(?:$|\\W)`, 'i');
    return regex.test(tag);
}

/**
 * Check if any tag in a list matches any interest in a list.
 */
export function hasMatchingTag(tags: string[], interests: string[]): boolean {
    if (!tags || !interests) return false;
    return tags.some(tag => interests.some(interest => matchesInterest(tag, interest)));
}

/**
 * Count how many interests match the session's tags.
 */
export function countTagMatches(tags: string[], interests: string[]): number {
    if (!tags || !interests) return 0;
    let count = 0;
    for (const interest of interests) {
        if (tags.some(tag => matchesInterest(tag, interest))) {
            count++;
        }
    }
    return count;
}

/**
 * Score a session for relevance to a user profile.
 *
 * Scoring:
 * +3 per matching interest tag
 * +2 if session region matches user location
 * +1 if session has keynote or externalSpeaker metadata
 * +1 for job-type tag affinity
 */
export function scoreSession(session: any, userProfile: Partial<UserProfile>): number {
    let score = 0;

    // Interest tag matches (+3 each)
    const interests = userProfile.interests || [];
    score += countTagMatches(session.tags || [], interests) * 3;

    // Region match (+2)
    const location = userProfile.location;
    if (location && session.regions?.length > 0) {
        const locationLower = location.toLowerCase();
        if (session.regions.some((r: string) => r.toLowerCase() === locationLower)) {
            score += 2;
        }
    }

    // Metadata flags (+1)
    if (session.metadata?.keynote || session.metadata?.externalSpeaker) {
        score += 1;
    }
    // Also check tags for "External Speaker" / "External speaker"
    if (session.tags?.some((t: string) => t.toLowerCase() === 'external speaker')) {
        score += 1;
    }

    // Job-type affinity (+1)
    const jobType = userProfile.jobType;
    if (jobType) {
        const affinityTags = JOB_TYPE_TAG_AFFINITY[jobType] || [];
        if (affinityTags.length > 0 && hasMatchingTag(session.tags || [], affinityTags)) {
            score += 1;
        }
    }

    return score;
}

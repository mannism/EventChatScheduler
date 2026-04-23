/**
 * lib/data.ts
 *
 * Server-side data loaders. Reads session and exhibitor JSON from disk
 * and provides utility functions for querying event data.
 * Used by page-level Server Components to pre-load data at request time.
 */

import fs from 'fs';
import path from 'path';
import { Session, Exhibitor } from './types';

/** Load all sessions from the consolidated JSON data file */
export async function getSessions(): Promise<Session[]> {
    const filePath = path.join(process.cwd(), 'lib/data/sessions.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContents) as { sessions: Session[] };
    return data.sessions;
}

/** Load all exhibitors and partners from the exhibitors JSON data file */
export async function getExhibitors(): Promise<Exhibitor[]> {
    const filePath = path.join(process.cwd(), 'data/Scheduler_2026_exhibitors.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContents) as { exhibitors: Exhibitor[] };
    return data.exhibitors;
}

/**
 * Load keynote sessions — filtered to the 'Supercharge' track and sorted
 * chronologically. Used by the landing page to highlight featured speakers.
 */
export async function getKeynotes(): Promise<Session[]> {
    const sessions = await getSessions();
    return sessions
        .filter(s => s.track === 'Supercharge')
        .sort((a, b) => a.startDateTime.localeCompare(b.startDateTime));
}


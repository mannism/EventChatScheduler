/**
 * lib/data.ts
 *
 * Server-side session data loader. Reads the consolidated sessions JSON
 * from disk and provides utility functions for querying session data.
 * Used by the home page (app/page.tsx) to pre-load sessions at build time.
 */

import fs from 'fs';
import path from 'path';
import { Session } from './types';

/** Load all sessions from the consolidated JSON data file */
export async function getSessions(): Promise<Session[]> {
    const filePath = path.join(process.cwd(), 'lib/data/sessions.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    return data.sessions;
}

/** Find a single session by its unique ID */
export function getSessionById(id: string, sessions: Session[]): Session | undefined {
    return sessions.find(s => s.id === id);
}

/** Extract and sort all unique tags across all sessions */
export function getUniqueTags(sessions: Session[]): string[] {
    const tags = new Set<string>();
    sessions.forEach(session => {
        if (session.tags) {
            session.tags.forEach(tag => tags.add(tag));
        }
    });
    return Array.from(tags).sort();
}

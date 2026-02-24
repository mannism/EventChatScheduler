import fs from 'fs';
import path from 'path';
import { Session } from './types';

export async function getSessions(): Promise<Session[]> {
    const filePath = path.join(process.cwd(), 'lib/data/sessions.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    return data.sessions;
}

export function getSessionById(id: string, sessions: Session[]): Session | undefined {
    return sessions.find(s => s.id === id);
}

export function getUniqueTags(sessions: Session[]): string[] {
    const tags = new Set<string>();
    sessions.forEach(session => {
        if (session.tags) {
            session.tags.forEach(tag => tags.add(tag));
        }
    });
    return Array.from(tags).sort();
}

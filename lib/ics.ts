/**
 * lib/ics.ts
 *
 * Generates ICS (iCalendar) content from an API schedule for calendar app import.
 */

import { APISchedule } from './types';

function padZero(n: number): string {
    return n.toString().padStart(2, '0');
}

/** Convert "HH:MM" time string + ISO date to ICS datetime format (YYYYMMDDTHHMMSS) */
function toICSDateTime(date: string, time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const [year, month, day] = date.split('-').map(Number);
    return `${year}${padZero(month)}${padZero(day)}T${padZero(hours)}${padZero(minutes)}00`;
}

/** Escape special characters for ICS text fields */
function escapeICS(text: string): string {
    return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function generateICS(schedule: APISchedule, userName?: string): string {
    const lines: string[] = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//XYZ//AIConferenceAssistant//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:XyzCon 2026 - ${escapeICS(userName || 'My Schedule')}`,
        'X-WR-TIMEZONE:Australia/Melbourne',
    ];

    for (const [date, dayData] of Object.entries(schedule)) {
        for (const session of dayData.sessions) {
            // Parse time range "HH:MM - HH:MM"
            const timeParts = session.time.split(' - ');
            if (timeParts.length !== 2) continue;

            const startTime = timeParts[0].trim();
            const endTime = timeParts[1].trim();

            lines.push('BEGIN:VEVENT');
            lines.push(`DTSTART;TZID=Australia/Melbourne:${toICSDateTime(date, startTime)}`);
            lines.push(`DTEND;TZID=Australia/Melbourne:${toICSDateTime(date, endTime)}`);
            lines.push(`SUMMARY:${escapeICS(session.title)}`);

            const descParts: string[] = [];
            if (session.presenters && session.presenters !== 'N/A') {
                descParts.push(`Presenters: ${session.presenters}`);
            }
            if (session.summary) {
                descParts.push(session.summary);
            }
            if (descParts.length > 0) {
                lines.push(`DESCRIPTION:${escapeICS(descParts.join('\\n'))}`);
            }

            if (session.stage) {
                lines.push(`LOCATION:${escapeICS(session.stage)}`);
            }

            lines.push(`UID:${date}-${startTime.replace(':', '')}-${escapeICS(session.title).substring(0, 20)}@xyzcon2026`);
            lines.push('END:VEVENT');
        }
    }

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
}

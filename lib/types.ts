/**
 * lib/types.ts
 *
 * Core TypeScript interfaces shared across the application.
 * Defines the data shapes for sessions, user profiles, schedules,
 * and the API response format used by the createSchedule tool.
 */

/** A single event session from the consolidated sessions dataset */
export interface Session {
    id: string;
    title: string;
    track: string;
    stageNumber: string;
    stage: string;
    startDateTime: string;
    endDateTime: string;
    tags: string[];
    regions: string[];
    presenters?: string[];
    description?: string;
    shortDescription?: string;
    metadata?: {
        appPartner?: string;
        [key: string]: unknown;
    };
}

/** An exhibitor or event partner at the conference */
export interface Exhibitor {
    name: string;
    tags: string[];
    shortDescription?: string;
    description?: string;
    regions?: string[];
}

/** User profile collected during the onboarding flow */
export interface UserProfile {
    name: string;
    jobType: string;
    attendanceDays: string[]; // "Sept 3", "Sept 4"
    interests: string[];
    location: string;
}

/** A single item in the client-side generated schedule (used by ScheduleView) */
export interface ScheduleItem {
    session: Session;
    type: 'session' | 'keynote' | 'networking' | 'lunch' | 'break';
}

/** One day's worth of schedule items, sorted chronologically */
export interface DaySchedule {
    date: string;
    items: ScheduleItem[];
}

/** Complete multi-day schedule rendered by the ScheduleView component */
export interface Schedule {
    days: DaySchedule[];
}

/** API schedule format returned by the createSchedule tool */
export interface APIScheduleSession {
    time: string;
    title: string;
    stage: string;
    presenters: string;
    summary: string;
}

export interface APIScheduleDay {
    sessions: APIScheduleSession[];
    exhibitors: string[];
}

export type APISchedule = Record<string, APIScheduleDay>;

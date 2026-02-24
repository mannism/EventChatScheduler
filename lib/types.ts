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
    metadata?: {
        appPartner?: string;
        [key: string]: any;
    };
}

export interface UserProfile {
    name: string;
    jobType: string;
    attendanceDays: string[]; // "Sept 3", "Sept 4"
    interests: string[];
    location: string;
}

export interface ScheduleItem {
    session: Session;
    type: 'session' | 'keynote' | 'networking' | 'lunch' | 'break';
}

export interface DaySchedule {
    date: string;
    items: ScheduleItem[];
}

export interface Schedule {
    days: DaySchedule[];
}

/**
 * ViewScheduleButton.tsx
 * 
 * Component that appears inside the Chat Interface when the LLM generates a personalized schedule.
 * Instead of generating a PDF, this button safely caches the user's generated JSON payload in
 * sessionStorage and opens a dedicated, printable HTML view in a new browser tab.
 */

"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2 } from 'lucide-react';
import { UserProfile } from '@/lib/types';

interface ViewScheduleButtonProps {
    scheduleData: any;
    userProfile: UserProfile;
}

export function ViewScheduleButton({ scheduleData, userProfile }: ViewScheduleButtonProps) {
    const [isOpening, setIsOpening] = useState(false);

    const handleView = () => {
        setIsOpening(true);

        try {
            // Using sessionStorage to pass the schedule payload to the new tab safely.
            // This avoids URL query string limits when dealing with large JSON schedules,
            // and ensures the sibling tab (on the same origin) can load the data instantly.
            sessionStorage.setItem('xyzScheduleData', JSON.stringify(scheduleData));
            sessionStorage.setItem('xyzUserProfile', JSON.stringify(userProfile));

            // Open the new route targeting the dedicated schedule rendering page
            window.open('/schedule', '_blank');
        } catch (err) {
            console.error("Failed to open schedule", err);
        } finally {
            // A short delay so the button interaction feels responsive and purposeful before unspinning
            setTimeout(() => setIsOpening(false), 500);
        }
    };

    return (
        // Note: This component is dynamically rendered inside of a markdown <pre> block. 
        // We explicitly define font-sans, whitespace-normal, and max-w-[100%] to prevent 
        // the parent <pre> tag's monospace/white-space properties from breaking the layout on mobile.
        <div className="my-4 p-4 md:p-5 rounded-2xl border border-border bg-card/60 flex flex-col items-center justify-center space-y-3 md:space-y-4 text-center shadow-sm w-full max-w-[100%] font-sans whitespace-normal box-border overflow-hidden">
            {/* Visible UI */}
            <h3 className="text-lg md:text-xl font-bold font-serif text-foreground whitespace-normal break-words leading-tight">Your Personalized Schedule is Ready!</h3>
            <p className="text-sm text-muted-foreground w-full break-words whitespace-normal text-balance">
                We've generated a 2-day event schedule tailored to your interests and availability, complete with keynotes and recommended exhibitors.
            </p>
            <Button onClick={handleView} disabled={isOpening} className="mt-2 w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl h-12 px-6 whitespace-nowrap font-sans">
                {isOpening ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ExternalLink className="mr-2 h-5 w-5" />}
                {isOpening ? 'Opening...' : 'View Schedule (New Tab)'}
            </Button>
        </div>
    );
}

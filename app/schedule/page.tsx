/**
 * app/schedule/page.tsx
 * 
 * This page serves as a dedicated, printable view for the user's generated schedule.
 * It reads the required schedule data and user profile directly from sessionStorage,
 * bypassing the need for complex URL parameters or heavy state-management libraries.
 */

"use client";

import React, { useEffect, useState } from 'react';
import { UserProfile, APISchedule } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { generateICS } from '@/lib/ics';

export default function ScheduleViewPage() {
    const [scheduleData, setScheduleData] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        try {
            // Read the unique key from URL params, falling back to legacy keys
            const params = new URLSearchParams(window.location.search);
            const key = params.get('key');

            let storedSchedule: string | null = null;
            let storedProfile: string | null = null;

            if (key) {
                storedSchedule = sessionStorage.getItem(`${key}_data`);
                storedProfile = sessionStorage.getItem(`${key}_profile`);
            }

            // Fallback: try legacy keys for backwards compatibility
            if (!storedSchedule || !storedProfile) {
                storedSchedule = storedSchedule || sessionStorage.getItem('xyzScheduleData');
                storedProfile = storedProfile || sessionStorage.getItem('xyzUserProfile');
            }

            if (storedSchedule && storedProfile) {
                setScheduleData(JSON.parse(storedSchedule));
                setUserProfile(JSON.parse(storedProfile));
            } else {
                setError('No schedule data found. Please generate a new schedule from the chat.');
            }
        } catch (err) {
            console.error("Failed to load schedule data", err);
            setError('Failed to load schedule data. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-900">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
                <p className="text-lg">Loading your personalized schedule...</p>
            </div>
        );
    }

    if (error || !scheduleData || !userProfile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-900 p-8">
                <div className="max-w-md w-full text-center p-8 bg-white rounded-xl shadow-lg border border-red-100">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Oops!</h2>
                    <p className="text-gray-600 mb-6">{error || 'Something went wrong.'}</p>
                    <button
                        onClick={() => window.close()}
                        className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
                    >
                        Close Tab
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-8 font-sans selection:bg-blue-100 selection:text-blue-900">
            <div className="max-w-[1280px] mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="bg-slate-900 text-white p-8 border-b border-slate-800">
                    <h1 className="text-4xl font-extrabold tracking-tight mb-2">XyzCon 2026 - Personalized Schedule</h1>
                    <p className="text-xl text-slate-300">Prepared for: <span className="text-white font-medium">{userProfile.name || 'Attendee'}</span></p>
                </div>

                {/* Content */}
                <div className="p-8">
                    {Object.keys(scheduleData).map((date, index) => {
                        const dayData = scheduleData[date];
                        return (
                            <div key={date} className={index > 0 ? "mt-16" : ""}>
                                <div className="mb-6 flex items-center border-b border-slate-200 pb-4">
                                    <h2 className="text-3xl font-bold text-sky-600">Schedule for {date}</h2>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse mb-8 text-sm whitespace-normal">
                                        <thead>
                                            <tr className="bg-slate-100 text-slate-700 uppercase tracking-wide text-xs">
                                                <th className="p-4 border border-slate-200 w-[10%] font-semibold">Time</th>
                                                <th className="p-4 border border-slate-200 w-[22%] font-semibold">Session</th>
                                                <th className="p-4 border border-slate-200 w-[20%] font-semibold">Stage</th>
                                                <th className="p-4 border border-slate-200 w-[20%] font-semibold">Presenters</th>
                                                <th className="p-4 border border-slate-200 w-[28%] font-semibold">Summary</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dayData.sessions.map((s: any, i: number) => (
                                                <tr key={i} className={`hover:bg-slate-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                                    <td className="p-4 border border-slate-200 font-medium whitespace-nowrap text-slate-600">{s.time}</td>
                                                    <td className="p-4 border border-slate-200 font-bold text-slate-800">{s.title}</td>
                                                    <td className="p-4 border border-slate-200 text-slate-700">{s.stage}</td>
                                                    <td className="p-4 border border-slate-200 text-slate-700">{s.presenters || 'N/A'}</td>
                                                    <td className="p-4 border border-slate-200 text-slate-500 leading-relaxed">{s.summary || ''}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {dayData.exhibitors && dayData.exhibitors.length > 0 && (
                                    <div className="p-6 rounded-xl border border-sky-100 bg-sky-50 shadow-sm mt-6">
                                        <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                                            <svg className="w-6 h-6 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                            Recommended Exhibitors
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {dayData.exhibitors.map((exhibitor: string, eIdx: number) => (
                                                <span key={eIdx} className="px-3 py-1 bg-white border border-sky-200 text-sky-800 rounded-full text-sm font-medium shadow-sm">
                                                    {exhibitor}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="bg-slate-50 p-6 text-center border-t border-slate-200">
                    <div className="flex flex-wrap justify-center gap-3">
                        <button
                            onClick={() => window.print()}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md transition-all hover:shadow-lg focus:ring-4 focus:ring-blue-100"
                        >
                            Print Schedule
                        </button>
                        <button
                            onClick={() => {
                                const ics = generateICS(scheduleData as APISchedule, userProfile?.name);
                                const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `XyzCon_2026_Schedule_${(userProfile?.name || 'Attendee').replace(/\s+/g, '_')}.ics`;
                                a.click();
                                URL.revokeObjectURL(url);
                            }}
                            className="px-8 py-3 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-xl shadow-md transition-all hover:shadow-lg focus:ring-4 focus:ring-sky-100"
                        >
                            Add to Calendar
                        </button>
                    </div>
                    <p className="text-sm text-slate-500 mt-4">For best print results, use Landscape orientation on A4/Letter size.</p>
                </div>
            </div>
        </div>
    );
}

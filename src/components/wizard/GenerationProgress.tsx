'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import { StreamEvent, AgentStep } from '@/types/agents';
import { clsx } from 'clsx';

const STEPS: AgentStep[] = [
    { step: 1, name: 'Scope Extraction', status: 'pending' },
    { step: 2, name: 'Research Plan', status: 'pending' },
    { step: 3, name: 'Web Research', status: 'pending' },
    { step: 4, name: 'Market Sizing', status: 'pending' },
    { step: 5, name: 'Drafting Sections', status: 'pending' },
    { step: 6, name: 'Social & Tech Intelligence', status: 'pending' },
    { step: 7, name: 'Executive Summary', status: 'pending' },
    { step: 8, name: 'Formatting Report', status: 'pending' },
];

const STEP_ICONS: Record<number, string> = {
    1: '🧭',
    2: '📋',
    3: '🔍',
    4: '📊',
    5: '✍️',
    6: '📡',
    7: '📝',
    8: '🎨',
};

interface GenerationProgressProps {
    jobId: string;
    meta: {
        label: string;
        accent: string;
        badgeVariant: string;
    };
}

export default function GenerationProgress({ jobId, meta }: GenerationProgressProps) {
    const router = useRouter();
    const [steps, setSteps] = useState<AgentStep[]>(STEPS);
    const [currentStep, setCurrentStep] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [reportId, setReportId] = useState('');
    const [error, setError] = useState('');
    const [syncStatus, setSyncStatus] = useState<'connected' | 'reconnecting' | 'polling'>('connected');

    // Use refs for values that shouldn't trigger re-renders or be stale in effects
    const isCompleteRef = useRef(false);

    useEffect(() => {
        let eventSource: EventSource | null = null;
        let redirectTimeout: NodeJS.Timeout;
        let pollInterval: NodeJS.Timeout;

        const connectStream = () => {
            if (isCompleteRef.current) return;

            if (eventSource) eventSource.close();

            eventSource = new EventSource(`/api/generate/${jobId}/stream`);

            eventSource.onmessage = (event) => {
                try {
                    const data: StreamEvent = JSON.parse(event.data);
                    setSyncStatus('connected');

                    if (data.type === 'step_start') {
                        setCurrentStep(data.step);
                        setSteps((prev) => prev.map((s) => s.step === data.step ? { ...s, status: 'running', startedAt: data.timestamp } : s));
                    } else if (data.type === 'step_complete') {
                        setSteps((prev) => prev.map((s) => s.step === data.step ? { ...s, status: 'completed', completedAt: data.timestamp, durationMs: s.startedAt ? new Date(data.timestamp).getTime() - new Date(s.startedAt).getTime() : undefined } : s));
                    } else if (data.type === 'step_progress') {
                        setSteps((prev) => prev.map((s) => s.step === data.step && data.data ? { ...s, progressText: `Completed ${data.data.sectionsCompleted}/${data.data.totalSections} sections` } : s));
                    } else if (data.type === 'step_error') {
                        setSteps((prev) => prev.map((s) => (s.step === data.step ? { ...s, status: 'failed' } : s)));
                        setError(`Step ${data.step} failed: ${data.error || 'Unknown error'}`);
                        eventSource?.close();
                    } else if (data.type === 'job_complete') {
                        handleComplete(data.reportId || '');
                    } else if (data.type === 'timeout') {
                        setSyncStatus('polling');
                    }
                } catch (err) { }
            };

            eventSource.onerror = () => {
                console.warn("Stream interrupted, switching to polling mode...");
                setSyncStatus('polling');
            };
        };

        const handleComplete = (id: string) => {
            if (isCompleteRef.current) return;
            isCompleteRef.current = true;
            setIsComplete(true);
            setReportId(id);
            redirectTimeout = setTimeout(() => {
                if (id) router.push(`/report/${id}`);
            }, 2500);
        };

        const pollStatus = async () => {
            if (isCompleteRef.current) return;
            try {
                const res = await fetch(`/api/generate/${jobId}/status`);
                if (!res.ok) return;
                const data = await res.json();

                if (data.status === 'completed') {
                    handleComplete(data.reportId);
                } else if (data.status === 'failed') {
                    setError(data.errorMessage || 'Report generation failed');
                }
            } catch (e) { }
        };

        connectStream();
        pollInterval = setInterval(pollStatus, 5000);

        return () => {
            eventSource?.close();
            clearTimeout(redirectTimeout);
            clearInterval(pollInterval);
        };
    }, [jobId, router]);

    const [timeLeft, setTimeLeft] = useState(meta.label === 'Trends Report' ? 60 : 300);

    useEffect(() => {
        if (isComplete || timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [isComplete, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const progress = Math.min(99, Math.round((steps.filter((s) => s.status === 'completed').length / steps.length) * 100));

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}

            {/* Sync Status Badge */}
            {!isComplete && !error && (
                <div className="flex justify-center">
                    <span className={clsx(
                        "text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1.5 transition-colors duration-500",
                        syncStatus === 'connected' ? "bg-green-50 text-green-600 border-green-200" : "bg-amber-50 text-amber-600 border-amber-200"
                    )}>
                        <span className={clsx("w-1.5 h-1.5 rounded-full", syncStatus === 'connected' ? "bg-green-500" : "bg-amber-500 animate-pulse")}></span>
                        {syncStatus === 'connected' ? "Live Stream Active" : "Synchronizing Status..."}
                    </span>
                </div>
            )}

            {/* Progress Bar Header */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#6b7280] uppercase tracking-wider">Report Completion</p>
                    <p className="text-sm font-bold" style={{ color: meta.accent }}>{isComplete ? '100%' : `${progress}%`}</p>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full transition-all duration-500 rounded-full"
                        style={{ width: `${isComplete ? 100 : progress}%`, backgroundColor: meta.accent }}
                    />
                </div>
                {!isComplete && (
                    <p className="text-center text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-2">
                        Estimated Time Remaining: {formatTime(timeLeft)}
                    </p>
                )}
            </div>

            {/* Compact Status Indicator */}
            <div className="flex flex-col items-center justify-center py-12 px-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm transition-all duration-500">
                {!isComplete ? (
                    <>
                        <div className="relative mb-6">
                            <div className="w-16 h-16 rounded-full border-4 border-gray-100 border-t-current animate-spin" style={{ color: meta.accent }}></div>
                            <div className="absolute inset-0 flex items-center justify-center text-2xl">
                                {STEP_ICONS[currentStep] || '⚡'}
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {steps.find(s => s.step === currentStep)?.name || 'Initializing...'}
                        </h3>
                        <p className="text-sm text-gray-500 font-medium animate-pulse">
                            {steps.find(s => s.step === currentStep)?.progressText || 'Processing deep market intelligence...'}
                        </p>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl mb-4 text-green-600 animate-bounce">
                            ✓
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">Research Complete</h3>
                        <p className="text-sm text-green-600 font-medium">Redirecting to your results...</p>
                    </>
                )}
            </div>

            {/* Pro Tip */}
            <div className="flex gap-4 bg-[#f8fafc] p-5 rounded-2xl border border-blue-100/50">
                <div className="text-xl shrink-0 opacity-80">💡</div>
                <div>
                    <p className="font-bold text-slate-800 mb-1 text-sm tracking-tight text-left">Pro Tip</p>
                    <p className="text-xs text-slate-500 leading-relaxed text-left font-medium">
                        Your {meta.label.toLowerCase()} is being built with high-depth accuracy. You can close this window at any time;
                        the processing will continue and results will appear on your Dashboard.
                    </p>
                </div>
            </div>
        </div>
    );
}

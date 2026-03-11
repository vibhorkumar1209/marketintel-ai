'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import { StreamEvent, AgentStep } from '@/types/agents';
import { clsx } from 'clsx';

const REPORT_SECTIONS: Record<string, string[]> = {
    'Industry Report': ['Research & Sizing', 'Executive Summary', 'Intro', 'Market Size', 'Segmentation', 'Dynamics', 'Tech', 'Competitive', 'Regulatory', 'Opportunities', 'Finalizing'],
    'Trends Report': ['Research & Discovery', 'Dynamics Analysis', 'Finalizing'],
    'Market Datapack': ['Planning', 'Data Extraction', 'Market Sizing', 'Competitive Share', 'Dynamics', 'Regional Analysis', 'Excel Generation']
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
    const [currentStep, setCurrentStep] = useState(0);
    const [subProgress, setSubProgress] = useState({ current: 0, total: 0 });
    const [statusText, setStatusText] = useState('Initializing research agents...');
    const [isComplete, setIsComplete] = useState(false);
    const [reportId, setReportId] = useState('');
    const [error, setError] = useState('');
    const [syncStatus, setSyncStatus] = useState<'connected' | 'reconnecting' | 'polling'>('connected');

    const sections = REPORT_SECTIONS[meta.label] || REPORT_SECTIONS['Industry Report'];
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
                    const data: any = JSON.parse(event.data);
                    setSyncStatus('connected');

                    if (data.type === 'connected') {
                        if (data.currentStep > 0) {
                            setCurrentStep(data.currentStep);
                            if (data.sectionsCompleted) setSubProgress({ current: data.sectionsCompleted, total: data.totalSections || 8 });
                        }
                    } else if (data.type === 'step_start') {
                        setCurrentStep(data.step);
                        setStatusText(data.stepName);
                    } else if (data.type === 'step_complete') {
                        setCurrentStep(data.step + 1);
                    } else if (data.type === 'step_progress') {
                        if (data.data) {
                            setSubProgress({ current: data.data.sectionsCompleted, total: data.data.totalSections });
                            setStatusText(`Drafting: ${data.data.sectionId.replace(/_/g, ' ')}`);
                        }
                    } else if (data.type === 'step_error') {
                        setError(`Error: ${data.error || 'Unknown failure'}`);
                        eventSource?.close();
                    } else if (data.type === 'job_complete') {
                        handleComplete(data.reportId || '');
                    } else if (data.type === 'timeout') {
                        setSyncStatus('polling');
                    }
                } catch (err) { }
            };

            eventSource.onerror = () => setSyncStatus('polling');
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
                if (data.status === 'completed') handleComplete(data.reportId);
                else if (data.status === 'failed') setError(data.errorMessage || 'Report generation failed');
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

    const [timeLeft, setTimeLeft] = useState(meta.label === 'Trends Report' ? 60 : 180);

    useEffect(() => {
        if (isComplete || timeLeft <= 0) return;
        const timer = setInterval(() => setTimeLeft(prev => Math.max(0, prev - 1)), 1000);
        return () => clearInterval(timer);
    }, [isComplete, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    // Granular progress calculation
    const calculateProgress = () => {
        if (isComplete) return 100;
        if (currentStep <= 4) return currentStep * 10; // Phase 1-4: 0-40%
        if (currentStep === 5) { // Drafting Phase: 40-90%
            const ratio = subProgress.total > 0 ? subProgress.current / subProgress.total : 0;
            return Math.min(90, 40 + Math.round(ratio * 50));
        }
        if (currentStep > 5) return 90 + (currentStep - 5) * 3; // Finalizing: 90-100%
        return 0;
    };

    const progress = calculateProgress();

    return (
        <div className="space-y-12 py-10 animate-in fade-in duration-700">
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center shadow-sm">
                    <p className="text-red-600 font-semibold">{error}</p>
                    <button onClick={() => window.location.reload()} className="mt-4 text-sm font-bold text-red-700 underline underline-offset-4">Retry Generation</button>
                </div>
            )}

            {/* Header Area */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/50 backdrop-blur-md border border-gray-100 rounded-full shadow-sm">
                    <span className={clsx("w-2 h-2 rounded-full", syncStatus === 'connected' ? "bg-green-500 animate-pulse" : "bg-amber-500")}></span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        {isComplete ? 'Analysis Finished' : 'Research in Progress'}
                    </span>
                </div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                    {progress}% <span className="text-gray-300">Complete</span>
                </h2>
            </div>

            {/* Progress Bar Container */}
            <div className="relative max-w-2xl mx-auto px-4">
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200/50">
                    <div
                        className="h-full transition-all duration-1000 ease-out rounded-full relative overflow-hidden"
                        style={{
                            width: `${progress}%`,
                            backgroundColor: meta.accent,
                            backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 2s infinite linear'
                        }}
                    >
                    </div>
                </div>

                {/* Status Text & Timer */}
                <div className="mt-8 flex flex-col items-center gap-6">
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">
                            {isComplete ? 'Generating final report...' : statusText}
                        </p>
                        {!isComplete && (
                            <div className="h-6 flex items-center gap-4">
                                <span className="text-[13px] font-bold text-slate-400">
                                    ESTIMATED TIME: {formatTime(timeLeft)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            `}</style>

            {/* Subtle Footnote */}
            {!isComplete && (
                <div className="flex justify-center pt-8">
                    <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-4 rounded-2xl max-w-sm">
                        <p className="text-[11px] leading-relaxed text-slate-500 text-center font-medium opacity-80">
                            Our agents are currently scanning high-depth data sources including company filings, news archives, and regulatory databases.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

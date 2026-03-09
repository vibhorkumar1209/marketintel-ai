import React, { useEffect, useState } from 'react';
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

    useEffect(() => {
        let eventSource: EventSource;
        let redirectTimeout: NodeJS.Timeout;

        const connect = () => {
            try {
                eventSource = new EventSource(`/api/generate/${jobId}/stream`);

                eventSource.onmessage = (event) => {
                    try {
                        const data: StreamEvent = JSON.parse(event.data);

                        if (data.type === 'step_start') {
                            setCurrentStep(data.step);
                            setSteps((prev) =>
                                prev.map((s) =>
                                    s.step === data.step
                                        ? { ...s, status: 'running', startedAt: data.timestamp }
                                        : s
                                )
                            );
                        } else if (data.type === 'step_complete') {
                            setSteps((prev) =>
                                prev.map((s) =>
                                    s.step === data.step
                                        ? {
                                            ...s,
                                            status: 'completed',
                                            completedAt: data.timestamp,
                                            durationMs: s.startedAt
                                                ? new Date(data.timestamp).getTime() - new Date(s.startedAt).getTime()
                                                : undefined,
                                        }
                                        : s
                                )
                            );
                        } else if (data.type === 'step_progress') {
                            setSteps((prev) =>
                                prev.map((s) =>
                                    s.step === data.step && data.data
                                        ? {
                                            ...s,
                                            progressText: `Completed ${data.data.sectionsCompleted}/${data.data.totalSections} sections`
                                        }
                                        : s
                                )
                            );
                        } else if (data.type === 'step_error') {
                            setSteps((prev) =>
                                prev.map((s) => (s.step === data.step ? { ...s, status: 'failed' } : s))
                            );
                            setError(`Step ${data.step} failed: ${data.error || 'Unknown error'}`);
                            eventSource.close();
                        } else if (data.type === 'job_complete') {
                            setIsComplete(true);
                            setReportId(data.reportId || '');
                            // Redirect to report after 2 seconds
                            redirectTimeout = setTimeout(() => {
                                if (data.reportId) {
                                    router.push(`/report/${data.reportId}`);
                                }
                            }, 2000);
                        }
                    } catch (err) {
                        console.error('Failed to parse stream event:', err);
                    }
                };

                eventSource.onerror = (e) => {
                    if (eventSource.readyState === EventSource.CLOSED) return;
                    console.error("EventSource failed:", e);
                    eventSource.close();
                    setError('Connection lost. Please refresh the page to see the latest status.');
                };
            } catch (err) {
                setError('Failed to connect to generation stream');
                console.error(err);
            }
        };

        connect();

        return () => {
            eventSource?.close();
            clearTimeout(redirectTimeout);
        };
    }, [jobId, router]);

    const [timeLeft, setTimeLeft] = useState(meta.label === 'Trends Report' ? 60 : 180);

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

            {/* Current Step Text */}
            <div className="flex justify-center mt-6">
                {isComplete ? (
                    <p className="text-sm text-green-600 font-medium">Generation Complete!</p>
                ) : (
                    <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: meta.accent }}></span>
                        {currentStep > 0 ? 'Analyzing data and drafting report...' : 'Initializing research engine...'}
                    </p>
                )}
            </div>

            {/* Completion Message */}
            {isComplete && (
                <Card variant="highlighted" className="bg-green-50 border-green-200">
                    <div className="text-center space-y-3 py-4">
                        <div className="text-4xl">✓</div>
                        <div>
                            <h3 className="text-xl font-bold text-green-700 mb-2">{meta.label} Generation Complete!</h3>
                            <p className="text-green-600/80">
                                Opening your results...
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Tips */}
            <div className="flex gap-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div className="text-xl">💡</div>
                <div>
                    <p className="font-semibold text-blue-900 mb-1 text-sm">Pro Tip</p>
                    <p className="text-xs text-blue-700/80 leading-relaxed">
                        This module will automatically redirect when the {meta.label.toLowerCase()} is ready. You can close this window
                        and track progress from the Dashboard later.
                    </p>
                </div>
            </div>
        </div>
    );
}

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

    const progress = Math.round((steps.filter((s) => s.status === 'completed').length / steps.length) * 100);

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
                    <p className="text-sm font-semibold text-[#8899BB] uppercase tracking-wider">Overall Progress</p>
                    <p className="text-sm font-bold" style={{ color: meta.accent }}>{progress}%</p>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full transition-all duration-500 rounded-full"
                        style={{ width: `${progress}%`, backgroundColor: meta.accent }}
                    />
                </div>
            </div>

            {/* Steps Card */}
            <Card>
                <div className="space-y-4">
                    {steps.map((step, index) => {
                        // Apply different branding colors instead of hardcoded teal/green
                        const isCompleted = step.status === 'completed';
                        const isRunning = step.status === 'running';
                        const isFailed = step.status === 'failed';
                        const isPending = step.status === 'pending';

                        return (
                            <div key={step.step} className="flex items-start gap-4">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={clsx(
                                            'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300',
                                            isCompleted && 'bg-green-100 text-green-600',
                                            isRunning && 'text-white animate-pulse shadow-md',
                                            isFailed && 'bg-red-100 text-red-600',
                                            isPending && 'bg-gray-100 text-gray-400 border border-gray-200'
                                        )}
                                        style={isRunning ? { backgroundColor: meta.accent, boxShadow: `0 4px 14px ${meta.accent}40` } : {}}
                                    >
                                        {isCompleted && '✓'}
                                        {isRunning && '◆'}
                                        {isFailed && '✗'}
                                        {isPending && '○'}
                                    </div>

                                    {index < steps.length - 1 && (
                                        <div
                                            className={clsx(
                                                'w-0.5 h-8 mt-2',
                                                isCompleted ? 'bg-green-500' : 'bg-gray-200'
                                            )}
                                        />
                                    )}
                                </div>

                                <div className="flex-1 pt-1.5">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-xl opacity-80">{STEP_ICONS[step.step]}</span>
                                        <h3 className={clsx(
                                            'font-semibold transition-colors',
                                            isCompleted && 'text-green-600 font-bold',
                                            isRunning && 'font-bold',
                                            isFailed && 'text-red-500',
                                            isPending && 'text-gray-400 font-medium'
                                        )}
                                            style={isRunning ? { color: meta.accent } : {}}
                                        >
                                            {step.name}
                                        </h3>
                                    </div>

                                    {step.durationMs && (
                                        <p className="text-xs text-gray-500 ml-9">
                                            Completed in {(step.durationMs / 1000).toFixed(1)}s
                                        </p>
                                    )}

                                    {isRunning && (
                                        <div className="flex items-center gap-2 mt-2 ml-9">
                                            <div className="flex gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: meta.accent }} />
                                                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: meta.accent, animationDelay: '0.1s' }} />
                                                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: meta.accent, animationDelay: '0.2s' }} />
                                            </div>
                                            <span className="text-xs font-medium" style={{ color: meta.accent }}>
                                                {step.progressText ? step.progressText : 'Processing...'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

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

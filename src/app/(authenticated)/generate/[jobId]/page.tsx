'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

export default function GenerationPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId as string;

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
                        ? new Date(data.timestamp).getTime() -
                        new Date(s.startedAt).getTime()
                        : undefined,
                    }
                    : s
                )
              );
            } else if (data.type === 'step_error') {
              setSteps((prev) =>
                prev.map((s) =>
                  s.step === data.step ? { ...s, status: 'failed' } : s
                )
              );
              setError(`Step ${data.step} failed: ${data.error || 'Unknown error'}`);
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

        eventSource.onerror = () => {
          eventSource.close();
          setError('Connection lost. Attempting to reconnect...');
          // Attempt to reconnect after 3 seconds
          setTimeout(connect, 3000);
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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#E8EDF5] mb-2">Generating Your Report</h1>
        <p className="text-[#8899BB]">AI agents are researching and analyzing your market</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-600 bg-opacity-10 border border-red-600 border-opacity-30 rounded-lg p-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[#8899BB]">Overall Progress</p>
          <p className="text-sm font-semibold text-teal-600">{progress}%</p>
        </div>
        <div className="w-full h-3 bg-[#0A1628] border border-[#2A3A55] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-600 to-teal-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <Card>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.step} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={clsx(
                    'w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300',
                    step.status === 'completed' &&
                    'bg-green-600 text-white shadow-lg shadow-green-600/50',
                    step.status === 'running' &&
                    'bg-teal-600 text-white animate-pulse shadow-lg shadow-teal-600/50',
                    step.status === 'failed' &&
                    'bg-red-600 text-white shadow-lg shadow-red-600/50',
                    step.status === 'pending' &&
                    'bg-[#1B2A4A] text-[#8899BB] border border-[#2A3A55]'
                  )}
                >
                  {step.status === 'completed' && '✓'}
                  {step.status === 'running' && '◆'}
                  {step.status === 'failed' && '✗'}
                  {step.status === 'pending' && '○'}
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={clsx(
                      'w-1 h-8 mt-2',
                      step.status === 'completed' ? 'bg-green-600' : 'bg-[#2A3A55]'
                    )}
                  />
                )}
              </div>

              <div className="flex-1 pt-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{STEP_ICONS[step.step]}</span>
                  <h3 className={clsx(
                    'font-semibold transition-colors',
                    step.status === 'completed' && 'text-green-400',
                    step.status === 'running' && 'text-teal-400',
                    step.status === 'failed' && 'text-red-400',
                    step.status === 'pending' && 'text-[#8899BB]'
                  )}>
                    {step.name}
                  </h3>
                </div>

                {step.durationMs && (
                  <p className="text-xs text-[#8899BB]">
                    Completed in {(step.durationMs / 1000).toFixed(1)}s
                  </p>
                )}

                {step.status === 'running' && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span className="text-xs text-teal-600">Processing...</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Completion Message */}
      {isComplete && (
        <Card variant="highlighted" className="bg-green-600 bg-opacity-5 border-green-600">
          <div className="text-center space-y-4">
            <div className="text-5xl">✓</div>
            <div>
              <h3 className="text-xl font-bold text-green-400 mb-2">Report Generation Complete!</h3>
              <p className="text-[#8899BB]">
                Your report is ready. Redirecting to the report viewer...
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tips */}
      <Card className="bg-blue-600 bg-opacity-5 border-blue-600">
        <div className="flex gap-3">
          <div className="text-2xl">💡</div>
          <div>
            <p className="font-semibold text-[#E8EDF5] mb-1">Tip</p>
            <p className="text-sm text-[#8899BB]">
              This page will automatically redirect when the report is ready. You can leave
              this page and come back to it later to check progress.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

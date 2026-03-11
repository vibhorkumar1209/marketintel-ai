import { publishStreamEvent } from '@/lib/redis';
import { db } from '@/lib/db';
import { StreamEvent } from '@/types/agents';

export class StreamHandler {
  constructor(private readonly jobId: string) { }

  async emit(event: Omit<StreamEvent, 'timestamp'>, extraData?: object): Promise<void> {
    const fullEvent: StreamEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    // Publish to Redis for SSE polling
    await publishStreamEvent(this.jobId, fullEvent);

    // Update job record in DB
    if (event.type === 'step_start' || event.type === 'step_complete' || event.type === 'step_progress') {
      const isProgress = event.type === 'step_progress';
      const pct = isProgress ? undefined : Math.round((event.step / 8) * 100);

      await db.job.update({
        where: { id: this.jobId },
        data: {
          ...(pct !== undefined && { progressPct: pct }),
          currentStep: event.step,
          currentStepName: event.stepName,
          status: 'processing',
          updatedAt: new Date(),
          ...extraData,
        },
      });
    }

    if (event.type === 'job_complete') {
      await db.job.update({
        where: { id: this.jobId },
        data: {
          status: 'completed',
          progressPct: 100,
          completedAt: new Date(),
        },
      });
    }

    if (event.type === 'step_error') {
      await db.job.update({
        where: { id: this.jobId },
        data: {
          status: 'failed',
          errorMessage: event.error,
        },
      });
    }
  }

  async stepStart(step: number, stepName: string) {
    await this.emit({ type: 'step_start', step, stepName });
  }

  async stepComplete(step: number, stepName: string, data?: object) {
    await this.emit({ type: 'step_complete', step, stepName, data });
  }

  async stepError(step: number, stepName: string, error: string) {
    await this.emit({ type: 'step_error', step, stepName, error });
  }

  async stepProgress(step: number, stepName: string, progressData: object, extraJobData?: object) {
    await this.emit({ type: 'step_progress', step, stepName, data: progressData as any }, extraJobData);
  }

  async jobComplete(reportId: string) {
    await this.emit({ type: 'job_complete', step: 8, stepName: 'Complete', reportId });
  }
}

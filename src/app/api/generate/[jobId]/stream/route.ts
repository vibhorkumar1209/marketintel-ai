import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { drainStreamEvents } from '@/lib/redis';
import { runIndustryReportPipeline } from '@/services/report-generation/industry-report';
import { runDatapackPipeline } from '@/services/report-generation/datapack';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 900;

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const job = await db.job.findUnique({ where: { id: params.jobId } });
  if (!job || job.userId !== session.user.id) {
    return new Response('Not found', { status: 404 });
  }

  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        if (closed) return;
        try {
          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
        } catch { /* stream closed */ }
      };

      // Send initial status and catch-up data
      send({
        type: 'connected',
        jobId: params.jobId,
        status: job.status,
        currentStep: job.currentStep,
        sectionsCompleted: Array.isArray(job.draftedSections) ? job.draftedSections.length : 0,
        timestamp: new Date().toISOString(),
      });

      // If already completed, send final event and close
      if (job.status === 'completed') {
        const report = await db.report.findUnique({ where: { jobId: params.jobId } });
        send({ type: 'job_complete', step: 8, stepName: 'Complete', reportId: report?.id, timestamp: new Date().toISOString() });
        controller.close();
        return;
      }

      if (job.status === 'failed') {
        send({ type: 'step_error', step: 0, stepName: 'Failed', error: job.errorMessage, timestamp: new Date().toISOString() });
        controller.close();
        return;
      }

      // Try to transition job from queued -> running OR recover a zombie job
      const isStale = (job.status === 'running' || job.status === 'processing') &&
        (Date.now() - new Date(job.updatedAt).getTime() > 2.5 * 60 * 1000);

      if (job.status === 'queued' || isStale) {
        const updated = await db.job.updateMany({
          where: {
            id: params.jobId,
            OR: [
              { status: 'queued' },
              { status: job.status, updatedAt: job.updatedAt } // Only the first connection wins resumption
            ]
          },
          data: { status: 'running', updatedAt: new Date() }
        });

        if (updated.count > 0) {
          let pipelineFn: typeof runIndustryReportPipeline | typeof runDatapackPipeline;
          if (job.reportType === 'industry_report' || job.reportType === 'trends_report') {
            pipelineFn = (jobId: string, userId: string, query: string, config: any) =>
              runIndustryReportPipeline(jobId, userId, query, config, job.reportType);
          } else {
            pipelineFn = runDatapackPipeline;
          }

          console.log(`[STREAM] Triggering/Resuming pipeline for job ${job.id} (stale: ${isStale})`);
          pipelineFn(job.id, session.user.id, job.query, job.config as any).catch(console.error);
        }
      }

      let lastPing = Date.now();

      // Poll Redis for new events
      const pollInterval = setInterval(async () => {
        if (closed) {
          clearInterval(pollInterval);
          return;
        }

        try {
          const events = await drainStreamEvents(params.jobId);
          for (const eventStr of events) {
            try {
              const event = JSON.parse(eventStr);
              send(event);

              if (event.type === 'job_complete' || event.type === 'step_error') {
                clearInterval(pollInterval);
                if (!closed) {
                  closed = true;
                  controller.close();
                }
                return;
              }
            } catch { /* skip malformed event */ }
          }

          if (Date.now() - lastPing > 15000) {
            try {
              controller.enqueue(': ping\n\n');
              lastPing = Date.now();
            } catch { }
          }

          // Also check DB status as fallback
          const updatedJob = await db.job.findUnique({ where: { id: params.jobId } });
          if (updatedJob?.status === 'completed') {
            const report = await db.report.findUnique({ where: { jobId: params.jobId } });
            send({ type: 'job_complete', step: 8, stepName: 'Complete', reportId: report?.id, timestamp: new Date().toISOString() });
            clearInterval(pollInterval);
            if (!closed) { closed = true; controller.close(); }
          } else if (updatedJob?.status === 'failed') {
            send({ type: 'step_error', step: 0, stepName: 'Failed', error: updatedJob.errorMessage, timestamp: new Date().toISOString() });
            clearInterval(pollInterval);
            if (!closed) { closed = true; controller.close(); }
          }
        } catch { /* Redis unavailable — continue polling */ }
      }, 1500); // Poll every 1.5 seconds

      // Timeout after 35 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (!closed) {
          closed = true;
          send({ type: 'timeout', step: 0, stepName: 'Timeout', error: 'Generation timed out after 35 minutes', timestamp: new Date().toISOString() });
          try { controller.close(); } catch { /* already closed */ }
        }
      }, 35 * 60 * 1000);
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

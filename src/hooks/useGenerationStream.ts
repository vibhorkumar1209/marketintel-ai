import { useEffect, useCallback } from 'react';
import { StreamEvent } from '@/types/agents';

export function useGenerationStream(jobId: string, onEvent: (event: StreamEvent) => void) {
  useEffect(() => {
    if (!jobId) return;

    let eventSource: EventSource;

    try {
      eventSource = new EventSource(`/api/generate/${jobId}/stream`);

      eventSource.onmessage = (e) => {
        try {
          const data: StreamEvent = JSON.parse(e.data);
          onEvent(data);
        } catch (err) {
          console.error('Failed to parse stream event:', err);
        }
      };

      eventSource.onerror = () => {
        console.error('EventSource error');
        eventSource.close();
      };
    } catch (err) {
      console.error('Failed to create EventSource:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [jobId, onEvent]);
}

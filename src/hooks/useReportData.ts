'use client';

import { useState, useEffect } from 'react';
import { IndustryReport } from '@/types/reports';

interface UseReportDataReturn {
  report: IndustryReport | null;
  isLoading: boolean;
  error?: string;
}

export function useReportData(reportId: string): UseReportDataReturn {
  const [data, setData] = useState<UseReportDataReturn>({
    report: null,
    isLoading: true,
  });

  useEffect(() => {
    if (!reportId) {
      setData({
        report: null,
        isLoading: false,
        error: 'No report ID provided',
      });
      return;
    }

    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/report/${reportId}`);
        if (res.ok) {
          const report = await res.json();
          setData({
            report,
            isLoading: false,
          });
        } else {
          setData({
            report: null,
            isLoading: false,
            error: 'Report not found',
          });
        }
      } catch (err) {
        setData({
          report: null,
          isLoading: false,
          error: 'An error occurred while loading the report',
        });
        console.error('Failed to fetch report:', err);
      }
    };

    fetchReport();
  }, [reportId]);

  return data;
}

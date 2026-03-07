'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';

interface Job {
  id: string;
  title: string;
  type: 'industry_report' | 'datapack';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  reportId?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [credits, setCredits] = useState<number | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [creditsRes, jobsRes] = await Promise.all([
          fetch('/api/credits'),
          fetch('/api/jobs'),
        ]);

        if (creditsRes.ok) {
          const data = await creditsRes.json();
          setCredits(data.balance);
        }

        if (jobsRes.ok) {
          const data = await jobsRes.json();
          setJobs(data.jobs || []);
        } else {
          setJobs([]);
        }
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'processing':
        return 'amber';
      case 'failed':
        return 'red';
      default:
        return 'navy';
    }
  };

  const getStatusLabel = (status: Job['status']) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'processing':
        return 'Processing';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Spinner size="lg" />
          <p className="text-[#8899BB]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#E8EDF5] mb-2">Dashboard</h1>
        <p className="text-[#8899BB]">Welcome back! Here's what you can do next</p>
      </div>

      {error && (
        <div className="bg-red-600 bg-opacity-10 border border-red-600 border-opacity-30 rounded-lg p-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Credit Balance Card */}
      <Card variant="highlighted" className="hover:shadow-lg hover:shadow-teal-600/20">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[#8899BB] text-sm mb-1">Available Credits</p>
            <h2 className="text-4xl font-bold text-teal-600">
              {credits !== null ? `${credits}` : '...'}
            </h2>
            <p className="text-[#8899BB] text-sm mt-2">
              {credits && credits < 50
                ? '⚠️ Low balance - consider topping up'
                : '✓ Sufficient for multiple reports'}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" href="/billing" size="md">
              Top Up Credits
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-[#E8EDF5] mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="cursor-pointer hover:border-teal-600 transition-colors">
            <Link href="/wizard" className="block space-y-4">
              <div className="text-4xl">📋</div>
              <div>
                <h3 className="text-lg font-semibold text-[#E8EDF5]">New Industry Report</h3>
                <p className="text-[#8899BB] text-sm mt-1">15-section deep research report</p>
              </div>
              <Button variant="primary" size="sm" href="/wizard" className="mt-4">
                Start Report →
              </Button>
            </Link>
          </Card>

          <Card className="cursor-pointer hover:border-teal-600 transition-colors">
            <Link href="/wizard?type=datapack" className="block space-y-4">
              <div className="text-4xl">📊</div>
              <div>
                <h3 className="text-lg font-semibold text-[#E8EDF5]">New Market Datapack</h3>
                <p className="text-[#8899BB] text-sm mt-1">10-sheet Excel data analysis</p>
              </div>
              <Button variant="primary" size="sm" href="/wizard?type=datapack" className="mt-4">
                Start Datapack →
              </Button>
            </Link>
          </Card>
        </div>
      </div>

      {/* Recent Reports */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#E8EDF5]">Recent Reports</h2>
          {jobs.length > 0 && (
            <Link href="/dashboard" className="text-teal-600 hover:text-teal-500 text-sm">
              View All →
            </Link>
          )}
        </div>

        {jobs.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-[#8899BB] mb-4">No reports yet. Create your first report to get started!</p>
            <Button variant="primary" href="/wizard">
              Create Report
            </Button>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2A3A55]">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-[#8899BB]">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-[#8899BB]">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-[#8899BB]">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-[#8899BB]">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-[#8899BB]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.slice(0, 10).map((job) => (
                    <tr
                      key={job.id}
                      className="border-b border-[#2A3A55] hover:bg-[#0f1c33] transition-colors"
                    >
                      <td className="px-6 py-4 text-[#E8EDF5] font-medium max-w-xs truncate">
                        {job.title}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={job.type === 'industry_report' ? 'teal' : 'amber'}>
                          {job.type === 'industry_report' ? 'Report' : 'Datapack'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getStatusColor(job.status) as any}>
                          {getStatusLabel(job.status)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-[#8899BB] text-sm">
                        {formatDate(job.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {job.status === 'completed' && job.reportId && (
                            <>
                              <Link
                                href={`/report/${job.reportId}`}
                                className="text-teal-600 hover:text-teal-500 text-sm font-medium"
                              >
                                View
                              </Link>
                              <span className="text-[#2A3A55]">•</span>
                              <Link
                                href={`/api/report/${job.reportId}/download/pdf`}
                                className="text-teal-600 hover:text-teal-500 text-sm font-medium"
                              >
                                Download
                              </Link>
                            </>
                          )}
                          {job.status === 'processing' && (
                            <Spinner size="sm" />
                          )}
                          {job.status === 'failed' && (
                            <span className="text-red-400 text-sm">Failed</span>
                          )}
                          {job.status === 'pending' && (
                            <span className="text-[#8899BB] text-sm">Pending</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export type JobStatus = 'pending' | 'running' | 'success' | 'error' | 'warning';

export interface JobMetrics {
  batchesProcessed: number;
  totalItemsProcessed: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  providerStats: Record<string, { success: number; error: number }>;
  averageProcessingTimePerItem?: number;
}

export interface JobProgress {
  currentBatch: number;
  totalBatchesEstimated?: number;
  percentComplete?: number;
  currentOffset: number;
}

export interface iJob<Report, JobErrorDetail> {
  jobId: string;
  jobName: string;
  cron: string;
  report: Report;
  status: JobStatus;
  startTime: string;
  endTime: string | null;
  executionTime: number | null;
  error?: Error | string;
  errors: JobErrorDetail[];
  metadata: Record<string, any>;
  metrics: JobMetrics;
  progress: JobProgress;
}

export function createJob<Report, JobErrorDetail>(
  jobName: string,
  cronExpression: string,
  metadata: Record<string, any>,
  baseReport: Report,
): iJob<Report, JobErrorDetail> {
  return {
    jobId: `${jobName}-${Date.now()}`,
    jobName,
    cron: cronExpression,
    report: baseReport,
    status: 'running',
    startTime: new Date().toISOString(),
    endTime: null,
    executionTime: null,
    errors: [],
    metadata: metadata,
    metrics: {
      batchesProcessed: 0,
      totalItemsProcessed: 0,
      successCount: 0,
      errorCount: 0,
      skippedCount: 0,
      providerStats: {},
    },
    progress: {
      currentBatch: 0,
      currentOffset: 0,
    },
  };
}

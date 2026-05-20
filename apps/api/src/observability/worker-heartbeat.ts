import { redis } from '../lib/redis';
import { z } from 'zod';

export type WorkerHeartbeat = {
  service: 'worker';
  workerId: string;
  pid: number;
  startedAt: string;
  heartbeatAt: string;
  activeJobs: number;
  processedJobs: number;
  failedJobs: number;
  outboxPublished: number;
  outboxRecovered: number;
  lastJob?: {
    queueName: string;
    jobId?: string;
    status: 'active' | 'completed' | 'failed';
    at: string;
  };
};

const HEARTBEAT_KEY = 'health:worker:heartbeat';
const HEARTBEAT_TTL_SECONDS = 30;
const workerHeartbeatSchema: z.ZodType<WorkerHeartbeat> = z.object({
  service: z.literal('worker'),
  workerId: z.string(),
  pid: z.number(),
  startedAt: z.string(),
  heartbeatAt: z.string(),
  activeJobs: z.number(),
  processedJobs: z.number(),
  failedJobs: z.number(),
  outboxPublished: z.number(),
  outboxRecovered: z.number(),
  lastJob: z
    .object({
      queueName: z.string(),
      jobId: z.string().optional(),
      status: z.enum(['active', 'completed', 'failed']),
      at: z.string(),
    })
    .optional(),
});

export async function writeWorkerHeartbeat(payload: WorkerHeartbeat) {
  await redis.set(HEARTBEAT_KEY, JSON.stringify(payload), 'EX', HEARTBEAT_TTL_SECONDS);
}

export async function readWorkerHeartbeat(): Promise<WorkerHeartbeat | null> {
  const raw = await redis.get(HEARTBEAT_KEY);
  return raw ? workerHeartbeatSchema.parse(JSON.parse(raw)) : null;
}

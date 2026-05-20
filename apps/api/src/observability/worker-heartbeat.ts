import { redis } from '../lib/redis';

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

export async function writeWorkerHeartbeat(payload: WorkerHeartbeat) {
  await redis.set(HEARTBEAT_KEY, JSON.stringify(payload), 'EX', HEARTBEAT_TTL_SECONDS);
}

export async function readWorkerHeartbeat(): Promise<WorkerHeartbeat | null> {
  const raw = await redis.get(HEARTBEAT_KEY);
  return raw ? (JSON.parse(raw) as WorkerHeartbeat) : null;
}

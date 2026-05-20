type DependencyMetric = {
  ok: boolean;
  checkedAt: string;
  latencyMs?: number;
  error?: string;
};

type HttpMetric = {
  method: string;
  path: string;
  statusCode: number;
  latencyMs: number;
  at: number;
};

const startedAt = Date.now();
const recentWindowMs = 5 * 60_000;
const recentRequests: HttpMetric[] = [];
const recentErrors: Array<{ at: number; code?: string; path?: string }> = [];
const dependencies = new Map<string, DependencyMetric>();
const statusCounts = new Map<string, number>();
const methodCounts = new Map<string, number>();
const errorCounts = new Map<string, number>();

let activeRequests = 0;
let totalRequests = 0;
let totalLatencyMs = 0;
let shutdownStartedAt: string | null = null;

function prune(now = Date.now()) {
  while (recentRequests.length && now - recentRequests[0].at > recentWindowMs) recentRequests.shift();
  while (recentErrors.length && now - recentErrors[0].at > recentWindowMs) recentErrors.shift();
}

export function beginRequest() {
  activeRequests += 1;
}

export function endRequest() {
  activeRequests = Math.max(0, activeRequests - 1);
}

export function recordHttpRequest(input: Omit<HttpMetric, 'at'>) {
  const at = Date.now();
  totalRequests += 1;
  totalLatencyMs += input.latencyMs;
  statusCounts.set(String(input.statusCode), (statusCounts.get(String(input.statusCode)) ?? 0) + 1);
  methodCounts.set(input.method, (methodCounts.get(input.method) ?? 0) + 1);
  recentRequests.push({ ...input, at });
  if (input.statusCode >= 500) recordError({ code: `HTTP_${input.statusCode}`, path: input.path });
  prune(at);
}

export function recordError(input: { code?: string; path?: string }) {
  const at = Date.now();
  const code = input.code ?? 'UNKNOWN';
  errorCounts.set(code, (errorCounts.get(code) ?? 0) + 1);
  recentErrors.push({ at, code, path: input.path });
  prune(at);
}

export function recordDependency(name: string, metric: Omit<DependencyMetric, 'checkedAt'>) {
  dependencies.set(name, { ...metric, checkedAt: new Date().toISOString() });
}

export function markShutdownStarted() {
  shutdownStartedAt = new Date().toISOString();
}

export function isShuttingDown() {
  return shutdownStartedAt !== null;
}

export function getActiveRequests() {
  return activeRequests;
}

export function metricsSnapshot() {
  prune();
  const lastMinute = Date.now() - 60_000;
  const requests1m = recentRequests.filter((r) => r.at >= lastMinute);
  const errors1m = recentErrors.filter((e) => e.at >= lastMinute);
  const slowRequests = recentRequests
    .filter((r) => r.latencyMs >= 1000)
    .slice(-20)
    .map((r) => ({
      method: r.method,
      path: r.path,
      statusCode: r.statusCode,
      latencyMs: r.latencyMs,
      at: new Date(r.at).toISOString(),
    }));

  return {
    service: process.env.SERVICE_NAME || 'aph-api',
    startedAt: new Date(startedAt).toISOString(),
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    shutdownStartedAt,
    http: {
      activeRequests,
      totalRequests,
      averageLatencyMs: totalRequests ? Math.round(totalLatencyMs / totalRequests) : 0,
      requestsPerMinute: requests1m.length,
      errorsPerMinute: errors1m.length,
      errorRate1m: requests1m.length ? Number((errors1m.length / requests1m.length).toFixed(4)) : 0,
      statusCounts: Object.fromEntries(statusCounts),
      methodCounts: Object.fromEntries(methodCounts),
      errorCounts: Object.fromEntries(errorCounts),
      slowRequests,
    },
    dependencies: Object.fromEntries(dependencies),
    alertSignals: {
      highErrorRate: requests1m.length >= 20 && errors1m.length / requests1m.length >= 0.05,
      activeRequestPressure: activeRequests >= 50,
      slowRequestSeen: slowRequests.length > 0,
    },
  };
}

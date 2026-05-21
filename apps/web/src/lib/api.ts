/**
 * Browser: same-origin `/api` proxy (next.config rewrites → Express).
 * Server: direct API URL for SSR if needed later.
 */
function isPublicReadPath(path: string): boolean {
  return (
    path.startsWith('/health') ||
    path.startsWith('/v1/products') ||
    path.startsWith('/v1/categories') ||
    path.startsWith('/v1/content') ||
    path.startsWith('/v1/reviews')
  );
}

function getApiBase(path: string): string {
  if (typeof window !== 'undefined') {
    const publicApiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (publicApiUrl && isPublicReadPath(path)) return publicApiUrl;
    return '/api';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
}

let apiProbe: Promise<boolean> | null = null;
let apiOfflineUntil = 0;

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const entry = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null;
}

async function ensureCsrfCookie(): Promise<string | null> {
  const existing = readCookie('csrfToken');
  if (existing) return existing;

  await fetch('/api/health', {
    credentials: 'include',
    cache: 'no-store',
  }).catch(() => null);

  return readCookie('csrfToken');
}

async function canReachApi(): Promise<boolean> {
  if (typeof window === 'undefined') return true;

  const now = Date.now();
  if (apiOfflineUntil > now) return false;
  if (apiProbe) return apiProbe;

  apiProbe = fetch(`${getApiBase('/health')}/health`, {
    credentials: 'include',
    cache: 'no-store',
  })
    .then((res) => {
      const ok = res.ok;
      if (!ok) apiOfflineUntil = Date.now() + 10_000;
      return ok;
    })
    .catch(() => {
      apiOfflineUntil = Date.now() + 10_000;
      return false;
    })
    .finally(() => {
      apiProbe = null;
    });

  return apiProbe;
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${getApiBase(normalizedPath)}${normalizedPath}`;

  try {
    if (!path.startsWith('/health') && !(await canReachApi())) {
      return {
        success: false,
        error: 'API unavailable. Start the backend after configuring a PostgreSQL DATABASE_URL.',
      };
    }

    const method = (options.method ?? 'GET').toUpperCase();
    const csrfToken = ['GET', 'HEAD', 'OPTIONS'].includes(method) ? null : await ensureCsrfCookie();

    const res = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        ...options.headers,
      },
    });

    const text = await res.text();
    if (!text) {
      return { success: false, error: res.ok ? 'Empty response' : `HTTP ${res.status}` };
    }

    try {
      const parsed = JSON.parse(text) as { success: boolean; data?: T; error?: string };
      if (!res.ok && parsed.error?.includes('Cannot reach API')) {
        apiOfflineUntil = Date.now() + 10_000;
      }
      if (!res.ok && !parsed.error) {
        return { success: false, error: `API returned HTTP ${res.status}` };
      }
      return parsed;
    } catch {
      return {
        success: false,
        error: `API returned HTTP ${res.status} with ${res.headers.get('content-type') || 'unknown content'}`,
      };
    }
  } catch (err) {
    const message =
      err instanceof TypeError && err.message === 'Failed to fetch'
        ? 'Cannot reach API. Run: npm run dev (and ensure PostgreSQL is up).'
        : err instanceof Error
          ? err.message
          : 'Network error';
    return { success: false, error: message };
  }
}

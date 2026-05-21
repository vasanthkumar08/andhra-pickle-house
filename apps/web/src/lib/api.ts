function getApiBase(): string {
  if (typeof window !== 'undefined') {
    return '/api';
  }
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
}

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

async function refreshSession(): Promise<boolean> {
  const csrfToken = await ensureCsrfCookie();
  const res = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
    },
    body: '{}',
  }).catch(() => null);

  return Boolean(res?.ok);
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  retryOnUnauthorized = true
): Promise<{ success: boolean; data?: T; error?: string }> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${getApiBase()}${normalizedPath}`;

  try {
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

    if (res.status === 401 && retryOnUnauthorized && !normalizedPath.startsWith('/v1/auth/')) {
      const refreshed = await refreshSession();
      if (refreshed) return api<T>(normalizedPath, options, false);
    }

    const text = await res.text();
    if (!text) {
      return { success: false, error: res.ok ? 'Empty response' : `HTTP ${res.status}` };
    }

    try {
      const parsed = JSON.parse(text) as { success: boolean; data?: T; error?: string };
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

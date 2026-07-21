import { TOKEN_KEY } from '../auth/AuthContext';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  // Get token from localStorage
  const token = localStorage.getItem(TOKEN_KEY);

  // Set headers
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Fetch
  const res = await fetch(`/api${path}`, { ...options, headers });
  const body = (await res.json().catch(() => null)) as { message?: string } | null;

  // If unauthorized, logout and redirect to login
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = '/login';
  }

  // If not ok, throw error
  if (!res.ok) throw new ApiError(res.status, body?.message ?? res.statusText);

  // Return body
  return body as T;
}
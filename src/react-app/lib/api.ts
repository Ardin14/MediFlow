export type ApiResponse<T> = T | { error?: string };

export async function apiFetch<T = any>(input: string, init?: RequestInit): Promise<T> {
  const finalInit: RequestInit = {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  };

  const res = await fetch(input, finalInit);

  // If unauthorized, redirect to home/login
  if (res.status === 401) {
    try {
      // try to clear any client-side state then redirect
      window.location.href = '/';
    } catch (e) {
      /* ignore */
    }
    throw new Error('Unauthorized');
  }

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    throw new Error('Invalid JSON response');
  }

  if (!res.ok) {
    const message = data?.error || data?.message || `HTTP ${res.status}`;
    const error = new Error(message);
    (error as any).status = res.status;
    throw error;
  }

  return data as T;
}

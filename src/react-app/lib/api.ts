export type ApiResponse<T> = T | { error?: string };

import { supabase } from './supabaseClient';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';

export async function apiFetch<T = any>(input: string, init?: RequestInit): Promise<T> {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  const finalInit: RequestInit = {
    credentials: 'include',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    },
    ...init,
  };

  const url = API_BASE ? `${API_BASE}${input}` : input;
  const res = await fetch(url, finalInit);

  // If unauthorized, redirect to home/login
  if (res.status === 401) {
    try {
      // try to clear any client-side state then redirect
      window.location.href = '/';
    } catch {
      /* ignore */
    }
    throw new Error('Unauthorized');
  }

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (parseError) {
    console.error('Failed to parse JSON response:', text);
    throw new Error(`Invalid JSON response: ${text.substring(0, 200)}`);
  }

  if (!res.ok) {
    const message = data?.error || data?.message || `HTTP ${res.status}`;
    const error = new Error(message);
    (error as any).status = res.status;
    throw error;
  }

  return data as T;
}

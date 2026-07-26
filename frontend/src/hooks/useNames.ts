import { useCallback } from 'react';
import { apiFetch } from '../lib/api';

export type NameEntry = {
  id: string;
  value: string | null;
  charset: string;
  audio_key: string | null;
  audio_url: string | null;
  context: {
    name: string;
    description: string | null;
  };
  user?: {
    email: string;
  };
};

export type HistoryEntry = NameEntry & {
  created_at: string;
  deleted_at: string;
};

export type HistoryPage = {
  data: HistoryEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type Context = {
  name: string;
  key: string;
  description: string | null;
};

// Cache contexts for re-use
let contextsPromise: Promise<Context[]> | null = null;

export function useNames() {
  const fetchCurrentNames = useCallback(
    () => apiFetch<NameEntry[]>('/me/name'),
    [],
  );

  const fetchHistory = useCallback(
    () => apiFetch<HistoryPage>('/me/name/history'),
    [],
  );

  const fetchContexts = useCallback(() => {
    if (!contextsPromise) {
      contextsPromise = apiFetch<Context[]>('/contexts').catch((err) => {
        contextsPromise = null;
        throw err;
      });
    }
    return contextsPromise;
  }, []);

  return { fetchCurrentNames, fetchHistory, fetchContexts };
}

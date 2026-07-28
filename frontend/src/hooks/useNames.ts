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

export type CreateNamePayload = {
  context: string;
  charset: string;
  value?: string;
  audioFile?: File | null;
};

export type UpdateNamePayload = {
  context?: string;
  charset?: string;
  value?: string;
  audioFile?: File | null;
  removeAudio?: boolean;
};

export function useNames() {
  const fetchCurrentNames = useCallback(
    () => apiFetch<NameEntry[]>('/me/name'),
    [],
  );

  const fetchHistory = useCallback(
    () => apiFetch<HistoryPage>('/me/name/history'),
    [],
  );

  const fetchContexts = useCallback(() => apiFetch<Context[]>('/contexts'), []);

  const fetchUserNamesById = useCallback(
    (userId: string) => apiFetch<NameEntry[]>(`/user/${userId}/name`),
    [],
  );

  const uploadAudio = useCallback((nameId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);

    return apiFetch<NameEntry>(`/me/name/${nameId}/audio`, {
      method: 'POST',
      body: form,
    });
  }, []);

  const deleteAudio = useCallback((nameId: string) => {
    return apiFetch<NameEntry>(`/me/name/${nameId}/audio`, {
      method: 'DELETE',
    });
  }, []);

  const createName = useCallback(
    async ({
      context,
      charset,
      value,
      audioFile,
    }: CreateNamePayload): Promise<NameEntry> => {
      const created = await apiFetch<NameEntry>('/me/name', {
        method: 'POST',
        body: JSON.stringify({ context, charset, value }),
      });

      if (audioFile) return uploadAudio(created.id, audioFile);
      return created;
    },
    [uploadAudio],
  );

  const updateName = useCallback(
    async (
      id: string,
      { context, charset, value, audioFile, removeAudio }: UpdateNamePayload,
    ): Promise<NameEntry> => {
      const updated = await apiFetch<NameEntry>(`/me/name/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ context, charset, value }),
      });

      // A new file replaces existing audio
      if (audioFile) return uploadAudio(updated.id, audioFile);
      if (removeAudio) return deleteAudio(updated.id);
      return updated;
    },
    [uploadAudio, deleteAudio],
  );

  return {
    fetchCurrentNames,
    fetchHistory,
    fetchContexts,
    fetchUserNamesById,
    createName,
    updateName,
  };
}

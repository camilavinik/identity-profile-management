import type { Context, HistoryEntry, HistoryPage, NameEntry } from '../hooks';

export const testContexts: Context[] = [
  { key: 'legal', name: 'Legal', description: null },
  { key: 'religious', name: 'Religious', description: null },
];

export const testName: NameEntry = {
  id: '1',
  value: 'test',
  charset: 'latin',
  audio_key: null,
  audio_url: null,
  context: { name: 'Legal', description: null },
};

export const testHistoryEntry: HistoryEntry = {
  ...testName,
  value: 'Old Name',
  created_at: '2026-01-15T00:00:00.000Z',
  deleted_at: '2026-06-20T00:00:00.000Z',
};

export const testHistoryPage: HistoryPage = {
  data: [testHistoryEntry],
  total: 1,
  page: 1,
  limit: 50,
  totalPages: 1,
};

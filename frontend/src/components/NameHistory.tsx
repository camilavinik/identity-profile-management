import { useEffect, useState } from 'react';
import {
  useContextFilter,
  useNames,
  type HistoryEntry,
  type HistoryPage,
} from '../hooks';
import { ContextCharsetBadge } from './ContextCharsetBadge';
import { ContextFilter } from './ContextFilter';
import { EmptyStateAlert } from './EmptyStateAlert';
import { ErrorAlert } from './ErrorAlert';
import { AudioPlayer } from './AudioPlayer';

export function NameHistory() {
  const { fetchHistory } = useNames();
  const [history, setHistory] = useState<HistoryPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory()
      .then(setHistory)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [fetchHistory]);

  const entries = history?.data ?? [];
  const [filteredEntries, filterProps] = useContextFilter(entries);

  return (
    <div className="card bg-base-100 shadow-xs">
      <div className="card-body gap-0">
        <h3 className="card-title">History</h3>

        {/* Filters */}
        <div className="mt-2">
          <ContextFilter {...filterProps} size="xs" />
        </div>

        {/* Loading skeleton */}
        {loading && (
          <ul className="list">
            <NameHistoryEntry entry={{} as HistoryEntry} skeleton />
            <NameHistoryEntry entry={{} as HistoryEntry} skeleton />
            <NameHistoryEntry entry={{} as HistoryEntry} skeleton />
            <NameHistoryEntry entry={{} as HistoryEntry} skeleton />
          </ul>
        )}

        {/* Error alert*/}
        {error && <ErrorAlert content={error} />}

        {/* Empty state: no entries at all */}
        {!loading && !error && entries.length === 0 && (
          <EmptyStateAlert content="No previous names yet" />
        )}

        {/* Empty state: filtered out */}
        {!loading &&
          !error &&
          entries.length > 0 &&
          filteredEntries.length === 0 && (
            <EmptyStateAlert content="No names match the selected filters" />
          )}

        {/* Names list */}
        {!loading && !error && filteredEntries.length > 0 && (
          <ul className="list">
            {filteredEntries.map((entry) => (
              <NameHistoryEntry key={entry.id} entry={entry} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function NameHistoryEntry({
  entry,
  skeleton,
}: {
  entry: HistoryEntry;
  skeleton?: boolean;
}) {
  if (skeleton) {
    return (
      <li className="list-row px-0 flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <div className="skeleton h-4 w-12" />
          <div className="skeleton h-4 w-12" />
        </div>
        <div className="skeleton h-4 w-48" />
        <div className="skeleton h-4 w-54" />
      </li>
    );
  }

  return (
    <li className="list-row px-0 flex flex-col gap-1">
      {/* Context and charset */}
      <div className="flex items-center gap-1">
        <ContextCharsetBadge
          context={entry.context.name}
          variant="soft"
          size="xs"
        >
          {entry.context.name.toUpperCase()}
        </ContextCharsetBadge>
        <ContextCharsetBadge
          context={entry.context.name}
          variant="dash"
          size="xs"
        >
          {entry.charset.toUpperCase()}
        </ContextCharsetBadge>
      </div>

      {/* Value */}
      <div className="flex items-center justify-between gap-2">
        {entry.value ? (
          <p className="text-sm">{entry.value}</p>
        ) : (
          <p className="text-gray-500 italic">No value</p>
        )}
        <AudioPlayer audioUrl={entry.audio_url} size="xs" />
      </div>

      {/* Active period */}
      <div className="text-xs text-gray-500">
        Active from {new Date(entry.created_at).toLocaleDateString()} to{' '}
        {new Date(entry.deleted_at).toLocaleDateString()}
      </div>
    </li>
  );
}

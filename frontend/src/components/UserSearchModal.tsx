import { useEffect, useState } from 'react';
import {
  useContextFilter,
  useNames,
  type Context,
  type NameEntry,
} from '../hooks';
import { ContextFilter } from './ContextFilter';
import { EmptyStateAlert } from './EmptyStateAlert';
import { ErrorAlert } from './ErrorAlert';
import { Modal } from './Modal';
import { NameCard } from './NameCard';

export function UserSearchModal({
  open,
  onClose,
  userId,
  contexts,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  contexts: Context[];
}) {
  const { fetchUserNamesById } = useNames();
  const [names, setNames] = useState<NameEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filteredNames, filterProps] = useContextFilter(names ?? [], contexts);

  useEffect(() => {
    if (open && userId) {
      setLoading(true);
      setError(null);
      setNames(null);

      fetchUserNamesById(userId)
        .then(setNames)
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [open, userId, fetchUserNamesById]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <>
          Find user{' '}
          <span className="text-sm font-normal text-gray-500 break-all">
            ({userId})
          </span>
        </>
      }
    >
      <div className="flex flex-col gap-3 mt-4">
        {/* Filters */}
        {!loading && !error && names && names.length > 0 && (
          <ContextFilter {...filterProps} size="xs" />
        )}

        {/* Loading Skeletons */}
        {loading && (
          <>
            <NameCard name={{} as NameEntry} skeleton size="sm" />
            <NameCard name={{} as NameEntry} skeleton size="sm" />
            <NameCard name={{} as NameEntry} skeleton size="sm" />
          </>
        )}

        {/* Error State */}
        {error && <ErrorAlert content={error} />}

        {/* Empty State */}
        {!loading && !error && names && names.length === 0 && (
          <EmptyStateAlert content="This user has no names yet" />
        )}

        {/* No names match the selected filters */}
        {!loading &&
          !error &&
          names &&
          names.length > 0 &&
          filteredNames.length === 0 && (
            <EmptyStateAlert content="No names match the selected filters" />
          )}

        {/* Filtered Names */}
        {!loading && !error && filteredNames.length > 0 && (
          <ul className="flex flex-col gap-3">
            {filteredNames.map((n) => (
              <li key={n.id}>
                <NameCard name={n} size="sm" border />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

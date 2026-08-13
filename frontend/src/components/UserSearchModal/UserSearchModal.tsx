import { useEffect, useState } from 'react';
import {
  useContextFilter,
  useNames,
  type Context,
  type NameEntry,
} from '../../hooks';
import { ContextFilter } from '../ContextFilter/ContextFilter';
import { EmptyStateAlert } from '../EmptyStateAlert/EmptyStateAlert';
import { ErrorAlert } from '../ErrorAlert/ErrorAlert';
import { Modal } from '../Modal/Modal';
import { NameCard } from '../NameCard/NameCard';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

function isEmail(value: string) {
  return EMAIL_PATTERN.test(value);
}

export function UserSearchModal({
  open,
  onClose,
  searched,
  contexts,
}: {
  open: boolean;
  onClose: () => void;
  searched: string;
  contexts: Context[];
}) {
  const { fetchUserNamesById, fetchUserNamesByEmail } = useNames();
  const emailSearch = isEmail(searched);
  const valid = emailSearch || isUuid(searched);
  const validationError = valid
    ? null
    : 'Enter a valid user id (UUID) or email address';

  const [names, setNames] = useState<NameEntry[] | null>(null);
  const [loading, setLoading] = useState(valid);
  const [error, setError] = useState<string | null>(null);
  const [filteredNames, filterProps] = useContextFilter(names ?? [], contexts);
  const displayError = validationError ?? error;

  useEffect(() => {
    if (!valid) return;

    const fetchNames = emailSearch
      ? fetchUserNamesByEmail(searched)
      : fetchUserNamesById(searched);

    fetchNames
      .then(setNames)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [searched, valid, emailSearch, fetchUserNamesById, fetchUserNamesByEmail]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <>
          Find user{' '}
          <span className="text-sm font-normal text-gray-500 break-all">
            ({emailSearch ? searched.toLowerCase() : searched})
          </span>
        </>
      }
    >
      <div className="flex flex-col gap-3 mt-4">
        {/* Filters */}
        {!loading && !displayError && names && names.length > 0 && (
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
        {displayError && <ErrorAlert content={displayError} />}

        {/* Empty State */}
        {!loading && !displayError && names && names.length === 0 && (
          <EmptyStateAlert content="This user has no names yet" />
        )}

        {/* No names match the selected filters */}
        {!loading &&
          !displayError &&
          names &&
          names.length > 0 &&
          filteredNames.length === 0 && (
            <EmptyStateAlert content="No names match the selected filters" />
          )}

        {/* Filtered Names */}
        {!loading && !displayError && filteredNames.length > 0 && (
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

import { useEffect, useState } from 'react';
import { useContextFilter, useNames, type NameEntry } from '../hooks';
import { PlusIcon } from '../icons';
import { ContextCharsetBadge } from './ContextCharsetBadge';
import { ContextFilter } from './ContextFilter';
import { EmptyStateAlert } from './EmptyStateAlert';
import { ErrorAlert } from './ErrorAlert';

function NameCard({
  name,
  skeleton = false,
}: {
  name: NameEntry;
  skeleton?: boolean;
}) {
  if (skeleton) {
    return <div className="skeleton w-full h-26" />;
  }

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="flex items-center gap-2">
          <ContextCharsetBadge context={name.context.name} variant="soft">
            {name.context.name.toUpperCase()}
          </ContextCharsetBadge>
          <ContextCharsetBadge context={name.context.name} variant="dash">
            {name.charset.toUpperCase()}
          </ContextCharsetBadge>
        </div>
        {name.value ? (
          <p className="text-lg">{name.value}</p>
        ) : (
          <p className="text-gray-500 italic">No value</p>
        )}
      </div>
    </div>
  );
}

export function MyNames() {
  const { fetchCurrentNames } = useNames();
  const [names, setNames] = useState<NameEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentNames()
      .then(setNames)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [fetchCurrentNames]);

  const [filteredNames, filterProps] = useContextFilter(names);

  return (
    <div>
      {/* Title and Add Name Button*/}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My names</h2>
        <button className="btn btn-neutral btn-sm">
          <PlusIcon /> Add Name
        </button>
      </div>

      {/* Filters */}
      <div className="mt-4">
        <ContextFilter {...filterProps} size="sm" />
      </div>

      {/* Names List */}
      <div className="flex flex-col gap-3 mt-4">
        {/* Loading skeleton */}
        {loading && (
          <>
            <NameCard name={{} as NameEntry} skeleton />
            <NameCard name={{} as NameEntry} skeleton />
            <NameCard name={{} as NameEntry} skeleton />
          </>
        )}

        {/* Error alert*/}
        {error && <ErrorAlert content={error} />}

        {/* Empty state: no names at all */}
        {!loading && !error && names.length === 0 && (
          <EmptyStateAlert content="No names added yet" />
        )}

        {/* Empty state: filtered out */}
        {!loading &&
          !error &&
          names.length > 0 &&
          filteredNames.length === 0 && (
            <EmptyStateAlert content="No names match the selected filters" />
          )}

        {/* Names list */}
        {!loading && !error && filteredNames.length > 0 && (
          <ul className="flex flex-col gap-3">
            {filteredNames.map((name) => (
              <li key={name.id}>
                <NameCard name={name} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

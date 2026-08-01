import { Plus } from 'lucide-react';
import { useState } from 'react';
import {
  useContextFilter,
  useNames,
  type Context,
  type NameEntry,
} from '../../hooks';
import { ContextFilter } from '../ContextFilter/ContextFilter';
import { CopyUserId } from '../CopyUserId/CopyUserId';
import { EmptyStateAlert } from '../EmptyStateAlert/EmptyStateAlert';
import { ErrorAlert } from '../ErrorAlert/ErrorAlert';
import { NameCard } from '../NameCard/NameCard';
import {
  NameFormModal,
  type NameFormData,
} from '../NameFormModal/NameFormModal';

function getEditInitialValues(
  name: NameEntry,
  contexts: Context[],
): Partial<NameFormData> {
  const contextKey =
    contexts.find((c) => c.name === name.context.name)?.key ?? '';
  return {
    context: contextKey,
    charset: name.charset,
    value: name.value ?? '',
  };
}

export function MyNames({
  names,
  contexts,
  loading,
  error,
  refresh,
}: {
  names: NameEntry[];
  contexts: Context[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}) {
  const { createName, updateName } = useNames();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<NameEntry | null>(null);
  const [filteredNames, filterProps] = useContextFilter(names, contexts);

  const handleAddName = async (data: NameFormData) => {
    await createName({
      context: data.context,
      charset: data.charset,
      value: data.value.trim() || undefined,
      audioFile: data.audioFile,
    });
    refresh();
  };

  const handleEditName = async (data: NameFormData) => {
    await updateName(editing!.id, {
      context: data.context,
      charset: data.charset,
      value: data.value.trim(),
      audioFile: data.audioFile,
      removeAudio: data.removeAudio,
    });
    refresh();
  };

  return (
    <div>
      {/* Title and Add Name Button*/}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h2 className="text-2xl font-bold">My names</h2>
          <CopyUserId />
        </div>
        <button
          type="button"
          className="btn btn-neutral btn-sm shadow-xs"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="size-4" /> Add Name
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
                <NameCard name={name} onEdit={() => setEditing(name)} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add name modal */}
      <NameFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAddName}
        contexts={contexts}
      />

      {/* Edit name modal */}
      {editing && (
        <NameFormModal
          open
          onClose={() => setEditing(null)}
          onSubmit={handleEditName}
          contexts={contexts}
          initialValues={getEditInitialValues(editing, contexts)}
          currentAudioUrl={editing.audio_url}
          title="Edit name"
          submitLabel="Save"
        />
      )}
    </div>
  );
}

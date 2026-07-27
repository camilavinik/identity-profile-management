import { Plus } from 'lucide-react';
import { useState } from 'react';
import {
  useContextFilter,
  useNames,
  type Context,
  type NameEntry,
} from '../hooks';
import { ContextCharsetBadge } from './ContextCharsetBadge';
import { ContextFilter } from './ContextFilter';
import { EmptyStateAlert } from './EmptyStateAlert';
import { ErrorAlert } from './ErrorAlert';
import { AudioPlayer } from './AudioPlayer';
import { NameFormModal, type NameFormData } from './NameFormModal';
import { Options } from './Options';

function NameCard({
  name,
  skeleton = false,
  onEdit,
}: {
  name: NameEntry;
  skeleton?: boolean;
  onEdit?: () => void;
}) {
  if (skeleton) {
    return <div className="skeleton w-full h-26" />;
  }

  return (
    <div className="card bg-base-100 shadow-xs">
      <div className="card-body">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ContextCharsetBadge context={name.context.name} variant="soft">
              {name.context.name.toUpperCase()}
            </ContextCharsetBadge>
            <ContextCharsetBadge context={name.context.name} variant="dash">
              {name.charset.toUpperCase()}
            </ContextCharsetBadge>
          </div>

          <Options menuClassName="w-32">
            <li>
              <button type="button" onClick={onEdit}>
                Edit
              </button>
            </li>
          </Options>
        </div>

        <div className="w-full flex items-center justify-between gap-2">
          {name.value ? (
            <p className="text-lg">{name.value}</p>
          ) : (
            <p className="text-gray-500 italic">No value</p>
          )}
          <AudioPlayer audioUrl={name.audio_url} size="sm" />
        </div>
      </div>
    </div>
  );
}

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
    if (editing) {
      await updateName(editing.id, {
        context: data.context,
        charset: data.charset,
        value: data.value.trim(),
        audioFile: data.audioFile,
        removeAudio: data.removeAudio,
      });
      refresh();
    }
  };

  return (
    <div>
      {/* Title and Add Name Button*/}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My names</h2>
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

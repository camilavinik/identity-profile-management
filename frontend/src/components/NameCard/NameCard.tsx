import type { NameEntry } from '../../hooks';
import { AudioPlayer } from '../AudioPlayer/AudioPlayer';
import { ContextCharsetBadge } from '../ContextCharsetBadge/ContextCharsetBadge';
import { Options } from '../Options/Options';
import { Pencil, Trash2 } from 'lucide-react';

export function NameCard({
  name,
  skeleton = false,
  onEdit,
  onDelete,
  size = 'md',
  border = false,
}: {
  name: NameEntry;
  skeleton?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  size?: 'sm' | 'md';
  border?: boolean;
}) {
  const small = size === 'sm';
  const showOptions = onEdit || onDelete;

  if (skeleton) {
    return <div className={`skeleton w-full ${small ? 'h-20' : 'h-26'}`} />;
  }

  return (
    <div
      className={`card bg-base-100 shadow-xs ${border ? 'border border-base-300' : ''}`}
    >
      <div className="card-body">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ContextCharsetBadge
              context={name.context.name}
              variant="soft"
              size={small ? 'xs' : 'sm'}
            >
              {name.context.name.toUpperCase()}
            </ContextCharsetBadge>
            <ContextCharsetBadge
              context={name.context.name}
              variant="dash"
              size={small ? 'xs' : 'sm'}
            >
              {name.charset.toUpperCase()}
            </ContextCharsetBadge>
          </div>

          {showOptions && (
            <Options menuClassName="w-32">
              {onEdit && (
                <li>
                  <button type="button" onClick={onEdit}>
                    <Pencil className="size-4" />
                    Edit
                  </button>
                </li>
              )}
              {onDelete && (
                <li>
                  <button
                    type="button"
                    className="text-error hover:bg-error/10 hover:text-error"
                    onClick={onDelete}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </button>
                </li>
              )}
            </Options>
          )}
        </div>

        <div className="w-full flex items-center justify-between gap-2">
          {name.value ? (
            <p className={small ? 'text-sm' : 'text-lg'}>{name.value}</p>
          ) : (
            <p className="text-gray-500 italic">No value</p>
          )}
          <AudioPlayer audioUrl={name.audio_url} size={small ? 'xs' : 'sm'} />
        </div>
      </div>
    </div>
  );
}

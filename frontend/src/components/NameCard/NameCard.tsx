import type { NameEntry } from '../../hooks';
import { AudioPlayer } from '../AudioPlayer/AudioPlayer';
import { ContextCharsetBadge } from '../ContextCharsetBadge/ContextCharsetBadge';
import { Options } from '../Options/Options';
import { Pencil } from 'lucide-react';

export function NameCard({
  name,
  skeleton = false,
  onEdit,
  size = 'md',
  border = false,
}: {
  name: NameEntry;
  skeleton?: boolean;
  onEdit?: () => void;
  size?: 'sm' | 'md';
  border?: boolean;
}) {
  const small = size === 'sm';

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

          {onEdit && (
            <Options menuClassName="w-32">
              <li>
                <button type="button" onClick={onEdit}>
                  <Pencil className="size-4" />
                  Edit
                </button>
              </li>
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

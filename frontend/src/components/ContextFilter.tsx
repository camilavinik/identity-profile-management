import type { Context } from '../hooks';
import { ContextCharsetBadge } from './ContextCharsetBadge';

export function ContextFilter({
  contexts,
  selectedContexts,
  onToggle,
  onClear,
  size = 'sm',
}: {
  contexts: Context[];
  selectedContexts: Set<string>;
  onToggle: (context: string) => void;
  onClear: () => void;
  size?: 'xs' | 'sm';
}) {
  if (contexts.length === 0) return null;

  const gapClass = size === 'xs' ? 'gap-1' : 'gap-2';
  const allSelected = selectedContexts.size === 0;

  return (
    <div className={`flex flex-wrap items-center ${gapClass}`}>
      <ContextCharsetBadge
        context=""
        variant={allSelected ? 'solid' : 'soft'}
        muted
        size={size}
        onClick={onClear}
      >
        ALL
      </ContextCharsetBadge>

      <div className="divider divider-horizontal mx-0" />

      {contexts.map((ctx) => (
        <ContextCharsetBadge
          key={ctx.key}
          context={ctx.name}
          variant={selectedContexts.has(ctx.name) ? 'solid' : 'soft'}
          muted={!selectedContexts.has(ctx.name)}
          size={size}
          onClick={() => onToggle(ctx.name)}
        >
          {ctx.name.toUpperCase()}
        </ContextCharsetBadge>
      ))}
    </div>
  );
}

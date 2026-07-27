import { useState } from 'react';
import type { Context } from './useNames';

export type ContextFilterProps = {
  contexts: Context[];
  selectedContexts: Set<string>;
  onToggle: (context: string) => void;
  onClear: () => void;
};

export function useContextFilter<T extends { context: { name: string } }>(
  items: T[],
  contexts: Context[],
): [T[], ContextFilterProps] {
  const [selectedContexts, setSelectedContexts] = useState<Set<string>>(
    new Set(),
  );

  const onToggle = (context: string) => {
    setSelectedContexts((prev) => {
      const next = new Set(prev);
      if (next.has(context)) next.delete(context);
      else next.add(context);
      return next;
    });
  };

  const onClear = () => setSelectedContexts(new Set());

  const filtered =
    selectedContexts.size === 0
      ? items
      : items.filter((item) => selectedContexts.has(item.context.name));

  return [filtered, { contexts, selectedContexts, onToggle, onClear }];
}

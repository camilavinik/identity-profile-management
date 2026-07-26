import { useEffect, useState } from 'react';
import { useNames } from './useNames';
import type { Context } from './useNames';

export type ContextFilterProps = {
  contexts: Context[];
  selectedContexts: Set<string>;
  onToggle: (context: string) => void;
  onClear: () => void;
};

export function useContextFilter<T extends { context: { name: string } }>(
  items: T[],
): [T[], ContextFilterProps] {
  const { fetchContexts } = useNames();
  const [contexts, setContexts] = useState<Context[]>([]);
  const [selectedContexts, setSelectedContexts] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    fetchContexts()
      .then(setContexts)
      .catch(() => {
        // Filters just won't show if this fails
      });
  }, [fetchContexts]);

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

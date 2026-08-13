import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { testContexts, testName } from '../test/fixtures';
import { useContextFilter } from './useContextFilter';

const items = [
  testName,
  {
    ...testName,
    id: '2',
    context: { name: 'Religious', description: null },
  },
];

describe('useContextFilter', () => {
  it('returns all items when no context is selected', () => {
    const { result } = renderHook(() => useContextFilter(items, testContexts));

    expect(result.current[0]).toEqual(items);
    expect(result.current[1].selectedContexts.size).toBe(0);
  });

  it('filters items when a context is toggled on', () => {
    const { result } = renderHook(() => useContextFilter(items, testContexts));

    act(() => {
      result.current[1].onToggle('Legal');
    });

    expect(result.current[0]).toEqual([testName]);
    expect(result.current[1].selectedContexts.has('Legal')).toBe(true);
  });

  it('removes a context when it is toggled off', () => {
    const { result } = renderHook(() => useContextFilter(items, testContexts));

    act(() => {
      result.current[1].onToggle('Legal');
    });
    act(() => {
      result.current[1].onToggle('Legal');
    });

    expect(result.current[0]).toEqual(items);
    expect(result.current[1].selectedContexts.size).toBe(0);
  });

  it('clears all selected contexts', () => {
    const { result } = renderHook(() => useContextFilter(items, testContexts));

    act(() => {
      result.current[1].onToggle('Legal');
      result.current[1].onToggle('Religious');
    });
    act(() => {
      result.current[1].onClear();
    });

    expect(result.current[0]).toEqual(items);
    expect(result.current[1].selectedContexts.size).toBe(0);
  });
});

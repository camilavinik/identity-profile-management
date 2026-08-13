import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTheme } from './useTheme';

function mockMatchMedia(matches: boolean | undefined) {
  if (matches === undefined) {
    vi.stubGlobal('matchMedia', undefined);
    return;
  }

  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  );
}

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('initialize with a stored light theme', () => {
    localStorage.setItem('theme', 'light');
    const { result } = renderHook(() => useTheme());

    expect(result.current[0]).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('initialize with a stored dark theme', () => {
    localStorage.setItem('theme', 'dark');
    const { result } = renderHook(() => useTheme());

    expect(result.current[0]).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('fall back to system preference when no theme is stored', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useTheme());

    expect(result.current[0]).toBe('dark');
  });

  it('default to light when system prefers light and no theme is stored', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useTheme());

    expect(result.current[0]).toBe('light');
  });

  it('default to light when matchMedia is unavailable', () => {
    mockMatchMedia(undefined);
    const { result } = renderHook(() => useTheme());

    expect(result.current[0]).toBe('light');
  });

  it('toggle between light and dark and persist to localStorage', () => {
    localStorage.setItem('theme', 'light');
    const { result } = renderHook(() => useTheme());

    act(() => result.current[1]());
    expect(result.current[0]).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');

    act(() => result.current[1]());
    expect(result.current[0]).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});

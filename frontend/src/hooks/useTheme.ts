import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme';

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);

  if (stored === 'light' || stored === 'dark') return stored;
  // If no theme is stored, use the system preference
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches)
    return 'dark';

  // Default to light theme
  return 'light';
}

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((oldTheme) => (oldTheme === 'light' ? 'dark' : 'light'));

  return [theme, toggleTheme];
}

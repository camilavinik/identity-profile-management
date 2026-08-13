import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks';

type ThemeToggleSize = 'sm' | 'md';

const buttonSizeClass: Record<ThemeToggleSize, string> = {
  sm: 'btn-sm',
  md: 'btn-md',
};

const iconSizeClass: Record<ThemeToggleSize, string> = {
  sm: 'size-5',
  md: 'size-5.5',
};

export function ThemeToggle({
  size = 'sm',
  className = '',
}: {
  size?: ThemeToggleSize;
  className?: string;
}) {
  const [theme, toggleTheme] = useTheme();
  const Icon = theme === 'light' ? Moon : Sun;

  return (
    <button
      type="button"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      onClick={toggleTheme}
      className={`btn btn-ghost btn-circle ${buttonSizeClass[size]} shadow-none ${className}`}
    >
      <Icon className={iconSizeClass[size]} />
    </button>
  );
}

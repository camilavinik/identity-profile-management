import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('toggles the theme when clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const toDark = screen.getByRole('button', { name: /switch to dark mode/i });
    await user.click(toDark);

    expect(document.documentElement.dataset.theme).toBe('dark');

    await user.click(
      screen.getByRole('button', { name: /switch to light mode/i }),
    );

    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('renders the small size by default', () => {
    const { container } = render(<ThemeToggle />);

    expect(screen.getByRole('button', { name: /switch to/i })).toHaveClass(
      'btn-sm',
    );
    expect(container.querySelector('svg')).toHaveClass('size-5');
  });

  it('renders the medium size when requested', () => {
    const { container } = render(<ThemeToggle size="md" />);

    expect(screen.getByRole('button', { name: /switch to/i })).toHaveClass(
      'btn-md',
    );
    expect(container.querySelector('svg')).toHaveClass('size-5.5');
  });

  it('append an extra className to the button', () => {
    render(<ThemeToggle className="fixed top-4 right-4" />);

    expect(screen.getByRole('button', { name: /switch to/i })).toHaveClass(
      'fixed',
      'top-4',
      'right-4',
    );
  });
});

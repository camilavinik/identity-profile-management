import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ContextCharsetBadge } from './ContextCharsetBadge';

describe('ContextCharsetBadge', () => {
  it('shows the badge content', () => {
    render(<ContextCharsetBadge context="legal">LEGAL</ContextCharsetBadge>);
    expect(screen.getByText('LEGAL')).toBeInTheDocument();
  });

  it('uses the context colour class', () => {
    render(<ContextCharsetBadge context="legal">LEGAL</ContextCharsetBadge>);
    expect(screen.getByText('LEGAL')).toHaveClass('badge-primary');
  });

  it('uses base-300 background when muted with soft variant', () => {
    render(
      <ContextCharsetBadge context="legal" muted>
        LEGAL
      </ContextCharsetBadge>,
    );
    expect(screen.getByText('LEGAL')).toHaveClass('bg-base-300');
  });

  it('uses neutral color when muted with solid variant', () => {
    render(
      <ContextCharsetBadge context="legal" muted variant="solid">
        LEGAL
      </ContextCharsetBadge>,
    );
    expect(screen.getByText('LEGAL')).toHaveClass('badge-neutral');
  });

  it('falls back to neutral for unknown contexts', () => {
    render(
      <ContextCharsetBadge context="unknown">UNKNOWN</ContextCharsetBadge>,
    );
    expect(screen.getByText('UNKNOWN')).toHaveClass('badge-neutral');
  });

  it('renders a button and calls onClick when provided', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <ContextCharsetBadge context="legal" onClick={onClick}>
        LEGAL
      </ContextCharsetBadge>,
    );

    await user.click(screen.getByRole('button', { name: 'LEGAL' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('updates when children change', () => {
    const { rerender } = render(
      <ContextCharsetBadge context="legal">LEGAL</ContextCharsetBadge>,
    );
    expect(screen.getByText('LEGAL')).toBeInTheDocument();

    rerender(
      <ContextCharsetBadge context="legal">UPDATED</ContextCharsetBadge>,
    );
    expect(screen.getByText('UPDATED')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { testContexts } from '../../test/fixtures';
import { ContextFilter } from './ContextFilter';

describe('ContextFilter', () => {
  it('renders nothing when there are no contexts', () => {
    const { container } = render(
      <ContextFilter
        contexts={[]}
        selectedContexts={new Set()}
        onToggle={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows "all" option and each context badge', () => {
    render(
      <ContextFilter
        contexts={testContexts}
        selectedContexts={new Set()}
        onToggle={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'ALL' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'LEGAL' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'RELIGIOUS' }),
    ).toBeInTheDocument();
  });

  it('calls onClear when "all" option is clicked', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();

    render(
      <ContextFilter
        contexts={testContexts}
        selectedContexts={new Set(['Legal'])}
        onToggle={vi.fn()}
        onClear={onClear}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'ALL' }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('calls onToggle with the context name when a badge is clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(
      <ContextFilter
        contexts={testContexts}
        selectedContexts={new Set()}
        onToggle={onToggle}
        onClear={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'LEGAL' }));
    expect(onToggle).toHaveBeenCalledWith('Legal');
  });

  it('uses smaller sizing for size xs', () => {
    const { container } = render(
      <ContextFilter
        contexts={testContexts}
        selectedContexts={new Set()}
        onToggle={vi.fn()}
        onClear={vi.fn()}
        size="xs"
      />,
    );

    expect(container.firstElementChild).toHaveClass('gap-1');
    expect(screen.getByRole('button', { name: 'ALL' })).toHaveClass('badge-xs');
    expect(screen.getByRole('button', { name: 'LEGAL' })).toHaveClass(
      'badge-xs',
    );
  });
});

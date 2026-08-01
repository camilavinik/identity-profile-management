import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyStateAlert } from './EmptyStateAlert';

describe('EmptyStateAlert', () => {
  it('shows the empty state content', () => {
    render(<EmptyStateAlert content="No names added yet" />);
    expect(screen.getByRole('alert')).toHaveTextContent('No names added yet');
  });

  it('renders an empty string without crashing', () => {
    render(<EmptyStateAlert content="" />);
    expect(screen.getByRole('alert')).toHaveTextContent('');
  });

  it('updates when content changes', () => {
    const { rerender } = render(<EmptyStateAlert content="Nothing here" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Nothing here');

    rerender(<EmptyStateAlert content="Still empty" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Still empty');
  });

  it('uses the soft alert styles', () => {
    render(<EmptyStateAlert content="Empty" />);
    expect(screen.getByRole('alert')).toHaveClass('alert', 'alert-soft');
  });
});

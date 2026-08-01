import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ErrorAlert } from './ErrorAlert';

describe('ErrorAlert', () => {
  it('shows the error content', () => {
    render(<ErrorAlert content="Something failed" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Something failed');
  });

  it('renders an empty string without crashing', () => {
    render(<ErrorAlert content="" />);
    expect(screen.getByRole('alert')).toHaveTextContent('');
  });

  it('updates when content changes', () => {
    const { rerender } = render(<ErrorAlert content="First error" />);
    expect(screen.getByRole('alert')).toHaveTextContent('First error');

    rerender(<ErrorAlert content="Second error" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Second error');
  });

  it('uses the error alert styles', () => {
    render(<ErrorAlert content="Oops" />);
    expect(screen.getByRole('alert')).toHaveClass(
      'alert',
      'alert-error',
      'alert-soft',
    );
  });
});

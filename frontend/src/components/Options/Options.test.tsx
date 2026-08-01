import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Options } from './Options';

describe('Options', () => {
  it('renders the menu trigger button', () => {
    const { container } = render(
      <Options>
        <li>
          <button type="button">Option 1</button>
        </li>
      </Options>,
    );

    expect(container.querySelector('.btn-circle')).toBeInTheDocument();
  });

  it('shows menu children', () => {
    render(
      <Options>
        <li>
          <button type="button">Option 2</button>
        </li>
      </Options>,
    );

    expect(
      screen.getByRole('button', { name: 'Option 2' }),
    ).toBeInTheDocument();
  });

  it('applies a custom menu class name', () => {
    const { container } = render(
      <Options menuClassName="w-32">
        <li>
          <button type="button">Option 3</button>
        </li>
      </Options>,
    );

    expect(container.querySelector('.dropdown-content')).toHaveClass('w-32');
  });

  it('closes the menu by blurring focus when an option is clicked', () => {
    const blur = vi.fn();
    const { container } = render(
      <Options>
        <li>
          <button type="button">Option 4</button>
        </li>
      </Options>,
    );

    // Options closes the daisyUI dropdown by blurring whatever is focused
    Object.defineProperty(document, 'activeElement', {
      configurable: true,
      get: () => {
        const el = document.createElement('button');
        el.blur = blur;
        return el;
      },
    });

    fireEvent.click(container.querySelector('.dropdown-content')!);
    expect(blur).toHaveBeenCalledOnce();
  });

  it('skips blur when nothing is focused', () => {
    const { container } = render(
      <Options>
        <li>
          <button type="button">Option 5</button>
        </li>
      </Options>,
    );

    Object.defineProperty(document, 'activeElement', {
      configurable: true,
      get: () => null,
    });

    expect(() =>
      fireEvent.click(container.querySelector('.dropdown-content')!),
    ).not.toThrow();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockShowModal } from '../../test/mocks';
import { HowItWorksModal } from './HowItWorksModal';

describe('HowItWorksModal', () => {
  beforeEach(() => {
    mockShowModal();
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <HowItWorksModal open={false} onClose={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the title and explanation when open', () => {
    render(<HowItWorksModal open onClose={vi.fn()} />);

    expect(screen.getByText('How it works')).toBeInTheDocument();
    expect(screen.getByText('How we store names')).toBeInTheDocument();
    expect(screen.getByText('Get started')).toBeInTheDocument();
    expect(
      screen.getByText('Store the names you use in different situations.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Each name has a context for where it is used/),
    ).toBeInTheDocument();
    expect(screen.getByText('Add your first name with')).toBeInTheDocument();
  });

  it('calls onClose when Got it is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<HowItWorksModal open onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Got it' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});

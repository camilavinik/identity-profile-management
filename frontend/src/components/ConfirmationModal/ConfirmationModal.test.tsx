import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockShowModal } from '../../test/mocks';
import { ConfirmationModal } from './ConfirmationModal';

describe('ConfirmationModal', () => {
  beforeEach(() => {
    mockShowModal();
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <ConfirmationModal
        open={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete name"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows title, message and actions when open', () => {
    render(
      <ConfirmationModal
        open
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete name"
        confirmLabel="Delete"
      >
        Are you sure?
      </ConfirmationModal>,
    );

    expect(screen.getByText('Delete name')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <ConfirmationModal
        open
        onClose={onClose}
        onConfirm={vi.fn()}
        title="Delete name"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onConfirm when Confirm is clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <ConfirmationModal
        open
        onClose={vi.fn()}
        onConfirm={onConfirm}
        title="Delete name"
        confirmLabel="Delete"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});

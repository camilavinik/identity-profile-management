import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockShowModal } from '../../test/mocks';
import { Modal } from './Modal';

describe('Modal', () => {
  beforeEach(() => {
    // Mock the showModal method to open the modal
    mockShowModal();
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <Modal open={false} onClose={vi.fn()} title="Title">
        Body
      </Modal>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the title and children when open', () => {
    render(
      <Modal open onClose={vi.fn()} title="Modal Test Title">
        <p>Modal body</p>
      </Modal>,
    );

    expect(screen.getByText('Modal Test Title')).toBeInTheDocument();
    expect(screen.getByText('Modal body')).toBeInTheDocument();
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
  });

  it('calls onClose when the dialog close event fires', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Title">
        Body
      </Modal>,
    );

    screen
      .getByRole('dialog', { hidden: true })
      .dispatchEvent(new Event('close', { bubbles: true }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when the X button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Title">
        Body
      </Modal>,
    );

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not use a backdrop form to close', () => {
    const { container } = render(
      <Modal open onClose={vi.fn()} title="Title">
        Body
      </Modal>,
    );

    expect(container.querySelector('form.modal-backdrop')).toBeNull();
    expect(container.querySelector('div.modal-backdrop')).toBeInTheDocument();
  });
});

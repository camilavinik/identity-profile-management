import type { ReactNode } from 'react';
import { Modal } from '../Modal/Modal';

export function ConfirmationModal({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirming = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: ReactNode;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirming?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      {children && <div className="mt-2 text-sm">{children}</div>}

      <div className="modal-action">
        <button
          type="button"
          className="btn btn-ghost shadow-none"
          onClick={onClose}
          disabled={confirming}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className="btn btn-neutral shadow-none"
          onClick={onConfirm}
          disabled={confirming}
        >
          {confirming && <span className="loading loading-spinner" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

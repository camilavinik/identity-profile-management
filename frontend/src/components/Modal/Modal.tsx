import { X } from 'lucide-react';
import { useCallback, type ReactNode } from 'react';

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children?: ReactNode;
}) {
  const dialogRef = useCallback((node: HTMLDialogElement | null) => {
    if (node && !node.open) node.showModal();
  }, []);

  if (!open) return null;

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box">
        <div className="flex justify-between gap-2">
          {title && <h3 className="text-lg font-bold">{title}</h3>}
          <button
            type="button"
            className="btn btn-xs btn-circle btn-ghost"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
      <div className="modal-backdrop" />
    </dialog>
  );
}

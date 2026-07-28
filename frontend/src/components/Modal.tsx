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
        {title && <h3 className="text-lg font-bold">{title}</h3>}
        {children}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit" aria-label="Close" />
      </form>
    </dialog>
  );
}

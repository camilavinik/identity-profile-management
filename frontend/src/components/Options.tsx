import { Ellipsis } from 'lucide-react';
import type { ReactNode } from 'react';

export function Options({
  menuClassName = 'w-52',
  children,
}: {
  menuClassName?: string;
  children: ReactNode;
}) {
  const close = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  return (
    <div className="dropdown dropdown-bottom dropdown-end">
      <button
        type="button"
        tabIndex={0}
        className="btn btn-ghost btn-circle btn-xs shadow-none"
      >
        <Ellipsis className="size-4.5" />
      </button>
      <ul
        tabIndex={0}
        onClick={close}
        className={`dropdown-content menu bg-base-100 rounded-box z-1 p-2 shadow-lg ${menuClassName}`}
      >
        {children}
      </ul>
    </div>
  );
}

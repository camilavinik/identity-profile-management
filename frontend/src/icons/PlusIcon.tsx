import type { SVGProps } from 'react';

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-[1em]"
      {...props}
    >
      <path
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeWidth="2.5"
        fill="none"
        stroke="currentColor"
        d="M12 5v14M5 12h14"
      />
    </svg>
  );
}

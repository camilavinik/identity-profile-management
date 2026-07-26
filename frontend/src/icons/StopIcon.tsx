import type { SVGProps } from 'react';

export function StopIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-[1em]"
      fill="currentColor"
      {...props}
    >
      <path d="M6 6h12v12H6z" />
    </svg>
  );
}

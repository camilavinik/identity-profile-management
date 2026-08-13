import type { ReactNode } from 'react';

const mapContextToColour: Record<string, string> = {
  religious: 'badge-accent',
  legal: 'badge-primary',
  professional: 'badge-info',
  informal: 'badge-secondary',
};

const variantClass = {
  solid: '',
  soft: 'badge-soft',
  dash: 'badge-dash',
  outline: 'badge-outline',
} as const;

const sizeClass = {
  xs: 'badge-xs',
  sm: 'badge-sm',
} as const;

export function ContextCharsetBadge({
  context,
  variant = 'soft',
  size = 'sm',
  muted = false,
  onClick,
  children,
}: {
  context: string;
  variant?: 'solid' | 'soft' | 'dash' | 'outline';
  size?: 'xs' | 'sm';
  muted?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  const isMutedSoft = muted && variant === 'soft';
  const colourClass = muted
    ? 'badge-neutral'
    : (mapContextToColour[context.toLowerCase()] ?? 'badge-neutral');
  const className = isMutedSoft
    ? `badge ${sizeClass[size]} font-semibold bg-base-300 text-base-content/60 border-base-300`
    : `badge ${sizeClass[size]} ${variantClass[variant]} font-semibold ${colourClass}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${className} cursor-pointer`}
      >
        {children}
      </button>
    );
  }
  return <div className={className}>{children}</div>;
}

import { useState, type ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function CollapsibleSection({ title, defaultOpen = true, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center gap-2 text-left"
      >
        <span className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--ink-ghost)' }}>
          {title}
        </span>
        <span
          className="text-xs transition-transform duration-300"
          style={{ color: 'var(--ink-ghost)', transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        >
          ▾
        </span>
      </button>
      {isOpen ? (
        <div className="mt-4 emerge">
          {children}
        </div>
      ) : null}
    </div>
  );
}

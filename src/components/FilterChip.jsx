import { ChevronDown, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/cn.js';

/**
 * FilterChip — multi-state pill control.
 *
 * Props:
 *  - label:    string             — chip label when no value selected
 *  - value:    string | null      — currently selected option slug
 *  - options:  [{ slug, label }]  — the dropdown choices
 *  - onChange: (slug | null) => void
 */
export function FilterChip({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const active = value != null;
  const activeLabel = active ? options.find((o) => o.slug === value)?.label ?? label : label;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-colors border',
          active
            ? 'bg-primary-muted text-primary border-primary/40'
            : 'bg-bg-card text-text-muted border-border hover:text-text'
        )}
      >
        <span>{activeLabel}</span>
        {active ? (
          <X
            className="h-3.5 w-3.5 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
          />
        ) : (
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full mt-2 inset-inline-start-0 min-w-[180px] rounded-xl border border-border bg-bg-elevated shadow-2xl z-30 overflow-hidden animate-fade-in"
          style={{ insetInlineStart: 0 }}
        >
          {options.map((opt) => (
            <button
              key={opt.slug}
              type="button"
              role="menuitem"
              onClick={() => {
                onChange(opt.slug);
                setOpen(false);
              }}
              className={cn(
                'block w-full text-start px-3.5 py-2 text-sm transition-colors',
                value === opt.slug
                  ? 'bg-primary-muted text-primary'
                  : 'text-text hover:bg-bg-card'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

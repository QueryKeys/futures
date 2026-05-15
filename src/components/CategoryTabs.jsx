import * as Icons from 'lucide-react';
import { cn } from '../lib/cn.js';
import { CATEGORIES } from '../config/categories.js';

/**
 * Sticky horizontally-scrollable tab strip. The scroll container honors RTL
 * automatically via `dir="rtl"` on <html> + flex direction.
 */
export function CategoryTabs({ active, onChange, counts = {} }) {
  return (
    <div className="sticky top-0 z-20 sticky-blur border-b border-border-subtle">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <nav
          aria-label="קטגוריות"
          className="flex gap-2 overflow-x-auto scrollbar-thin py-3 -mx-2 px-2"
        >
          {CATEGORIES.map((cat) => {
            const Icon = Icons[cat.icon] ?? Icons.Circle;
            const isActive = active === cat.slug;
            const count = counts[cat.slug];
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => onChange(cat.slug)}
                aria-pressed={isActive}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors',
                  'border',
                  isActive
                    ? 'bg-primary text-bg border-primary font-semibold'
                    : 'bg-bg-card text-text-muted border-border hover:text-text hover:border-border'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{cat.label}</span>
                {count != null && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-mono tabular-nums',
                      isActive ? 'bg-bg/20 text-bg' : 'bg-bg-elevated text-text-dim'
                    )}
                  >
                    <bdi className="num">{count}</bdi>
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

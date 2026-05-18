import { Brain, Target, Crosshair, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/cn.js';
import { fmtInt } from '../lib/enrichers.js';

const ICONS = {
  smart_money: Brain,
  consensus: Target,
  sharpshooter: Crosshair,
};

const ACCENT = {
  smart: {
    border: 'border-smart/30',
    halo: 'shadow-smart/20',
    bg: 'from-smart/15 to-transparent',
    text: 'text-smart',
    btn: 'bg-smart hover:bg-smart-hover text-white',
    selectedRing: 'ring-2 ring-smart',
  },
  primary: {
    border: 'border-primary/30',
    halo: 'shadow-primary/20',
    bg: 'from-primary/15 to-transparent',
    text: 'text-primary',
    btn: 'bg-primary hover:bg-primary-hover text-bg',
    selectedRing: 'ring-2 ring-primary',
  },
  cta: {
    border: 'border-cta/30',
    halo: 'shadow-cta/20',
    bg: 'from-cta/15 to-transparent',
    text: 'text-cta',
    btn: 'bg-cta hover:bg-cta-hover text-bg',
    selectedRing: 'ring-2 ring-cta',
  },
};

export function StrategyCard({ strategy, count, selected, onSelect }) {
  const Icon = ICONS[strategy.slug] ?? Brain;
  const accent = ACCENT[strategy.color] ?? ACCENT.primary;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group relative overflow-hidden text-start rounded-2xl border bg-bg-card p-6 transition-all card-hover-ring',
        accent.border,
        selected && accent.selectedRing
      )}
    >
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-bl opacity-60 pointer-events-none',
          accent.bg
        )}
      />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              'h-12 w-12 rounded-xl grid place-items-center bg-bg-elevated',
              accent.text
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
          {count != null && (
            <div className="text-end">
              <p className={cn('text-2xl font-bold', accent.text)}>
                <bdi className="num">{fmtInt(count)}</bdi>
              </p>
              <p className="text-[10px] text-text-dim uppercase tracking-wider">שווקים</p>
            </div>
          )}
        </div>

        <h3 className="text-xl font-bold text-text mb-1">{strategy.label}</h3>
        <p className={cn('text-xs font-medium mb-3', accent.text)}>{strategy.sub}</p>
        <p className="text-sm text-text-muted leading-relaxed">{strategy.description}</p>

        <div
          className={cn(
            'mt-5 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
            accent.btn
          )}
        >
          {selected ? 'מסונן כעת' : 'הצג שווקים'}
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        </div>
      </div>
    </button>
  );
}

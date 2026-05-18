import { NavLink } from 'react-router-dom';
import {
  Home,
  Radar,
  Layers,
  Crosshair,
  LogIn,
  LogOut,
  Sparkles,
  Bookmark,
} from 'lucide-react';
import { cn } from '../lib/cn.js';
import { useAuth, useFavorites, useAiCredits } from '../lib/useFavorites.js';

const NAV = [
  { to: '/', label: 'בית', icon: Home, exact: true },
  { to: '/scanner', label: 'סורק שווקים', icon: Layers },
  { to: '/events', label: 'כל השווקים', icon: Sparkles },
  { to: '/sharks', label: 'ראדאר לוויתנים', icon: Crosshair },
];

export function Sidebar() {
  const { user, signIn, signOut, configured } = useAuth();
  const { favorites } = useFavorites();
  const { remaining, total } = useAiCredits();

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-l border-border-subtle bg-bg-surface min-h-screen sticky top-0">
      <div className="p-5 border-b border-border-subtle">
        <NavLink to="/" className="flex items-center gap-2.5">
          <div className="relative h-9 w-9 rounded-xl bg-bg-elevated grid place-items-center">
            <Radar className="h-5 w-5 text-primary" />
            <span className="absolute -top-0.5 -end-0.5 h-2.5 w-2.5 rounded-full bg-smart animate-pulse-slow" />
          </div>
          <div>
            <p className="text-base font-bold text-text leading-none">Money Radar</p>
            <p className="text-[10px] text-text-dim mt-0.5">מכ״ם הכסף החכם</p>
          </div>
        </NavLink>
      </div>

      <nav className="p-3 space-y-1 flex-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-primary-muted text-primary font-semibold'
                  : 'text-text-muted hover:bg-bg-card hover:text-text'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 space-y-3">
        <div className="rounded-xl border border-border bg-bg-card p-3">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-semibold text-text">קרדיטים שבועיים</p>
            <Sparkles className="h-3.5 w-3.5 text-cta" />
          </div>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-text">
              <bdi className="num">{remaining}</bdi>
            </span>
            <span className="text-xs text-text-dim mb-1">
              / <bdi className="num">{total}</bdi>
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-bg-elevated overflow-hidden">
            <div
              className="h-full bg-cta transition-all"
              style={{ width: `${(remaining / total) * 100}%` }}
            />
          </div>
        </div>

        {favorites.size > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-text-muted">
            <Bookmark className="h-3.5 w-3.5" />
            <span>
              <bdi className="num">{favorites.size}</bdi> שמורים
            </span>
          </div>
        )}

        {configured ? (
          user ? (
            <div className="rounded-xl border border-border bg-bg-card p-3">
              <div className="flex items-center gap-2.5 mb-2">
                {user.photoURL && (
                  <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-text truncate">
                    {user.displayName ?? user.email}
                  </p>
                  <p className="text-[10px] text-text-dim truncate">{user.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={signOut}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-bg-elevated px-3 py-1.5 text-xs text-text-muted hover:text-text transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                התנתק
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={signIn}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-bg hover:bg-primary-hover transition-colors"
            >
              <LogIn className="h-4 w-4" />
              התחבר עם Google
            </button>
          )
        ) : (
          <p className="text-[10px] text-text-dim text-center px-2">
            הגדר Firebase כדי לשמור מועדפים בענן
          </p>
        )}
      </div>
    </aside>
  );
}

export function MobileTopBar() {
  return (
    <header className="lg:hidden sticky top-0 z-30 sticky-blur border-b border-border-subtle">
      <div className="flex items-center justify-between p-4">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="relative h-8 w-8 rounded-lg bg-bg-elevated grid place-items-center">
            <Radar className="h-4 w-4 text-primary" />
          </div>
          <p className="text-sm font-bold text-text">Money Radar</p>
        </NavLink>
        <MobileCredits />
      </div>
      <nav className="flex border-t border-border-subtle">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors',
                isActive ? 'text-primary' : 'text-text-dim hover:text-text'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

function MobileCredits() {
  const { remaining, total } = useAiCredits();
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-border bg-bg-card px-3 py-1">
      <Sparkles className="h-3 w-3 text-cta" />
      <span className="text-xs text-text">
        <bdi className="num">{remaining}/{total}</bdi>
      </span>
    </div>
  );
}

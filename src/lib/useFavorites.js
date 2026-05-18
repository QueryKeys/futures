// Favorites + AI credit tracking. Backed by Firestore when configured,
// otherwise falls back to localStorage so the UI is still usable in
// development before secrets are wired up.

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  updateDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, db, provider, isFirebaseConfigured } from './firebase.js';

const LS_FAVORITES_KEY = 'mr.favorites';
const LS_CREDITS_KEY = 'mr.aiCredits';

export const AI_CREDITS_PER_WEEK = 3;

// ---------------------------------------------------------------------------
// useAuth — exposes the current user + sign in / out actions.
// ---------------------------------------------------------------------------
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u ?? null);
      setLoading(false);
    });
  }, []);

  const signIn = useCallback(async () => {
    if (!isFirebaseConfigured) return;
    await signInWithPopup(auth, provider);
  }, []);

  const signOutNow = useCallback(async () => {
    if (!isFirebaseConfigured) return;
    await signOut(auth);
  }, []);

  return { user, loading, signIn, signOut: signOutNow, configured: isFirebaseConfigured };
}

// ---------------------------------------------------------------------------
// useFavorites — set of saved market IDs + toggle action.
// ---------------------------------------------------------------------------
export function useFavorites() {
  const { user } = useAuth();
  const [ids, setIds] = useState(() => loadLocalFavorites());

  useEffect(() => {
    if (!isFirebaseConfigured || !user) {
      setIds(loadLocalFavorites());
      return;
    }
    const ref = collection(db, 'users', user.uid, 'favorites');
    return onSnapshot(ref, (snap) => {
      const next = new Set();
      snap.forEach((d) => next.add(d.id));
      setIds(next);
    });
  }, [user]);

  const toggle = useCallback(
    async (market) => {
      const id = String(market.id);
      const next = new Set(ids);
      const isOn = next.has(id);
      if (isOn) next.delete(id);
      else next.add(id);
      setIds(next);

      if (!isFirebaseConfigured || !user) {
        saveLocalFavorites(next);
        return;
      }
      const ref = doc(db, 'users', user.uid, 'favorites', id);
      if (isOn) {
        await deleteDoc(ref);
      } else {
        await setDoc(ref, {
          marketId: id,
          question: market.question ?? null,
          slug: market.slug ?? null,
          probability: market.probability ?? null,
          addedAt: serverTimestamp(),
        });
      }
    },
    [ids, user]
  );

  const isFavorite = useCallback((marketId) => ids.has(String(marketId)), [ids]);

  return { favorites: ids, isFavorite, toggle };
}

function loadLocalFavorites() {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(LS_FAVORITES_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}
function saveLocalFavorites(set) {
  try {
    localStorage.setItem(LS_FAVORITES_KEY, JSON.stringify([...set]));
  } catch {
    /* quota / private mode — ignore */
  }
}

// ---------------------------------------------------------------------------
// useAiCredits — 3 per ISO week, refilling on Monday 00:00 UTC.
// Stored at users/{uid}/meta/aiCredits.
// ---------------------------------------------------------------------------
export function useAiCredits() {
  const { user } = useAuth();
  const [state, setState] = useState({ used: 0, weekKey: currentWeekKey() });

  useEffect(() => {
    if (!isFirebaseConfigured || !user) {
      setState(loadLocalCredits());
      return;
    }
    const ref = doc(db, 'users', user.uid, 'meta', 'aiCredits');
    return onSnapshot(ref, (snap) => {
      const data = snap.data();
      if (!data || data.weekKey !== currentWeekKey()) {
        setState({ used: 0, weekKey: currentWeekKey() });
      } else {
        setState({ used: data.used ?? 0, weekKey: data.weekKey });
      }
    });
  }, [user]);

  const remaining = Math.max(0, AI_CREDITS_PER_WEEK - state.used);

  const consume = useCallback(async () => {
    if (remaining <= 0) return false;

    if (!isFirebaseConfigured || !user) {
      const next = { used: state.used + 1, weekKey: currentWeekKey() };
      setState(next);
      saveLocalCredits(next);
      return true;
    }

    const ref = doc(db, 'users', user.uid, 'meta', 'aiCredits');
    const snap = await getDoc(ref);
    const data = snap.data();
    if (!data || data.weekKey !== currentWeekKey()) {
      await setDoc(ref, { weekKey: currentWeekKey(), used: 1, lastUsedAt: serverTimestamp() });
    } else {
      await updateDoc(ref, { used: increment(1), lastUsedAt: serverTimestamp() });
    }
    return true;
  }, [remaining, state.used, user]);

  return useMemo(
    () => ({ used: state.used, remaining, total: AI_CREDITS_PER_WEEK, consume }),
    [state.used, remaining, consume]
  );
}

function loadLocalCredits() {
  if (typeof window === 'undefined') return { used: 0, weekKey: currentWeekKey() };
  try {
    const raw = localStorage.getItem(LS_CREDITS_KEY);
    if (!raw) return { used: 0, weekKey: currentWeekKey() };
    const parsed = JSON.parse(raw);
    if (parsed.weekKey !== currentWeekKey()) return { used: 0, weekKey: currentWeekKey() };
    return parsed;
  } catch {
    return { used: 0, weekKey: currentWeekKey() };
  }
}
function saveLocalCredits(state) {
  try {
    localStorage.setItem(LS_CREDITS_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function currentWeekKey() {
  // ISO week: Monday-based, UTC. Format: YYYY-Www
  const now = new Date();
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // Thursday of this week
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((date - firstThursday) / 86_400_000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

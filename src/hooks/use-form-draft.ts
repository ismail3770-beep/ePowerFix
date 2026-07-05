"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Persists a piece of form state to localStorage so the admin doesn't lose
 * their progress if the page refreshes or they navigate away.
 *
 * Usage:
 *   const [form, setForm] = useState({ name: "", price: 0 });
 *   useFormDraft("admin-product-add", form);
 *
 *   // To restore on mount:
 *   const [form, setForm] = useState(() => loadFormDraft("admin-product-add", { name: "", price: 0 }));
 *
 *   // To clear after a successful save:
 *   clearFormDraft("admin-product-add");
 *
 * The draft is debounced (300ms) so we don't hammer localStorage on every
 * keystroke, and it auto-expires after 24 hours so stale drafts don't linger.
 */

const PREFIX = "epf-draft:";
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function key(name: string) {
  return `${PREFIX}${name}`;
}

/** Load a draft from localStorage. Returns `fallback` if no draft exists. */
export function loadFormDraft<T>(name: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key(name));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    // Expired — discard.
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      window.localStorage.removeItem(key(name));
      return fallback;
    }
    // Merge so new fields added in code updates still get their defaults.
    return { ...fallback, ...(parsed.data as T) };
  } catch {
    return fallback;
  }
}

/** Remove a draft (call after a successful save/submit). */
export function clearFormDraft(name: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key(name));
  } catch {
    /* ignore */
  }
}

/**
 * Hook that auto-saves `value` to localStorage under `name`.
 * Debounced by 300ms. Use alongside `loadFormDraft` for restore.
 */
export function useFormDraft<T>(name: string, value: T) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  const save = useCallback(() => {
    try {
      const payload = {
        data: valueRef.current,
        savedAt: Date.now(),
        expiresAt: Date.now() + TTL_MS,
      };
      window.localStorage.setItem(key(name), JSON.stringify(payload));
    } catch {
      /* ignore quota errors */
    }
  }, [name]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, save]);

  // Save once on unmount (e.g. when navigating away).
  useEffect(() => {
    return () => save();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

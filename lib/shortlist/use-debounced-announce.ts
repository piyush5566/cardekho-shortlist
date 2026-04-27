"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DEBOUNCE_MS = 400;

/** Single debounced `aria-live` line for shortlist outcomes (not per optimistic tick). */
export function useDebouncedAnnounce() {
  const [message, setMessage] = useState("");
  /** Browser timer id (`number` under DOM typings). */
  const timerRef = useRef<number | undefined>(undefined);

  const announce = useCallback((text: string) => {
    if (typeof window === "undefined") return;
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setMessage(text);
    }, DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current !== undefined) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { message, announce };
}

"use client";

import * as React from "react";
import type { DemoState } from "../types";
import { type Action, accountById, reducer } from "../logic/engine";
import { STATE_VERSION, createSeedState } from "../data/seed";

const STORAGE_KEY = "vani-demo-state";

interface StoreValue {
  state: DemoState;
  dispatch: React.Dispatch<Action>;
  reset: () => void;
}

const StoreContext = React.createContext<StoreValue | null>(null);

/** Read the saved demo (browser only). Falls back to the seed on the server or if nothing valid is saved. */
function loadInitialState(): DemoState {
  if (typeof window === "undefined") return createSeedState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoState;
      if (parsed.version === STATE_VERSION) return { ...parsed, openCaseId: undefined };
    }
  } catch {
    /* storage unavailable: keep seed */
  }
  return createSeedState();
}

const noopSubscribe = () => () => {};

/**
 * The demo lives in localStorage, so the server cannot know it.
 * The dashboard is therefore rendered on the client only (a light skeleton is server-rendered),
 * which avoids hydration mismatches such as different badge counts.
 */
export function DemoStoreProvider({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const mounted = React.useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  if (!mounted) return <>{fallback ?? null}</>;
  return <ClientStore>{children}</ClientStore>;
}

function ClientStore({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, undefined, loadInitialState);
  // Do not write the untouched initial state back (nothing changed yet).
  const initialState = React.useRef(state);

  React.useEffect(() => {
    if (state === initialState.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const reset = React.useCallback(() => dispatch({ type: "RESET", state: createSeedState() }), []);

  const value = React.useMemo(() => ({ state, dispatch, reset }), [state, reset]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useDemoStore() {
  const ctx = React.useContext(StoreContext);
  if (!ctx) throw new Error("useDemoStore must be used inside DemoStoreProvider");
  return ctx;
}

export function useActiveAccount() {
  const { state } = useDemoStore();
  return accountById(state.activeAccountId) ?? accountById("rina")!;
}

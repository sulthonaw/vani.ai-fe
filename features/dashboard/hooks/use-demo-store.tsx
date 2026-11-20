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

export function DemoStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, undefined, createSeedState);
  // Never save the untouched seed: otherwise it could overwrite the stored demo before it is read.
  const initialState = React.useRef(state);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DemoState;
        if (parsed.version === STATE_VERSION) dispatch({ type: "LOAD", state: { ...parsed, openCaseId: undefined } });
      }
    } catch {
      /* storage unavailable: keep seed */
    }
  }, []);

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

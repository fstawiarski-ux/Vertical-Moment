"use client";

import { createContext, createElement, useContext, useEffect, useRef, type ReactNode } from "react";
import { createStore, type StoreApi } from "zustand/vanilla";
import { useStore } from "zustand";
import { applyExploreLayout, applyGridLayout, applyPresentationLayout } from "./layoutAlgorithms";
import type { BoxState, LayoutMode, LayoutState, ViewportBounds } from "./types";

const STORAGE_KEY = "vertical-moment:explore-app:layout";
const STORAGE_VERSION = 1;

export type LayoutAction =
  | { type: "ADD_BOX"; box: BoxState }
  | { type: "REMOVE_BOX"; id: string }
  | { type: "UPDATE_BOX"; id: string; patch: Partial<Omit<BoxState, "id">> }
  | { type: "SET_ACTIVE_BOX"; id: string | null }
  | { type: "SET_HERO_BOX"; id: string | null }
  | { type: "SET_LAYOUT_MODE"; mode: LayoutMode }
  | { type: "APPLY_AUTO_LAYOUT"; viewport?: ViewportBounds }
  | { type: "MINIMIZE_ALL" }
  | { type: "LOAD_STATE"; state: LayoutState };

interface PersistedLayout {
  version: number;
  state: LayoutState;
}

export interface LayoutStore extends LayoutState {
  hydrated: boolean;
  dispatch: (action: LayoutAction) => void;
  markHydrated: () => void;
}

const defaultState: LayoutState = {
  boxes: [],
  activeBoxId: null,
  heroBoxId: null,
  layoutMode: "explore",
};

const validModes = new Set(["normal", "minimized", "expanded", "fullscreen"]);
const validLayouts = new Set(["explore", "grid", "presentation"]);

function isBoxState(value: unknown): value is BoxState {
  if (!value || typeof value !== "object") return false;
  const box = value as Partial<BoxState>;
  return typeof box.id === "string"
    && typeof box.type === "string"
    && typeof box.x === "number"
    && typeof box.y === "number"
    && typeof box.zIndex === "number"
    && typeof box.mode === "string"
    && validModes.has(box.mode)
    && typeof box.pinned === "boolean";
}

function isLayoutState(value: unknown): value is LayoutState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<LayoutState>;
  return Array.isArray(state.boxes)
    && state.boxes.every(isBoxState)
    && (state.activeBoxId === null || typeof state.activeBoxId === "string")
    && (state.heroBoxId === null || typeof state.heroBoxId === "string")
    && typeof state.layoutMode === "string"
    && validLayouts.has(state.layoutMode);
}

function mergePersistedState(persisted: LayoutState, fallback: LayoutState): LayoutState {
  const persistedById = new Map(persisted.boxes.map((box) => [box.id, box]));
  const boxes = fallback.boxes.map((fallbackBox) => {
    const saved = persistedById.get(fallbackBox.id);
    if (!saved) return fallbackBox;
    return {
      ...fallbackBox,
      ...saved,
      id: fallbackBox.id,
      type: fallbackBox.type,
      dataRef: fallbackBox.dataRef,
    };
  });
  const ids = new Set(boxes.map((box) => box.id));

  return {
    boxes,
    activeBoxId: persisted.activeBoxId && ids.has(persisted.activeBoxId) ? persisted.activeBoxId : null,
    heroBoxId: persisted.heroBoxId && ids.has(persisted.heroBoxId) ? persisted.heroBoxId : null,
    layoutMode: persisted.layoutMode,
  };
}

export function layoutReducer(state: LayoutState, action: LayoutAction): LayoutState {
  switch (action.type) {
    case "ADD_BOX": {
      if (state.boxes.some((box) => box.id === action.box.id)) return state;
      const zIndex = Math.max(0, ...state.boxes.map((box) => box.zIndex)) + 1;
      return {
        ...state,
        boxes: [...state.boxes, { ...action.box, zIndex }],
        activeBoxId: action.box.id,
      };
    }
    case "REMOVE_BOX": {
      const boxes = state.boxes.filter((box) => box.id !== action.id);
      return {
        ...state,
        boxes,
        activeBoxId: state.activeBoxId === action.id ? null : state.activeBoxId,
        heroBoxId: state.heroBoxId === action.id ? null : state.heroBoxId,
      };
    }
    case "UPDATE_BOX":
      return {
        ...state,
        boxes: state.boxes.map((box) => box.id === action.id ? { ...box, ...action.patch, id: box.id } : box),
      };
    case "SET_ACTIVE_BOX": {
      if (action.id === null) return { ...state, activeBoxId: null };
      if (!state.boxes.some((box) => box.id === action.id)) return state;
      const zIndex = Math.max(0, ...state.boxes.map((box) => box.zIndex)) + 1;
      return {
        ...state,
        activeBoxId: action.id,
        boxes: state.boxes.map((box) => box.id === action.id ? { ...box, zIndex } : box),
      };
    }
    case "SET_HERO_BOX":
      return action.id === null || state.boxes.some((box) => box.id === action.id)
        ? { ...state, heroBoxId: action.id }
        : state;
    case "SET_LAYOUT_MODE":
      return { ...state, layoutMode: action.mode };
    case "APPLY_AUTO_LAYOUT": {
      const boxes = state.layoutMode === "grid"
        ? applyGridLayout(state.boxes, action.viewport)
        : state.layoutMode === "presentation"
          ? applyPresentationLayout(state.boxes, action.viewport, state.heroBoxId ?? state.activeBoxId)
          : applyExploreLayout(state.boxes, action.viewport);
      return { ...state, boxes };
    }
    case "MINIMIZE_ALL":
      return {
        ...state,
        activeBoxId: null,
        boxes: state.boxes.map((box) => box.pinned ? box : { ...box, mode: "minimized" }),
      };
    case "LOAD_STATE":
      return action.state;
    default:
      return state;
  }
}

export function createLayoutStore(initialState: LayoutState = defaultState): StoreApi<LayoutStore> {
  return createStore<LayoutStore>()((set) => ({
    ...initialState,
    hydrated: false,
    dispatch: (action) => set((current) => ({ ...current, ...layoutReducer(current, action) })),
    markHydrated: () => set({ hydrated: true }),
  }));
}

const LayoutStoreContext = createContext<StoreApi<LayoutStore> | null>(null);

export function LayoutProvider({ children, initialState }: { children: ReactNode; initialState: LayoutState }) {
  const storeRef = useRef<StoreApi<LayoutStore> | null>(null);
  if (!storeRef.current) storeRef.current = createLayoutStore(initialState);

  useEffect(() => {
    const store = storeRef.current;
    if (!store) return;
    const layoutStore = store;
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function hydrate() {
      try {
        const { get, set } = await import("idb-keyval");
        const persisted = await get<PersistedLayout>(STORAGE_KEY);
        if (cancelled) return;
        if (persisted?.version === STORAGE_VERSION && isLayoutState(persisted.state)) {
          layoutStore.getState().dispatch({
            type: "LOAD_STATE",
            state: mergePersistedState(persisted.state, initialState),
          });
        }
        layoutStore.getState().markHydrated();
        unsubscribe = layoutStore.subscribe((next) => {
          if (!next.hydrated) return;
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => {
            const state: LayoutState = {
              boxes: next.boxes,
              activeBoxId: next.activeBoxId,
              heroBoxId: next.heroBoxId,
              layoutMode: next.layoutMode,
            };
            void set(STORAGE_KEY, { version: STORAGE_VERSION, state } satisfies PersistedLayout);
          }, 250);
        });
      } catch (error) {
        console.warn("Explore App layout persistence is unavailable.", error);
        layoutStore.getState().markHydrated();
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      unsubscribe?.();
    };
  }, [initialState]);

  return createElement(LayoutStoreContext.Provider, { value: storeRef.current }, children);
}

export function useLayoutState<T = LayoutStore>(selector?: (state: LayoutStore) => T): T {
  const store = useContext(LayoutStoreContext);
  if (!store) throw new Error("useLayoutState must be used within LayoutProvider");
  return useStore(store, selector ?? ((state) => state as T));
}

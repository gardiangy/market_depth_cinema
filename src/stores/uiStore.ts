import { create } from 'zustand';

export type ViewMode = 'depth-chart' | 'orderbook-table';

interface UIState {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  viewMode: 'depth-chart',

  setViewMode: (mode) => set({ viewMode: mode }),

  toggleViewMode: () =>
    set((state) => ({
      viewMode: state.viewMode === 'depth-chart' ? 'orderbook-table' : 'depth-chart',
    })),
}));

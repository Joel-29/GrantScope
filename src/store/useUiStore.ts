import { create } from 'zustand';

type UiState = { sidebarCollapsed: boolean; toggleSidebar: () => void };

// Deliberately in memory: no scan targets or wallet information are persisted.
export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));

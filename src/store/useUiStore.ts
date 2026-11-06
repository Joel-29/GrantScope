import { create } from 'zustand';

export type ThemePreference = 'dark' | 'light' | 'system';

type UiState = {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
};

// Deliberately in memory: no scan targets or wallet information are persisted.
export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));

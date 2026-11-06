import { useSyncExternalStore } from 'react';
import { useUiStore } from '../store/useUiStore';

function getSystemTheme(): 'dark' | 'light' {
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function subscribeSystemTheme(onChange: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

export function useTheme() {
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const systemTheme = useSyncExternalStore(
    subscribeSystemTheme,
    getSystemTheme,
    () => 'dark',
  );
  return {
    theme,
    resolvedTheme: theme === 'system' ? systemTheme : theme,
    setTheme,
  };
}

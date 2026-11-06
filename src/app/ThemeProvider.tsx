import { useEffect, type PropsWithChildren } from 'react';
import { useTheme } from '../hooks/useTheme';

export function ThemeProvider({ children }: PropsWithChildren) {
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute(
        'content',
        resolvedTheme === 'dark' ? '#0a1019' : '#f4f7fa',
      );
  }, [resolvedTheme]);
  return children;
}

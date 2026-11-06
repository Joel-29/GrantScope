import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../ui/Button';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const next = resolvedTheme === 'dark' ? 'light' : 'dark';
  const Icon = next === 'light' ? Sun : Moon;
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      <Icon size={18} aria-hidden="true" />
    </Button>
  );
}

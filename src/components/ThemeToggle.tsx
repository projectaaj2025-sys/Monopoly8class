import { Moon, Sun } from 'lucide-react';
import type { ThemeMode } from '../lib/theme';
import { t } from '../i18n'
interface ThemeToggleProps {
  theme: ThemeMode;
  onToggle: () => void;
  compact?: boolean;
}
export function ThemeToggle({
  theme,
  onToggle,
  compact = false
}: ThemeToggleProps) {
  const next = theme === 'dark' ? t("светлую") : t("тёмную");
  return <button type="button" className={`icon-btn icon-btn--ghost theme-toggle ${compact ? 'theme-toggle--compact' : ''}`} onClick={onToggle} aria-label={`${t("Включить")} ${next} ${t("тему")}`} title={`${t("Включить")} ${next} ${t("тему")}`}>
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>;
}
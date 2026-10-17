import { useEffect, useState } from 'react';

const KEY = 'az_theme';
const LEGACY_KEY = 'rp_theme';

export function getTheme() {
  try {
    const saved = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* ignore */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
  try { localStorage.setItem(KEY, theme); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent('az-theme', { detail: theme }));
}

export function useTheme() {
  const [theme, setTheme] = useState(getTheme);
  useEffect(() => {
    applyTheme(getTheme());
    const onChange = (e) => setTheme(e.detail);
    window.addEventListener('az-theme', onChange);
    return () => window.removeEventListener('az-theme', onChange);
  }, []);
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  };
  return { theme, toggle };
}

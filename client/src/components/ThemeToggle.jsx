import { useState } from 'react';
import { getTheme, storeTheme } from '../theme.js';

// Switches the app between light and dark mode (saved in localStorage).
// Pages read the value via getTheme() and apply `theme-${theme}` on their wrapper.
export default function ThemeToggle({ onChange }) {
  const [theme, setTheme] = useState(getTheme());

  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    storeTheme(next);
    onChange?.(next);
  }

  return (
    <button type="button" className="btn ghost small theme-toggle" onClick={toggle}>
      {theme === 'light' ? '🌙 Dark mode' : '☀️ Light mode'}
    </button>
  );
}

const KEY = 'smartpark_theme';

// 'light' matches the landing page palette; 'dark' is the classic dashboard look
export function getTheme() {
  const t = localStorage.getItem(KEY);
  return t === 'dark' ? 'dark' : 'light';
}

export function storeTheme(theme) {
  localStorage.setItem(KEY, theme === 'dark' ? 'dark' : 'light');
}

/**
 * Initialize theme immediately when this module is imported
 * This runs synchronously before React renders, preventing flash of wrong theme
 */
if (typeof window !== 'undefined') {
  try {
    const theme = localStorage.getItem('theme');
    const validTheme = theme === 'dark' || theme === 'light' ? theme : 'light';
    document.documentElement.setAttribute('data-theme', validTheme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
}


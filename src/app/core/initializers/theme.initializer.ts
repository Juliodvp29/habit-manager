export function initializeTheme(): () => void {
  return () => {
    const THEME_KEY = 'habit_theme';
    const savedTheme = localStorage.getItem(THEME_KEY);
    const isDark = savedTheme === 'dark';

    document.body.classList.remove('dark');
    document.documentElement.classList.remove('ion-palette-dark');

    if (isDark) {
      document.body.classList.add('dark');
      document.documentElement.classList.add('ion-palette-dark');
    }

    console.log('Theme initializer:', savedTheme || 'light (default)');
  };
}
export function initializeTheme(): () => void {
  return () => {
    const THEME_KEY = 'habit_theme';
    const savedTheme = localStorage.getItem(THEME_KEY);
    const isDark = savedTheme === 'dark';

    // Aplicar tema al document inmediatamente
    if (isDark) {
      document.body.classList.add('dark');
      document.documentElement.classList.add('ion-palette-dark');
    } else {
      document.body.classList.remove('dark');
      document.documentElement.classList.remove('ion-palette-dark');
    }

    console.log('Theme initialized:', savedTheme || 'light (default)');
  };
}
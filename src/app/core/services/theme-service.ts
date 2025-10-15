import { effect, inject, Injectable, signal } from '@angular/core';
import { StorageService } from './storage-service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private storageService = inject(StorageService);

  public isDarkMode = signal<boolean>(false);

  constructor() {
    const currentTheme = this.storageService.getTheme();
    this.isDarkMode.set(currentTheme === 'dark');

    console.log('ThemeService initialized with theme:', currentTheme);

    effect(() => {
      const theme = this.isDarkMode() ? 'dark' : 'light';
      this.storageService.saveTheme(theme);
      this.applyTheme();
      console.log('Theme changed to:', theme);
    });
  }

  toggleTheme(): void {
    this.isDarkMode.update(value => !value);
  }

  setTheme(isDark: boolean): void {
    this.isDarkMode.set(isDark);
  }

  private applyTheme(): void {
    const prefersDark = this.isDarkMode();

    if (prefersDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }

    if (prefersDark) {
      document.documentElement.classList.add('ion-palette-dark');
    } else {
      document.documentElement.classList.remove('ion-palette-dark');
    }
  }
}
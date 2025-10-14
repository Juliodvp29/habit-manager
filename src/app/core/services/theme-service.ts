import { effect, inject, Injectable, signal } from '@angular/core';
import { StorageService } from './storage-service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private storageService = inject(StorageService);

  public isDarkMode = signal<boolean>(this.storageService.getTheme() === 'dark');

  constructor() {
    // Aplicar tema al iniciar
    this.applyTheme();

    // Efecto para guardar cambios de tema
    effect(() => {
      const theme = this.isDarkMode() ? 'dark' : 'light';
      this.storageService.saveTheme(theme);
      this.applyTheme();
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
    document.body.classList.toggle('dark', prefersDark);

    // Para Ionic
    document.documentElement.classList.toggle('ion-palette-dark', prefersDark);
  }
}

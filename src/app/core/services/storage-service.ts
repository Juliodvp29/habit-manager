import { Injectable } from '@angular/core';
import { User } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  // ========================================
  // CLAVES DE ALMACENAMIENTO
  // ========================================
  private readonly TOKEN_KEY = 'habit_token'; // Access Token
  private readonly REFRESH_TOKEN_KEY = 'habit_refresh_token'; // Refresh Token
  private readonly USER_KEY = 'habit_user';
  private readonly THEME_KEY = 'habit_theme';
  private readonly LANGUAGE_KEY = 'habit_language';

  // ========================================
  // MÉTODOS PARA ACCESS TOKEN
  // ========================================

  saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  // ========================================
  // MÉTODOS PARA REFRESH TOKEN
  // ========================================

  saveRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  removeRefreshToken(): void {
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  // ========================================
  // MÉTODOS PARA USUARIO
  // ========================================

  saveUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch (e) {
      console.error('Error parsing user from storage', e);
      return null;
    }
  }

  removeUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  // ========================================
  // MÉTODOS PARA TEMA
  // ========================================

  saveTheme(theme: 'light' | 'dark'): void {
    localStorage.setItem(this.THEME_KEY, theme);
  }

  getTheme(): 'light' | 'dark' {
    return (localStorage.getItem(this.THEME_KEY) as 'light' | 'dark') || 'light';
  }

  // ========================================
  // MÉTODOS PARA IDIOMA
  // ========================================

  saveLanguage(language: string): void {
    localStorage.setItem(this.LANGUAGE_KEY, language);
  }

  getLanguage(): string {
    return localStorage.getItem(this.LANGUAGE_KEY) || 'es';
  }

  // ========================================
  // LIMPIAR TODO
  // ========================================

  clearAll(): void {
    localStorage.clear();
  }

  // ========================================
  // UTILIDADES
  // ========================================

  /**
   * Obtener estado de autenticación sin decodificar tokens
   */
  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getRefreshToken();
  }

  /**
   * Limpiar tokens pero mantener otros datos (tema, idioma)
   */
  clearAuthData(): void {
    this.removeToken();
    this.removeRefreshToken();
    this.removeUser();
  }
}
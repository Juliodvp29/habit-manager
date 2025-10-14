// src/app/core/services/storage.service.ts
import { Injectable } from '@angular/core';
import { User } from '../models/auth.models';


@Injectable({
  providedIn: 'root'
})
export class StorageService {

  private readonly TOKEN_KEY = 'habit_token';
  private readonly USER_KEY = 'habit_user';
  private readonly THEME_KEY = 'habit_theme';
  private readonly LANGUAGE_KEY = 'habit_language';

  // Token
  saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  // User
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

  // Theme
  saveTheme(theme: 'light' | 'dark'): void {
    localStorage.setItem(this.THEME_KEY, theme);
  }

  getTheme(): 'light' | 'dark' {
    return (localStorage.getItem(this.THEME_KEY) as 'light' | 'dark') || 'light';
  }

  // Language
  saveLanguage(language: string): void {
    localStorage.setItem(this.LANGUAGE_KEY, language);
  }

  getLanguage(): string {
    return localStorage.getItem(this.LANGUAGE_KEY) || 'es';
  }

  // Clear all
  clearAll(): void {
    localStorage.clear();
  }
}
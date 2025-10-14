import { inject, Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { StorageService } from './storage-service';

export type SupportedLanguage = 'es' | 'en';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {

  private translateService = inject(TranslateService);
  private storageService = inject(StorageService);

  // Signal para el idioma actual
  public currentLanguage = signal<SupportedLanguage>('es');

  // Idiomas disponibles
  public availableLanguages: LanguageOption[] = [
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' }
  ];

  constructor() {
    // Configurar idiomas disponibles
    this.translateService.addLangs(['es', 'en']);

    // Establecer idioma por defecto
    this.translateService.setDefaultLang('es');

    // Cargar idioma guardado o detectar del navegador
    this.initializeLanguage();
  }

  private initializeLanguage(): void {
    // Intentar cargar desde localStorage
    const savedLang = this.storageService.getLanguage() as SupportedLanguage;

    if (savedLang && this.isLanguageSupported(savedLang)) {
      this.setLanguage(savedLang);
    } else {
      // Detectar idioma del navegador
      const browserLang = this.translateService.getBrowserLang() as SupportedLanguage;
      const langToUse = this.isLanguageSupported(browserLang) ? browserLang : 'es';
      this.setLanguage(langToUse);
    }
  }

  public setLanguage(lang: SupportedLanguage): void {
    if (!this.isLanguageSupported(lang)) {
      console.warn(`Language ${lang} is not supported. Falling back to 'es'`);
      lang = 'es';
    }

    this.translateService.use(lang);
    this.currentLanguage.set(lang);
    this.storageService.saveLanguage(lang);

    // Opcional: cambiar dirección del texto si se añade árabe u otros idiomas RTL
    // document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }

  public toggleLanguage(): void {
    const newLang: SupportedLanguage = this.currentLanguage() === 'es' ? 'en' : 'es';
    this.setLanguage(newLang);
  }

  public getCurrentLanguageName(): string {
    const lang = this.availableLanguages.find(l => l.code === this.currentLanguage());
    return lang?.nativeName || 'Español';
  }

  public translate(key: string, params?: any): string {
    return this.translateService.instant(key, params);
  }

  private isLanguageSupported(lang: string): lang is SupportedLanguage {
    return ['es', 'en'].includes(lang);
  }

  // Método para sincronizar con el idioma del usuario en el backend
  public syncWithUserPreference(userLangCode: string): void {
    if (userLangCode && this.isLanguageSupported(userLangCode as SupportedLanguage)) {
      this.setLanguage(userLangCode as SupportedLanguage);
    }
  }

}

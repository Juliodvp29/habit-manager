import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { User, UserSettings } from '../models/user.model';
import { ApiService } from './api-service';
import { StorageService } from './storage-service';

export interface UpdateProfileDto {
  fullName?: string;
  profilePicture?: string;
  preferredLanguageId?: number;
}

export interface UpdateSettingsDto {
  theme?: 'light' | 'dark';
  notificationEnabled?: boolean;
  reminderTime?: string;
  weeklySummary?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiService = inject(ApiService);
  private storageService = inject(StorageService);

  /**
   * Obtiene el perfil completo del usuario
   */
  getProfile(): Observable<User> {
    return this.apiService.get<User>('/users/profile').pipe(
      tap(user => {
        // Actualizar usuario en storage
        this.storageService.saveUser(user);
      })
    );
  }

  /**
   * Actualiza el perfil del usuario
   */
  updateProfile(data: UpdateProfileDto): Observable<User> {
    return this.apiService.patch<User>('/users/profile', data).pipe(
      tap(user => {
        this.storageService.saveUser(user);
      })
    );
  }

  /**
   * Obtiene la configuración del usuario
   */
  getSettings(): Observable<UserSettings> {
    return this.apiService.get<UserSettings>('/users/settings');
  }

  /**
   * Actualiza la configuración del usuario
   */
  updateSettings(data: UpdateSettingsDto): Observable<UserSettings> {
    return this.apiService.patch<UserSettings>('/users/settings', data);
  }

  /**
   * Elimina la cuenta del usuario
   */
  deleteAccount(): Observable<void> {
    return this.apiService.delete<void>('/users/account').pipe(
      tap(() => {
        this.storageService.clearAll();
      })
    );
  }

  /**
   * Obtiene el usuario del storage local
   */
  getCurrentUser(): User | any | null {
    return this.storageService.getUser();
  }
}

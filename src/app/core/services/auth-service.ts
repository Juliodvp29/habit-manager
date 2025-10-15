import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ResetPasswordRequest,
  User,
  Verify2FARequest,
} from '../models/auth.models';
import { AuthResponse, VerifyCodeRequest } from '../models/user.model';
import { ApiService } from './api-service';
import { StorageService } from './storage-service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiService = inject(ApiService);
  private storageService = inject(StorageService);

  // ========================================
  // SIGNALS
  // ========================================

  private currentUserSignal = signal<User | null>(
    this.storageService.getUser(),
  );
  private tokenSignal = signal<string | null>(this.storageService.getToken());
  private refreshTokenSignal = signal<string | null>(
    this.storageService.getRefreshToken(),
  );
  private isLoadingSignal = signal<boolean>(false);

  // ========================================
  // COMPUTED
  // ========================================

  public currentUser = computed(() => this.currentUserSignal());
  public token = computed(() => this.tokenSignal());
  public refreshToken = computed(() => this.refreshTokenSignal());
  public isAuthenticated = computed(() => !!this.tokenSignal());
  public isLoading = computed(() => this.isLoadingSignal());

  // ========================================
  // REGISTRO
  // ========================================

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/auth/register', data);
  }

  // ========================================
  // LOGIN
  // ========================================

  login(data: LoginRequest): Observable<LoginResponse> {
    this.isLoadingSignal.set(true);
    return this.apiService.post<LoginResponse>('/auth/login', data).pipe(
      tap((response: any) => {
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => error);
      }),
    );
  }

  // ========================================
  // VERIFICACIÓN 2FA
  // ========================================

  verify2FA(data: Verify2FARequest): Observable<AuthResponse> {
    this.isLoadingSignal.set(true);
    return this.apiService
      .post<AuthResponse>('/auth/verify-2fa', data)
      .pipe(
        tap((response: any) => {
          this.isLoadingSignal.set(false);
          if (response.accessToken && response.user) {
            this.setSession(
              response.accessToken,
              response.refreshToken,
              response.user,
            );
          }
        }),
        catchError((error) => {
          this.isLoadingSignal.set(false);
          return throwError(() => error);
        }),
      );
  }

  // ========================================
  // VERIFICACIÓN DE EMAIL
  // ========================================

  verifyEmail(
    data: VerifyCodeRequest,
  ): Observable<{ message: string; verified: boolean }> {
    return this.apiService.post<{ message: string; verified: boolean }>(
      '/verification/verify-email',
      data,
    );
  }

  resendCode(email: string): Observable<any> {
    return this.apiService.post('/verification/resend-code', { email });
  }

  // ========================================
  // RECUPERACIÓN DE CONTRASEÑA
  // ========================================

  requestPasswordReset(email: string): Observable<any> {
    return this.apiService.post('/verification/request-password-reset', {
      email,
    });
  }

  resetPassword(data: ResetPasswordRequest): Observable<any> {
    return this.apiService.post('/verification/reset-password', data);
  }

  // ========================================
  // REFRESH TOKEN - RENOVACIÓN AUTOMÁTICA
  // ========================================

  /**
   * Renovar access token usando refresh token
   * Se llama automáticamente por el interceptor cuando recibe 401
   */
  refreshAccessToken(): Observable<any> {
    const refreshToken = this.refreshTokenSignal();

    if (!refreshToken) {
      return throwError(
        () => new Error('No refresh token available'),
      );
    }

    return this.apiService
      .post<any>('/auth/refresh', {
        refreshToken,
      })
      .pipe(
        tap((response: any) => {
          if (response.accessToken) {
            this.tokenSignal.set(response.accessToken);
            this.storageService.saveToken(response.accessToken);
            console.log('✅ Token renovado exitosamente');
          }
        }),
        catchError((error) => {
          console.error('❌ Error renovando token:', error);
          // El interceptor manejará el logout
          return throwError(() => error);
        }),
      );
  }

  // ========================================
  // LOGOUT
  // ========================================

  /**
   * Logout: revoca refresh token en servidor y limpia storage
   */
  logout(): Observable<any> {
    const refreshToken = this.refreshTokenSignal();

    // Si tenemos un refresh token, notificar al servidor
    if (refreshToken) {
      return this.apiService
        .post('/auth/logout', { refreshToken })
        .pipe(
          tap(() => {
            this.clearSession();
            console.log('✅ Logout exitoso');
          }),
          catchError((error) => {
            console.error('⚠️ Error en logout del servidor:', error);
            // Aún así limpiar localmente
            this.clearSession();
            return throwError(() => error);
          }),
        );
    }

    // Si no hay refresh token, solo limpiar localmente
    this.clearSession();
    return new Observable((observer) => {
      observer.next({ message: 'Logout local exitoso' });
      observer.complete();
    });
  }

  // ========================================
  // PERFIL DE USUARIO
  // ========================================

  getProfile(): Observable<User> {
    return this.apiService.get<User>('/auth/profile').pipe(
      tap((user) => {
        this.currentUserSignal.set(user);
        this.storageService.saveUser(user);
      }),
    );
  }

  // ========================================
  // MÉTODOS PRIVADOS
  // ========================================

  /**
   * Establecer sesión: guardar tokens y usuario
   */
  private setSession(token: string, refreshToken: string, user: User): void {
    this.storageService.saveToken(token);
    this.storageService.saveRefreshToken(refreshToken);
    this.storageService.saveUser(user);

    this.tokenSignal.set(token);
    this.refreshTokenSignal.set(refreshToken);
    this.currentUserSignal.set(user);

    console.log('✅ Sesión iniciada correctamente');
  }

  /**
   * Limpiar sesión: eliminar tokens y usuario
   */
  private clearSession(): void {
    this.storageService.clearAuthData();
    this.currentUserSignal.set(null);
    this.tokenSignal.set(null);
    this.refreshTokenSignal.set(null);
    this.isLoadingSignal.set(false);

    console.log('✅ Sesión limpiada');
  }
}
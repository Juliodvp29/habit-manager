import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { LoginRequest, RegisterRequest, ResetPasswordRequest, User, Verify2FARequest } from '../models/auth.models';
import { AuthResponse, VerifyCodeRequest } from '../models/user.model';
import { ApiService } from './api-service';
import { StorageService } from './storage-service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiService = inject(ApiService);
  private storageService = inject(StorageService);

  // Signals
  private currentUserSignal = signal<User | null>(this.storageService.getUser());
  private tokenSignal = signal<string | null>(this.storageService.getToken());

  // Computed
  public currentUser = computed(() => this.currentUserSignal());
  public token = computed(() => this.tokenSignal());
  public isAuthenticated = computed(() => !!this.tokenSignal());

  // Auth endpoints
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/auth/register', data);
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/auth/login', data);
  }

  verify2FA(data: Verify2FARequest): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/auth/verify-2fa', data).pipe(
      tap((response: any) => {
        if (response.token && response.user) {
          this.setSession(response.token, response.user);
        }
      })
    );
  }

  verifyEmail(data: VerifyCodeRequest): Observable<{ message: string; verified: boolean }> {
    return this.apiService.post<{ message: string; verified: boolean }>(
      '/verification/verify-email',
      data
    );
  }

  resendCode(email: string): Observable<any> {
    return this.apiService.post('/verification/resend-code', { email });
  }

  requestPasswordReset(email: string): Observable<any> {
    return this.apiService.post('/verification/request-password-reset', { email });
  }

  resetPassword(data: ResetPasswordRequest): Observable<any> {
    return this.apiService.post('/verification/reset-password', data);
  }

  getProfile(): Observable<User> {
    return this.apiService.get<User>('/auth/profile').pipe(
      tap(user => {
        this.currentUserSignal.set(user);
        this.storageService.saveUser(user);
      })
    );
  }

  logout(): void {
    this.storageService.clearAll();
    this.currentUserSignal.set(null);
    this.tokenSignal.set(null);
  }

  private setSession(token: string, user: User): void {
    this.storageService.saveToken(token);
    this.storageService.saveUser(user);
    this.tokenSignal.set(token);
    this.currentUserSignal.set(user);
  }
}

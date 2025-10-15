import { inject, Injectable, OnDestroy } from '@angular/core';
import { interval, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from './auth-service';
import { StorageService } from './storage-service';
import { JwtDecoderService } from '../decorator/jwt-decoder.service';

@Injectable({
  providedIn: 'root'
})
export class AutoRefreshService implements OnDestroy {
  private authService = inject(AuthService);
  private jwtDecoder = inject(JwtDecoderService);
  private storageService = inject(StorageService);

  private destroy$ = new Subject<void>();
  private refreshSubscription?: Subscription;
  private readonly REFRESH_BEFORE_EXPIRY_MS = 60000; // 1 minuto antes de expirar

  startAutoRefresh(): void {
    this.stopAutoRefresh(); // Limpiar subscription anterior

    const token = this.authService.token();
    if (!token) return;

    // Calcular tiempo hasta expiración
    const timeUntilExpiry = this.jwtDecoder.getTimeUntilExpiration(token);
    const refreshIn = Math.max(
      10000, // Mínimo 10 segundos
      timeUntilExpiry - this.REFRESH_BEFORE_EXPIRY_MS
    );

    console.log(`⏰ Auto-refresh programado en ${Math.round(refreshIn / 1000)}s`);

    // Ejecutar refresh en el tiempo calculado
    this.refreshSubscription = interval(refreshIn)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const currentToken = this.authService.token();
        if (currentToken && !this.jwtDecoder.isTokenExpired(currentToken)) {
          console.log('🔄 Renovando token automáticamente...');
          this.authService.refreshAccessToken().subscribe({
            next: () => {
              console.log('✅ Token renovado exitosamente');
              // Reiniciar el ciclo con el nuevo token
              this.startAutoRefresh();
            },
            error: (err) => {
              console.error('❌ Error renovando token:', err);
              // El interceptor manejará el logout
            }
          });
        }
      });
  }

  stopAutoRefresh(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopAutoRefresh();
  }
}
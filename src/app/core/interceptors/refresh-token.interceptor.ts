import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import {
  BehaviorSubject,
  catchError,
  filter,
  switchMap,
  take,
  tap,
  throwError,
} from 'rxjs';
import { AuthService } from '../services/auth-service';

// ========================================
// VARIABLES GLOBALES PARA EVITAR RACE CONDITIONS
// ========================================

let isRefreshing = false;
let refreshTokenSubject = new BehaviorSubject<string | null>(null);

/**
 * Interceptor para auto-renovar access token cuando expira
 *
 * Flujo:
 * 1. Petición normal con access token
 * 2. Servidor devuelve 401 (token expirado)
 * 3. Interceptor detecta 401
 * 4. Si es el primero en detectarlo, hace POST /auth/refresh
 * 5. Obtiene nuevo access token
 * 6. Reintentan TODAS las peticiones pendientes con nuevo token
 */
export const refreshTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastController = inject(ToastController);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // ========================================
      // CASO 1: Token expirado (401) y es el primero
      // ========================================
      if (error.status === 401 && !isRefreshing) {
        isRefreshing = true;
        refreshTokenSubject.next(null);

        console.warn('⚠️ Access token expirado, renovando...');

        // Intentar renovar el token
        return authService.refreshAccessToken().pipe(
          switchMap((response: any) => {
            isRefreshing = false;
            const newToken = response.accessToken;

            // Notificar a todas las peticiones pendientes
            refreshTokenSubject.next(newToken);

            console.log('✅ Token renovado, reintentando petición...');

            // Reintentar la petición original con el nuevo token
            return next(
              req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`,
                },
              }),
            );
          }),
          catchError((refreshError) => {
            isRefreshing = false;
            console.error('❌ Error renovando token:', refreshError);

            // Logout automático
            return authService.logout().pipe(
              tap({
                next: async () => {
                  await router.navigate(['/auth/login']);
                  const toast = await toastController.create({
                    message: 'Sesión expirada. Por favor inicia sesión nuevamente.',
                    duration: 3000,
                    color: 'warning',
                    position: 'top',
                  });
                  await toast.present();
                },
                error: () => {
                  router.navigate(['/auth/login']);
                },
              }),
              switchMap(() => throwError(() => refreshError))
            );
          }),
        );
      }

      // ========================================
      // CASO 2: Token expirado pero YA se está renovando
      // ========================================
      if (error.status === 401 && isRefreshing) {
        console.log('⏳ Esperando nuevo token para reintentar petición...');

        // Esperar a que se complete el refresh
        return refreshTokenSubject.pipe(
          filter((token) => token !== null),
          take(1),
          switchMap((token) => {
            // Reintentar con el nuevo token
            return next(
              req.clone({
                setHeaders: {
                  Authorization: `Bearer ${token}`,
                },
              }),
            );
          }),
          catchError((err) => {
            console.error('❌ Error reintentando petición:', err);
            return throwError(() => err);
          }),
        );
      }

      // ========================================
      // CASO 3: Otros errores 4xx/5xx
      // ========================================
      if (error.status === 0) {
        console.error('⚠️ Error de conexión - verifica tu internet');
      }

      return throwError(() => error);
    }),
  );
};
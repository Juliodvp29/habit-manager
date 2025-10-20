import { Injectable, inject } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { Observable, catchError, map, of, timeout } from 'rxjs';
import { JwtDecoderService } from '../decorator/jwt-decoder.service';
import { AuthService } from '../services/auth-service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  private authService = inject(AuthService);
  private router = inject(Router);
  private jwtDecoder = inject(JwtDecoderService);
  private toastController = inject(ToastController);

  canActivate(): boolean | UrlTree | Observable<boolean | UrlTree> {
    const token = this.authService.token();

    if (!token) {
      return this.router.createUrlTree(['/auth/login']);
    }

    // Verificar si el token está expirado
    if (this.jwtDecoder.isTokenExpired(token)) {
      console.warn('⚠️ Token expirado detectado en guard');

      // Intentar refrescar el token con timeout
      return this.authService.refreshAccessToken().pipe(
        timeout(10000), // Timeout de 10 segundos
        map(() => {
          console.log('✅ Token refrescado exitosamente');
          return true;
        }),
        catchError((error) => {
          console.error('❌ Error refrescando token:', error);

          // Mostrar toast de error (presentar en segundo plano)
          this.toastController.create({
            message: error.name === 'TimeoutError'
              ? '⚠️ Tiempo de espera agotado. Verifica tu conexión.'
              : '⚠️ No se pudo conectar al servidor.',
            duration: 4000,
            color: 'danger',
            position: 'top',
            buttons: [
              {
                text: 'Reintentar',
                role: 'cancel',
                handler: () => {
                  window.location.reload();
                }
              }
            ]
          }).then(toast => toast.present()).catch(() => {/* noop */ });

          // Hacer logout y redirigir
          this.authService.logout();
          return of(this.router.createUrlTree(['/auth/login']));
        })
      );
    }

    return true;
  }
}
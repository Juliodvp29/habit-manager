import { Injectable, inject } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { JwtDecoderService } from '../decorator/jwt-decoder.service';
import { AuthService } from '../services/auth-service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  private authService = inject(AuthService);
  private router = inject(Router);
  private jwtDecoder = inject(JwtDecoderService);

  canActivate(): boolean | UrlTree {
    const token = this.authService.token();

    if (!token) {
      return this.router.createUrlTree(['/auth/login']);
    }

    // Verificar si el token está expirado
    if (this.jwtDecoder.isTokenExpired(token)) {
      console.warn('⚠️ Token expirado detectado en guard');
      this.authService.logout();
      return this.router.createUrlTree(['/auth/login']);
    }

    return true;
  }
}
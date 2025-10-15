import { Injectable } from '@angular/core';

interface DecodedToken {
  sub: number;
  email?: string;
  type?: string;
  iat: number;
  exp: number;
}

@Injectable({
  providedIn: 'root'
})
export class JwtDecoderService {

  decode(token: string): DecodedToken | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decodificando token:', error);
      return null;
    }
  }

  isTokenExpired(token: string, offsetSeconds: number = 0): boolean {
    const decoded = this.decode(token);
    if (!decoded) return true;

    const expirationDate = new Date(0);
    expirationDate.setUTCSeconds(decoded.exp - offsetSeconds);

    return new Date() >= expirationDate;
  }

  getTokenExpirationTime(token: string): Date | null {
    const decoded = this.decode(token);
    if (!decoded) return null;

    const expirationDate = new Date(0);
    expirationDate.setUTCSeconds(decoded.exp);
    return expirationDate;
  }

  getTimeUntilExpiration(token: string): number {
    const expirationDate = this.getTokenExpirationTime(token);
    if (!expirationDate) return 0;

    return Math.max(0, expirationDate.getTime() - new Date().getTime());
  }
}

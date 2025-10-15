import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { refreshTokenInterceptor } from './app/core/interceptors/refresh-token.interceptor';
import { environment } from './environments/environment';

export function createTranslateLoader(http: HttpClient) {
  return {
    getTranslation: (lang: string): Observable<any> =>
      http.get(`./assets/i18n/${lang}.json`),
  };
}

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({ mode: 'ios' }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        authInterceptor,           // ← Agregar Authorization header
        refreshTokenInterceptor,   // ← Manejar 401 y renovar token (DEBE IR DESPUÉS)
      ]),
    ),
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'es',
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpClient],
        },
      }),
    ),
  ],
});
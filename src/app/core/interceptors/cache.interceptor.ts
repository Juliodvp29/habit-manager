import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, tap } from 'rxjs';

const cache = new Map<string, HttpResponse<any>>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  // Solo cachear GET requests
  if (req.method !== 'GET') {
    return next(req);
  }

  // Verificar si está en cache
  const cachedResponse = cache.get(req.url);
  if (cachedResponse) {
    console.log('📦 Sirviendo desde cache:', req.url);
    return of(cachedResponse.clone());
  }

  // Hacer request y guardar en cache
  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        cache.set(req.url, event.clone());

        // Limpiar cache después de CACHE_DURATION
        setTimeout(() => {
          cache.delete(req.url);
        }, CACHE_DURATION);
      }
    })
  );
};
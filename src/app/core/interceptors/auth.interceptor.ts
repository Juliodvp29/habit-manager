import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { catchError, throwError } from 'rxjs';
import { StorageService } from '../services/storage-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storageService = inject(StorageService);
  const router = inject(Router);
  const toastController = inject(ToastController);

  const token = storageService.getToken();
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        storageService.clearAll();
        router.navigate(['/auth/login']);

        toastController.create({
          message: 'Sesión expirada. Por favor inicia sesión nuevamente.',
          duration: 3000,
          color: 'warning',
          position: 'top'
        }).then(toast => toast.present());
      } else if (error.status === 0) {
        toastController.create({
          message: 'Error de conexión. Verifica tu internet.',
          duration: 3000,
          color: 'danger',
          position: 'top'
        }).then(toast => toast.present());
      }

      return throwError(() => error);
    })
  );
};
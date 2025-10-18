import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from './core/services/auth-service';
import { FcmNotificationService } from './core/services/fcm-notification-service';
import { ThemeService } from './core/services/theme-service';
import { TranslationService } from './core/services/translation-service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit, OnDestroy {

  private themeService = inject(ThemeService);
  private translationService = inject(TranslationService);
  private authService = inject(AuthService);
  private fcmService = inject(FcmNotificationService);
  private destroy$ = new Subject<void>();

  ngOnInit() {
    // Inicializar tema y traducción
    this.initializeApp();

    // Inicializar FCM listeners (siempre, independiente de auth)

    // Inicializar FCM cuando el usuario está autenticado
    this.setupFcmListeners();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.fcmService.cleanup();
  }

  /**
   * Inicializar aplicación
   */
  private initializeApp(): void {
    console.log('🚀 Inicializando aplicación...');
    // El tema se aplica automáticamente al iniciar el servicio
  }

  /**
   * Configurar listeners de FCM
   */
  private setupFcmListeners(): void {
    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isAuthenticated) => {
        if (isAuthenticated) {
          console.log('✅ Usuario autenticado, cargando FCM...');
          // Esperar un poco para que todo se inicialice
          setTimeout(() => {
            this.fcmService.loadNotifications();
          }, 1000);
        } else {
          console.log('🔐 Usuario no autenticado');
        }
      });
  }
}

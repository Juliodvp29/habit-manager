import { computed, inject, Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { BehaviorSubject, catchError, Observable, Subject, tap, throwError } from 'rxjs';
import { ApiService } from './api-service';
export interface PushNotification {
  title: string;
  body: string;
  notificationId?: string;
  type?: string;
  [key: string]: any;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  scheduledAt?: string;
  sentAt?: string;
}

export interface NotificationResponse {
  id: number;
  title: string;
  message: string;
  scheduledAt: string;
  sentAt?: string;
  isRead: boolean;
  readAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FcmNotificationService {

  private apiService = inject(ApiService);

  // Signals
  private notificationsSignal = signal<Notification[]>([]);
  private unreadCountSignal = signal<number>(0);
  private isLoadingSignal = signal<boolean>(false);

  // Computed
  public notifications = computed(() => this.notificationsSignal());
  public unreadCount = computed(() => this.unreadCountSignal());
  public isLoading = computed(() => this.isLoadingSignal());

  // Subjects
  private pushReceivedSubject = new Subject<PushNotification>();
  private pushActionSubject = new Subject<any>();
  private notificationUpdatedSubject = new BehaviorSubject<Notification | null>(null);

  // Observables públicos
  public pushReceived$ = this.pushReceivedSubject.asObservable();
  public pushAction$ = this.pushActionSubject.asObservable();
  public notificationUpdated$ = this.notificationUpdatedSubject.asObservable();

  constructor() {
    // Inicializar push notifications solo si estamos en plataforma nativa
    if (Capacitor.isNativePlatform()) {
      this.initializePushNotifications();
    } else {
      console.log('📱 Plataforma web detectada, saltando inicialización de push notifications');
    }
  }

  /**
   * Inicializar Push Notifications de Capacitor
   */

  private async initializePushNotifications(): Promise<void> {
    try {
      console.log('📱 Inicializando Push Notifications...');

      // Verificar si la plataforma soporta push notifications
      if (!Capacitor.isNativePlatform()) {
        console.warn('⚠️ Push notifications solo funcionan en plataformas nativas');
        return;
      }

      // 1. Solicitar permisos primero
      const permResult = await PushNotifications.requestPermissions();
      console.log('📱 Resultado de permisos:', permResult);

      if (permResult.receive !== 'granted') {
        console.error('❌ Permisos de notificaciones denegados');
        return;
      }

      // 2. Registrar con APNs / FCM
      await PushNotifications.register();
      console.log('✅ Push Notifications registrado');

      // 3. Configurar listeners
      await this.setupPushListeners();

      console.log('✅ Push Notifications inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando Push Notifications:', error);
    }
  }

  /**
   * Configurar listeners de push notifications
   */
  private async setupPushListeners(): Promise<void> {
    // Listener: Token registrado
    await PushNotifications.addListener('registration', (token) => {
      this.onPushRegistration(token);
    });

    // Listener: Error en registro
    await PushNotifications.addListener('registrationError', (error: any) => {
      console.error('❌ Error en registro de push:', error);
    });

    // Listener: Notificación recibida (app en foreground)
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      this.onPushNotificationReceived(notification);
    });

    // Listener: Notificación clickeada (app en background)
    await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      this.onPushNotificationActionPerformed(notification);
    });

    console.log('✅ Push listeners configurados');
  }


  /**
   * Manejador: Registro de token FCM
   */
  private onPushRegistration(token: any): void {
    const fcmToken = token.value;
    console.log('📱 FCM Token registrado:', fcmToken);

    // Registrar token en el servidor
    this.registerFcmToken(fcmToken);
  }

  /**
   * Manejador: Notificación push recibida
   */
  private onPushNotificationReceived(notification: any): void {
    console.log('📲 Push notification recibida:', notification);
    const pushData: PushNotification = {
      title: notification.title,
      body: notification.body,
      ...notification.data
    };

    this.pushReceivedSubject.next(pushData);

    // Emitir evento para que componentes puedan reaccionar
    window.dispatchEvent(
      new CustomEvent('pushNotificationReceived', { detail: pushData })
    );
  }

  /**
   * Manejador: Acción en notificación push
   */
  private onPushNotificationActionPerformed(notification: any): void {
    console.log('👆 Acción en notificación:', notification);
    this.pushActionSubject.next(notification);

    // Emitir evento para que componentes puedan reaccionar
    window.dispatchEvent(
      new CustomEvent('pushNotificationAction', { detail: notification })
    );
  }

  /**
   * Registrar FCM Token en el servidor
   */
  public registerFcmToken(fcmToken: string): Observable<any> {
    return this.apiService.post('/fcm/register', {
      token: fcmToken,
      deviceType: this.getDeviceType(),
      deviceName: this.getDeviceName()
    }).pipe(
      tap((response) => {
        console.log('✅ Token FCM registrado en servidor:', response);
      }),
      catchError((error) => {
        console.error('❌ Error registrando token FCM:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Desregistrar token FCM (logout)
   */
  public unregisterFcmToken(fcmToken: string): Observable<any> {
    return this.apiService.delete('/fcm/unregister', {
      body: { token: fcmToken }
    }).pipe(
      tap(() => {
        console.log('✅ Token FCM desregistrado');
      }),
      catchError((error) => {
        console.error('❌ Error desregistrando token:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener todas las notificaciones del usuario
   */
  public getNotifications(unreadOnly: boolean = false): Observable<NotificationResponse[]> {
    this.isLoadingSignal.set(true);
    const endpoint = unreadOnly
      ? '/notifications?unreadOnly=true'
      : '/notifications';

    return this.apiService.get<NotificationResponse[]>(endpoint).pipe(
      tap((response) => {
        const notifications: Notification[] = response.map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          isRead: n.isRead,
          createdAt: n.createdAt || n.scheduledAt,
          readAt: n.readAt,
          scheduledAt: n.scheduledAt,
          sentAt: n.sentAt
        }));

        this.notificationsSignal.set(notifications);
        this.updateUnreadCount();
        this.isLoadingSignal.set(false);
        console.log(`✅ ${notifications.length} notificaciones cargadas`);
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        console.error('❌ Error obteniendo notificaciones:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cargar notificaciones iniciales
   */
  public loadNotifications(): void {
    this.getNotifications(false).subscribe();
  }

  /**
   * Obtener solo notificaciones no leídas
   */
  public getUnreadNotifications(): Observable<NotificationResponse[]> {
    return this.getNotifications(true);
  }

  /**
   * Marcar notificación como leída
   */
  public markAsRead(notificationId: number): Observable<any> {
    return this.apiService.patch(`/notifications/${notificationId}/read`, {}).pipe(
      tap((response: any) => {
        // Actualizar signal local
        this.notificationsSignal.update(notifications =>
          notifications.map(n =>
            n.id === notificationId
              ? { ...n, isRead: true, readAt: new Date().toISOString() }
              : n
          )
        );
        this.updateUnreadCount();
        this.notificationUpdatedSubject.next(response);
        console.log(`✅ Notificación ${notificationId} marcada como leída`);
      }),
      catchError((error) => {
        console.error('❌ Error marcando como leída:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  public markAllAsRead(): Observable<any> {
    return this.apiService.patch('/notifications/read-all', {}).pipe(
      tap(() => {
        // Actualizar todos los signals
        this.notificationsSignal.update(notifications =>
          notifications.map(n => ({
            ...n,
            isRead: true,
            readAt: new Date().toISOString()
          }))
        );
        this.updateUnreadCount();
        console.log('✅ Todas las notificaciones marcadas como leídas');
      }),
      catchError((error) => {
        console.error('❌ Error marcando todas como leídas:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualizar conteo de no leídas
   */
  private updateUnreadCount(): void {
    const count = this.notificationsSignal().filter(n => !n.isRead).length;
    this.unreadCountSignal.set(count);
  }

  /**
   * Obtener tipo de dispositivo
   */
  private getDeviceType(): string {
    if (Capacitor.getPlatform() === 'ios') {
      return 'ios';
    } else if (Capacitor.getPlatform() === 'android') {
      return 'android';
    }
    return 'web';
  }

  /**
   * Obtener nombre del dispositivo
   */
  private getDeviceName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('iPhone')) {
      return 'iPhone';
    } else if (userAgent.includes('iPad')) {
      return 'iPad';
    } else if (userAgent.includes('Android')) {
      return 'Android Device';
    }
    return 'Web Browser';
  }

  /**
   * Limpiar recursos
   */
  public cleanup(): void {
    this.pushReceivedSubject.complete();
    this.pushActionSubject.complete();
    this.notificationUpdatedSubject.complete();
  }

}

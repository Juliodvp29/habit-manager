import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AlertController,
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ModalController,
  ToastController
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline,
  checkmarkDone,
  checkmarkDoneOutline,
  checkmarkOutline,
  chevronBackOutline,
  chevronForwardOutline,
  closeOutline,
  filterOutline,
  flameOutline,
  heartOutline,
  informationCircleOutline,
  notificationsOutline,
  refreshOutline,
  settingsOutline,
  shieldOutline,
  timeOutline,
  trashOutline,
  warningOutline
} from 'ionicons/icons';
import { Subject, takeUntil } from 'rxjs';
import { FcmNotificationService, Notification } from 'src/app/core/services/fcm-notification-service';
import { NotificationDetailModal } from './modal/notification-detail.modal';

type NotificationType = 'all' | 'unread' | 'read';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonBadge,
    IonSegment,
    IonSegmentButton
  ]
})
export class NotificationsPage implements OnInit, OnDestroy {

  private fcmService = inject(FcmNotificationService);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);
  private modalController = inject(ModalController);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  // Signals
  filterType = signal<NotificationType>('all');
  isRefreshing = signal(false);
  isDeleting = signal<number | null>(null);

  // Computed
  notifications = this.fcmService.notifications;
  unreadCount = this.fcmService.unreadCount;
  isLoading = this.fcmService.isLoading;

  filteredNotifications = computed(() => {
    const all = this.notifications();
    const filter = this.filterType();

    switch (filter) {
      case 'unread':
        return all.filter(n => !n.isRead);
      case 'read':
        return all.filter(n => n.isRead);
      default:
        return all;
    }
  });

  hasNotifications = computed(() => this.notifications().length > 0);
  hasFilteredNotifications = computed(() => this.filteredNotifications().length > 0);

  constructor() {
    addIcons({ chevronBackOutline, checkmarkDoneOutline, notificationsOutline, refreshOutline, filterOutline, flameOutline, checkmarkCircleOutline, timeOutline, heartOutline, shieldOutline, warningOutline, chevronForwardOutline, checkmarkOutline, trashOutline, closeOutline, informationCircleOutline, checkmarkDone, settingsOutline });
  }

  ngOnInit(): void {
    this.loadNotifications();
    this.setupPushListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cargar notificaciones
   */
  loadNotifications(): void {
    this.fcmService.loadNotifications();
  }

  /**
   * Refrescar notificaciones
   */
  async onRefresh(event: any): Promise<void> {
    this.isRefreshing.set(true);
    try {
      await new Promise(resolve => {
        this.fcmService.getNotifications(false)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.isRefreshing.set(false);
              event.detail.complete();
              this.showToast('Notificaciones actualizadas', 'success');
              resolve(true);
            },
            error: () => {
              this.isRefreshing.set(false);
              event.detail.complete();
              this.showToast('Error actualizando notificaciones', 'danger');
              resolve(false);
            }
          });
      });
    } catch (error) {
      this.isRefreshing.set(false);
      event.detail.complete();
    }
  }

  /**
   * Configurar listeners de push notifications
   */
  private setupPushListeners(): void {
    // Listener para cuando llega una push
    this.fcmService.pushReceived$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification) => {
        console.log('Notificación push recibida:', notification);
        // Recargar notificaciones si la app está abierta
        this.loadNotifications();
      });

    // Listener para actualizaciones de notificaciones
    this.fcmService.notificationUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification) => {
        if (notification) {
          console.log('Notificación actualizada:', notification);
        }
      });
  }

  /**
   * Marcar notificación como leída
   */
  markAsRead(notification: Notification, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (notification.isRead) {
      return;
    }

    this.fcmService.markAsRead(notification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showToast('Notificación marcada como leída', 'success');
        },
        error: () => {
          this.showToast('Error marcando como leída', 'danger');
        }
      });
  }

  /**
   * Marcar todas como leídas
   */
  async markAllAsRead(): Promise<void> {
    const unreadCount = this.notifications().filter(n => !n.isRead).length;

    if (unreadCount === 0) {
      this.showToast('No hay notificaciones sin leer', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Marcar como leídas',
      message: `¿Marcar ${unreadCount} notificación(es) como leída(s)?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Marcar todo',
          handler: () => {
            this.fcmService.markAllAsRead()
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: () => {
                  this.showToast('Todas marcadas como leídas', 'success');
                },
                error: () => {
                  this.showToast('Error marcando como leídas', 'danger');
                }
              });
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Eliminar notificación (local - solo UI)
   */
  async deleteNotification(notification: Notification, event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation();
    }

    const alert = await this.alertController.create({
      header: 'Eliminar notificación',
      message: '¿Estás seguro que deseas eliminar esta notificación?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.isDeleting.set(notification.id);
            // Simular eliminación con delay
            setTimeout(() => {
              this.showToast('Notificación eliminada', 'success');
              this.isDeleting.set(null);
            }, 500);
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Ver detalle de notificación
   */
  async viewNotification(notification: Notification): Promise<void> {
    if (!notification.isRead) {
      this.markAsRead(notification);
    }

    const modal = await this.modalController.create({
      component: NotificationDetailModal,
      componentProps: {
        notification: notification
      }
    });

    await modal.present();
  }

  /**
   * Obtener color según tipo de notificación
   */
  getNotificationColor(type?: string): string {
    switch (type) {
      case 'achievement':
      case 'streak':
        return 'success';
      case 'reminder':
        return 'primary';
      case 'motivational':
        return 'secondary';
      case 'security':
      case 'warning':
        return 'warning';
      case 'error':
        return 'danger';
      default:
        return 'medium';
    }
  }

  /**
   * Obtener icono según tipo de notificación
   */
  getNotificationIcon(type?: string): string {
    switch (type) {
      case 'achievement':
      case 'streak':
        return 'flameOutline';
      case 'reminder':
        return 'timeOutline';
      case 'motivational':
        return 'checkmarkCircleOutline';
      case 'security':
      case 'warning':
        return 'warningOutline';
      case 'info':
        return 'informationCircleOutline';
      default:
        return 'notificationsOutline';
    }
  }

  /**
   * Obtener etiqueta de tipo
   */
  getTypeLabel(type?: string): string {
    switch (type) {
      case 'achievement':
        return '🏆 Logro';
      case 'streak':
        return '🔥 Racha';
      case 'reminder':
        return '⏰ Recordatorio';
      case 'motivational':
        return '💪 Motivación';
      case 'security':
        return '🔒 Seguridad';
      case 'warning':
        return '⚠️ Advertencia';
      case 'info':
        return 'ℹ️ Información';
      default:
        return '📬 Notificación';
    }
  }

  /**
   * Formatear fecha relativa
   */
  getRelativeTime(date: string): string {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Justo ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;

    return notificationDate.toLocaleDateString('es-ES');
  }

  /**
   * Mostrar toast
   */
  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'top'
    });
    await toast.present();
  }

  /**
   * Manejar cambio de filtro
   */
  onFilterChange(event: any): void {
    const value = event.detail.value;
    if (value && ['all', 'unread', 'read'].includes(value)) {
      this.filterType.set(value as NotificationType);
    }
  }

  /**
   * Volver atrás
   */
  goBack(): void {
    this.router.navigate(['/tabs/profile']);
  }

}

import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline,
  close,
  flameOutline,
  heartOutline,
  informationCircleOutline,
  shieldOutline,
  timeOutline,
  warningOutline
} from 'ionicons/icons';
import { Notification } from 'src/app/core/services/fcm-notification-service';

@Component({
  selector: 'app-notification-detail',
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="dismiss()">
            <ion-icon name="close" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Detalle de Notificación</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="max-w-2xl mx-auto">
        <!-- Icono y tipo de notificación -->
        <div class="flex items-center gap-3 mb-6">
          <div 
            class="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            [ngClass]="'bg-' + getNotificationColor() + '-100 dark:bg-' + getNotificationColor() + '-900/30'"
          >
            <ion-icon 
              [name]="getNotificationIcon()" 
              class="text-3xl"
              [ngClass]="'text-' + getNotificationColor() + '-500'"
            ></ion-icon>
          </div>
          
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span 
                class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                [ngClass]="'bg-' + getNotificationColor() + '-100 dark:bg-' + getNotificationColor() + '-900/30 text-' + getNotificationColor() + '-700 dark:text-' + getNotificationColor() + '-400'"
              >
                {{ getTypeLabel() }}
              </span>
              @if (!notification.isRead) {
              <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                No leída
              </span>
              }
            </div>
            <p class="text-xs text-neutral-500 dark:text-neutral-400">
              {{ getRelativeTime() }}
            </p>
          </div>
        </div>

        <!-- Título -->
        <h2 class="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-4">
          {{ notification.title }}
        </h2>

        <!-- Mensaje completo -->
        <div class="prose dark:prose-invert max-w-none">
          <p class="text-base text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
            {{ notification.message }}
          </p>
        </div>

        <!-- Metadatos -->
        <div class="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-neutral-500 dark:text-neutral-400 mb-1">Fecha de creación</p>
              <p class="text-neutral-900 dark:text-neutral-50 font-medium">
                {{ formatFullDate(notification.createdAt) }}
              </p>
            </div>
            @if (notification.scheduledAt) {
            <div>
              <p class="text-neutral-500 dark:text-neutral-400 mb-1">Programada para</p>
              <p class="text-neutral-900 dark:text-neutral-50 font-medium">
                {{ formatFullDate(notification.scheduledAt) }}
              </p>
            </div>
            }
            @if (notification.sentAt) {
            <div>
              <p class="text-neutral-500 dark:text-neutral-400 mb-1">Enviada</p>
              <p class="text-neutral-900 dark:text-neutral-50 font-medium">
                {{ formatFullDate(notification.sentAt) }}
              </p>
            </div>
            }
            @if (notification.readAt) {
            <div>
              <p class="text-neutral-500 dark:text-neutral-400 mb-1">Leída</p>
              <p class="text-neutral-900 dark:text-neutral-50 font-medium">
                {{ formatFullDate(notification.readAt) }}
              </p>
            </div>
            }
          </div>
        </div>

        <!-- Botón de cerrar -->
        <div class="mt-8">
          <ion-button 
            expand="block" 
            (click)="dismiss()"
            shape="round"
            size="large"
          >
            Cerrar
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    ion-content {
      --background: var(--ion-background-color);
    }

    .prose {
      max-width: 100%;
    }

    .prose p {
      margin-bottom: 1em;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonTitle,
    IonContent,
    IonIcon
  ]
})
export class NotificationDetailModal {
  @Input() notification!: Notification;

  constructor(private modalController: ModalController) {
    addIcons({
      close,
      flameOutline,
      checkmarkCircleOutline,
      timeOutline,
      heartOutline,
      shieldOutline,
      warningOutline,
      informationCircleOutline
    });
  }

  dismiss() {
    this.modalController.dismiss();
  }

  getNotificationColor(): string {
    switch (this.notification.type) {
      case 'achievement':
      case 'streak':
        return 'green';
      case 'reminder':
        return 'blue';
      case 'motivational':
        return 'purple';
      case 'security':
      case 'warning':
        return 'yellow';
      case 'error':
        return 'red';
      default:
        return 'gray';
    }
  }

  getNotificationIcon(): string {
    switch (this.notification.type) {
      case 'achievement':
      case 'streak':
        return 'flame-outline';
      case 'reminder':
        return 'time-outline';
      case 'motivational':
        return 'checkmark-circle-outline';
      case 'security':
      case 'warning':
        return 'warning-outline';
      case 'info':
        return 'information-circle-outline';
      default:
        return 'information-circle-outline';
    }
  }

  getTypeLabel(): string {
    switch (this.notification.type) {
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

  getRelativeTime(): string {
    const now = new Date();
    const notificationDate = new Date(this.notification.createdAt);
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

  formatFullDate(date: string): string {
    return new Date(date).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
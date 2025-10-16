import { Component, computed, inject } from '@angular/core';
import { IonBadge, IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { barChartOutline, checkmarkCircleOutline, homeOutline, notificationsOutline, personOutline } from 'ionicons/icons';
import { FcmNotificationService } from 'src/app/core/services/fcm-notification-service';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,
  imports: [IonBadge, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel]
})
export class TabsPage {

  private fcmService = inject(FcmNotificationService);

  // Computed value para el badge de notificaciones
  unreadNotificationCount = computed(() => this.fcmService.unreadCount());

  constructor() {
    addIcons({
      homeOutline,
      checkmarkCircleOutline,
      barChartOutline,
      personOutline,
      notificationsOutline
    });
  }

  ngOnInit() {
    // Cargar notificaciones al iniciar la página de tabs
    this.fcmService.loadNotifications();
  }

}

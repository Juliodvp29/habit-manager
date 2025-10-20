import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonToolbar,
  ToastController
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  add,
  addCircleOutline,
  addOutline,
  checkmark,
  checkmarkCircle,
  cloudOfflineOutline,
  flame,
  refreshOutline,
  repeatOutline
} from 'ionicons/icons';
import { catchError, of, timeout } from 'rxjs';
import { HabitDashboard } from 'src/app/core/models/habit.models';
import { AuthService } from 'src/app/core/services/auth-service';
import { HabitService } from 'src/app/core/services/habit-service';
import { TranslationService } from 'src/app/core/services/translation-service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonIcon,
    IonSpinner,
    IonButton,
    IonFab,
    IonFabButton,
    TranslateModule]
})
export class DashboardPage implements OnInit, OnDestroy {

  private habitService = inject(HabitService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);
  private translationService = inject(TranslationService);

  // Signals
  habits = signal<HabitDashboard[]>([]);
  isLoading = signal(false);
  isRefreshing = signal(false);
  processingHabitId = signal<number | null>(null);
  hasConnectionError = signal(false); // NUEVO: Estado de conexión

  private readonly CACHE_KEY = 'dashboard_cache';
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  completedHabits = computed(() =>
    this.habits().filter(h => h.todayCompleted).length
  );

  constructor() {
    addIcons({
      refreshOutline,
      checkmarkCircle,
      flame,
      addCircleOutline,
      addOutline,
      checkmark,
      repeatOutline,
      add,
      cloudOfflineOutline // NUEVO: Icono para modo offline
    });
  }

  ngOnInit() {
    this.loadDashboard();
  }

  ngOnDestroy() {
    // No guardar cache al salir para evitar datos obsoletos
  }

  private loadFromCache(): void {
    // Deshabilitar carga desde cache para evitar datos obsoletos
    console.log('📦 Cache deshabilitado para evitar datos obsoletos');
  }

  private saveToCache(): void {
    try {
      const cache = {
        data: this.habits(),
        timestamp: Date.now()
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('❌ Error guardando cache:', error);
    }
  }

  loadDashboard() {
    this.isLoading.set(true);
    this.hasConnectionError.set(false);

    this.habitService.getDashboard().pipe(
      timeout(10000), // Timeout de 10 segundos
      catchError((error) => {
        console.error('❌ Error loading dashboard:', error);
        this.hasConnectionError.set(true);
        this.showConnectionError();
        return of([]);
      })
    ).subscribe({
      next: (data) => {
        if (data.length > 0 || !this.hasConnectionError()) {
          this.habits.set(data);
          // No guardar cache para evitar datos obsoletos
          this.hasConnectionError.set(false);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  async showConnectionError() {
    const alert = await this.alertController.create({
      header: '⚠️ Sin conexión',
      message: 'No se pudo conectar al servidor. Mostrando datos guardados localmente.',
      buttons: [
        {
          text: 'Reintentar',
          handler: () => {
            this.loadDashboard();
          }
        },
        {
          text: 'Aceptar',
          role: 'cancel'
        }
      ]
    });
    await alert.present();
  }

  refreshDashboard() {
    this.isRefreshing.set(true);
    this.hasConnectionError.set(false);

    this.habitService.getDashboard().pipe(
      timeout(10000),
      catchError((error) => {
        console.error('❌ Error refreshing:', error);
        this.hasConnectionError.set(true);
        this.showToast('No se pudo actualizar. Sin conexión al servidor.', 'warning');
        return of([]);
      })
    ).subscribe({
      next: (data) => {
        if (data.length > 0 || !this.hasConnectionError()) {
          this.habits.set(data);
          // No guardar cache para evitar datos obsoletos
          this.showToast('Dashboard actualizado', 'success');
        }
        this.isRefreshing.set(false);
      },
      error: () => {
        this.isRefreshing.set(false);
      }
    });
  }

  getUserFirstName(): string {
    const user = this.authService.currentUser();
    if (!user) return 'Usuario';
    const firstName = user.fullName?.split(' ')[0];
    return firstName || user.email.split('@')[0];
  }

  getCurrentDate(): string {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const today = new Date();
    const dayName = days[today.getDay()];
    const day = today.getDate();
    const month = months[today.getMonth()];

    return `${dayName}, ${day} de ${month}`;
  }

  getCompletedCount(): number {
    return this.completedHabits();
  }

  getProgressPercentage(): number {
    const total = this.habits().length;
    if (total === 0) return 0;
    return Math.round((this.completedHabits() / total) * 100);
  }

  getFrequencyLabel(frequency: string): string {
    const labels: Record<string, string> = {
      'daily': 'Diario',
      'weekly': 'Semanal',
      'monthly': 'Mensual'
    };
    return labels[frequency] || frequency;
  }



  toggleHabitCompletion(event: Event, habit: HabitDashboard) {
    event.stopPropagation();

    if (habit.todayCompleted) {
      this.showToast('Ya completaste este hábito hoy', 'warning');
      return;
    }

    this.processingHabitId.set(habit.id);

    this.habitService.logProgress(habit.id, {
      progress: 1,
      notes: ''
    }).pipe(
      timeout(10000),
      catchError((error) => {
        console.error('❌ Error logging progress:', error);
        this.processingHabitId.set(null);
        this.showToast('Error al registrar progreso. Verifica tu conexión.', 'danger');
        return of(null);
      })
    ).subscribe({
      next: (response) => {
        if (!response) return;

        console.log('✅ Progreso registrado:', response);

        // IMPORTANTE: Usar ChangeDetectorRef para forzar detección de cambios
        // Actualizar estado local INMEDIATAMENTE y de forma inmutable
        const updatedHabits = this.habits().map(h => {
          if (h.id === habit.id) {
            return {
              ...h,
              todayCompleted: true,
              todayProgress: h.todayProgress + 1,
              currentStreak: (h.currentStreak || 0) + 1
            };
          }
          return h;
        });

        this.habits.set(updatedHabits);
        this.processingHabitId.set(null);
        // No guardar cache después de completar un hábito para evitar conflictos
        this.showToast('¡Hábito completado! 🎉', 'success');
      }
    });
  }

  viewHabitDetails(habitId: number) {
    this.router.navigate(['/tabs/habits', habitId]);
  }

  navigateToCreateHabit() {
    this.router.navigate(['/tabs/habits/create']);
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
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
  hasConnectionError = signal(false);

  // NUEVO: Claves para cache
  private readonly CACHE_KEY = 'dashboard_cache';
  private readonly CACHE_TIMESTAMP_KEY = 'dashboard_cache_timestamp';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

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
      cloudOfflineOutline
    });
  }

  ngOnInit() {
    // Primero intentar cargar desde cache
    this.loadFromCache();

    // Luego hacer request al servidor
    this.loadDashboard();
  }

  ngOnDestroy() {
    // Guardar en cache al salir
    this.saveToCache();
  }

  /**
   * NUEVO: Cargar datos desde cache si están frescos
   */
  private loadFromCache(): void {
    try {
      const cachedData = localStorage.getItem(this.CACHE_KEY);
      const cacheTimestamp = localStorage.getItem(this.CACHE_TIMESTAMP_KEY);

      if (cachedData && cacheTimestamp) {
        const timestamp = parseInt(cacheTimestamp, 10);
        const now = Date.now();
        const isFresh = (now - timestamp) < this.CACHE_DURATION;

        if (isFresh) {
          const habits = JSON.parse(cachedData) as HabitDashboard[];
          console.log('📦 Cargando desde cache:', habits.length, 'hábitos');
          this.habits.set(habits);
        } else {
          console.log('📦 Cache expirado, limpiando...');
          this.clearCache();
        }
      }
    } catch (error) {
      console.error('❌ Error cargando cache:', error);
      this.clearCache();
    }
  }

  /**
   * NUEVO: Guardar datos en cache
   */
  private saveToCache(): void {
    try {
      const data = this.habits();
      if (data.length > 0) {
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(this.CACHE_TIMESTAMP_KEY, Date.now().toString());
        console.log('💾 Guardado en cache:', data.length, 'hábitos');
      }
    } catch (error) {
      console.error('❌ Error guardando cache:', error);
    }
  }

  /**
   * NUEVO: Limpiar cache
   */
  private clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
    localStorage.removeItem(this.CACHE_TIMESTAMP_KEY);
  }

  loadDashboard() {
    this.isLoading.set(true);
    this.hasConnectionError.set(false);

    this.habitService.getDashboard().pipe(
      timeout(10000),
      catchError((error) => {
        console.error('❌ Error loading dashboard:', error);
        this.hasConnectionError.set(true);

        // Si hay datos en cache, usar esos
        const cachedData = this.habits();
        if (cachedData.length > 0) {
          this.showToast('Usando datos guardados. Sin conexión al servidor.', 'warning');
        } else {
          this.showConnectionError();
        }

        return of([]);
      })
    ).subscribe({
      next: (data) => {
        if (data.length > 0) {
          this.habits.set(data);
          // Guardar en cache inmediatamente
          this.saveToCache();
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
        if (data.length > 0) {
          this.habits.set(data);
          // Guardar en cache después de refresh
          this.saveToCache();
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

        // Actualizar estado local INMEDIATAMENTE de forma inmutable
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

        // ⭐ CRÍTICO: Guardar en cache INMEDIATAMENTE después de completar
        this.saveToCache();

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
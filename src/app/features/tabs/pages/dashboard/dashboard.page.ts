import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
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
  flame,
  refreshOutline,
  repeatOutline
} from 'ionicons/icons';
import { HabitDashboard } from 'src/app/core/models/habit.models';
import { AuthService } from 'src/app/core/services/auth-service';
import { HabitService } from 'src/app/core/services/habit-service';
import { TranslationService } from 'src/app/core/services/translation-service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
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
export class DashboardPage implements OnInit {

  private habitService = inject(HabitService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastController = inject(ToastController);
  private translationService = inject(TranslationService);

  // Signals
  habits = signal<HabitDashboard[]>([]);
  isLoading = signal(false);
  isRefreshing = signal(false);
  processingHabitId = signal<number | null>(null);

  // Computed values
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
      add
    });
  }

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.isLoading.set(true);
    this.habitService.getDashboard().subscribe({
      next: (data) => {
        this.habits.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.showToast('Error al cargar el dashboard', 'danger');
        console.error('Error loading dashboard:', error);
      }
    });
  }

  refreshDashboard() {
    this.isRefreshing.set(true);
    this.habitService.getDashboard().subscribe({
      next: (data) => {
        this.habits.set(data);
        this.isRefreshing.set(false);
        this.showToast('Dashboard actualizado', 'success');
      },
      error: (error) => {
        this.isRefreshing.set(false);
        this.showToast('Error al actualizar', 'danger');
        console.error('Error refreshing dashboard:', error);
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
    }).subscribe({
      next: () => {
        // Actualizar estado local
        this.habits.update(habits =>
          habits.map(h => h.id === habit.id
            ? { ...h, todayCompleted: true, todayProgress: h.todayProgress + 1 }
            : h
          )
        );
        this.processingHabitId.set(null);
        this.showToast('¡Hábito completado! 🎉', 'success');
      },
      error: (error) => {
        this.processingHabitId.set(null);
        this.showToast('Error al registrar progreso', 'danger');
        console.error('Error logging progress:', error);
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

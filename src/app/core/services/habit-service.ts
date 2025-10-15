import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateHabitDto, Habit, HabitDashboard, HabitLog, LogProgressDto, UpdateHabitDto } from '../models/habit.models';
import { ApiService } from './api-service';

@Injectable({
  providedIn: 'root'
})
export class HabitService {

  private apiService = inject(ApiService);

  // Obtener todos los hábitos
  getAllHabits(): Observable<Habit[]> {
    return this.apiService.get<Habit[]>('/habits');
  }

  // Obtener dashboard con progreso de hoy
  getDashboard(): Observable<HabitDashboard[]> {
    return this.apiService.get<HabitDashboard[]>('/habits/dashboard');
  }

  // Obtener un hábito por ID
  getHabitById(id: number): Observable<Habit> {
    return this.apiService.get<Habit>(`/habits/${id}`);
  }

  // Crear nuevo hábito
  createHabit(data: CreateHabitDto): Observable<Habit> {
    return this.apiService.post<Habit>('/habits', data);
  }

  // Actualizar hábito
  updateHabit(id: number, data: UpdateHabitDto): Observable<Habit> {
    return this.apiService.patch<Habit>(`/habits/${id}`, data);
  }

  // Eliminar hábito
  deleteHabit(id: number): Observable<void> {
    return this.apiService.delete<void>(`/habits/${id}`);
  }

  // Registrar progreso diario
  logProgress(habitId: number, data: LogProgressDto): Observable<HabitLog> {
    return this.apiService.post<HabitLog>(`/habits/${habitId}/log`, data);
  }

  // Obtener estadísticas
  getStats(habitId: number, days: number = 30): Observable<any> {
    return this.apiService.get<any>(`/habits/${habitId}/stats?days=${days}`);
  }
}

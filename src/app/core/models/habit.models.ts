export interface Habit {
  id: number;
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  targetCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface HabitDashboard extends Habit {
  todayCompleted: boolean;
  todayProgress: number;
  currentStreak?: number;
}

export interface HabitLog {
  id: number;
  habitId: number;
  logDate: string;
  progress: number;
  notes?: string;
  completed: boolean;
  createdAt: string;
}

export interface CreateHabitDto {
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  targetCount: number;
}

export interface UpdateHabitDto {
  title?: string;
  description?: string;
  frequency?: 'daily' | 'weekly' | 'monthly';
  targetCount?: number;
  isActive?: boolean;
}

export interface LogProgressDto {
  progress: number;
  notes?: string;
}
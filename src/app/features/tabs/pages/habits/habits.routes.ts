import { Routes } from '@angular/router';

export const HABITS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./habits.page').then(m => m.HabitsPage)
  },
  {
    path: 'create',
    loadComponent: () => import('./create-habit/create-habit.page').then(m => m.CreateHabitPage)
  },
  {
    path: ':id',
    loadComponent: () => import('./habit-detail/habit-detail.page').then(m => m.HabitDetailPage)
  }
];
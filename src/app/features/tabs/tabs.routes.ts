import { Routes } from '@angular/router';
import { AuthGuard } from 'src/app/core/guards/auth.guard';

export const TABS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    loadComponent: () => import('./tabs.page').then(m => m.TabsPage),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage)
      },
      {
        path: 'habits',
        loadComponent: () => import('./pages/habits/habits.page').then(m => m.HabitsPage)
      },
      {
        path: 'stats',
        loadComponent: () => import('./pages/stats/stats.page').then(m => m.StatsPage)
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage)
      }
    ]
  },

];
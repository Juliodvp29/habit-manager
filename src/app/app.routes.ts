import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tabs',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'tabs',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/tabs/tabs.routes').then(m => m.TABS_ROUTES)
  },
  {
    path: 'notifications',
    canActivate: [AuthGuard],
    loadComponent: () => import('./features/notifications/notifications.page').then(m => m.NotificationsPage)
  },
  {
    path: '**',
    redirectTo: 'tabs'
  }
];
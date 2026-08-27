import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
    title: 'UnderTheHood — See How Software Really Works',
  },
  {
    path: 'explore/:id',
    loadComponent: () =>
      import('./features/coming-soon-page/coming-soon-page').then((m) => m.ComingSoonPage),
    title: 'Coming Soon — UnderTheHood',
  },
  { path: '**', redirectTo: '' },
];

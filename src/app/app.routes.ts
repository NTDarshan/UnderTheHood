import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
    title: 'UnderTheHood — See How Software Really Works',
  },
  {
    path: 'explore/http',
    loadComponent: () => import('./features/http/http-page/http-page').then((m) => m.HttpPage),
    title: 'UnderTheHood — HTTP Under the Hood',
  },
  {
    path: 'explore/routing',
    loadComponent: () => import('./features/routing/routing-page/routing-page').then((m) => m.RoutingPage),
    title: 'UnderTheHood — Routing in Backend',
  },
  {
    path: 'explore/:id',
    loadComponent: () =>
      import('./features/coming-soon-page/coming-soon-page').then((m) => m.ComingSoonPage),
    title: 'Coming Soon — UnderTheHood',
  },
  { path: '**', redirectTo: '' },
];

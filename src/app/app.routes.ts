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
    path: 'explore/serialization',
    loadComponent: () =>
      import('./features/serialization/serialization-page/serialization-page').then((m) => m.SerializationPage),
    title: 'UnderTheHood — Serialization & Deserialization',
  },
  {
    path: 'explore/auth',
    loadComponent: () => import('./features/auth/auth-page/auth-page').then((m) => m.AuthPage),
    title: 'UnderTheHood — Authentication & Authorization',
  },
  {
    path: 'explore/validation',
    loadComponent: () => import('./features/validation/validation-page/validation-page').then((m) => m.ValidationPage),
    title: 'UnderTheHood — Validation & Transformation',
  },
  {
    path: 'explore/backend-layers',
    loadComponent: () =>
      import('./features/backend-layers/backend-layers-page/backend-layers-page').then((m) => m.BackendLayersPage),
    title: 'UnderTheHood — Controllers, Services, Repositories & Middleware',
  },
  {
    path: 'explore/:id',
    loadComponent: () =>
      import('./features/coming-soon-page/coming-soon-page').then((m) => m.ComingSoonPage),
    title: 'Coming Soon — UnderTheHood',
  },
  { path: '**', redirectTo: '' },
];

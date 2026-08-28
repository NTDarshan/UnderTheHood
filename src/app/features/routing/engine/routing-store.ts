import { Injectable, computed, signal } from '@angular/core';
import { HttpMethod, MatchResult, RouteDef, matchRoute } from './route-matcher';

export const DEFAULT_ROUTES: RouteDef[] = [
  { id: 'r1', method: 'GET', pattern: '/users', description: 'List users', enabled: true },
  { id: 'r2', method: 'GET', pattern: '/users/me', description: 'Current user', enabled: true },
  { id: 'r3', method: 'GET', pattern: '/users/{id:int}', description: 'Get user by ID', enabled: true },
  { id: 'r4', method: 'POST', pattern: '/users', description: 'Create user', enabled: true },
  { id: 'r5', method: 'GET', pattern: '/users/search', description: 'Search users', enabled: true },
  { id: 'r6', method: 'GET', pattern: '/users/{userId:int}/orders', description: 'Get user orders', enabled: true },
  { id: 'r7', method: 'GET', pattern: '/users/{userId:int}/orders/{orderId:int}', description: 'Get one order', enabled: true },
  { id: 'r8', method: 'GET', pattern: '/products/{id:int}/reviews', description: 'Get product reviews', enabled: true },
  { id: 'r9', method: '*', pattern: '/{*path}', description: 'Catch-all fallback', enabled: true },
];

export const QUICK_REQUESTS: { method: HttpMethod; url: string }[] = [
  { method: 'GET', url: '/users' },
  { method: 'GET', url: '/users/123' },
  { method: 'GET', url: '/users/me' },
  { method: 'GET', url: '/users/search?q=bro' },
  { method: 'POST', url: '/users' },
  { method: 'GET', url: '/products/123/reviews' },
  { method: 'GET', url: '/unknown-page' },
];

let nextId = 100;

@Injectable({ providedIn: 'root' })
export class RoutingStore {
  readonly routes = signal<RouteDef[]>(DEFAULT_ROUTES.map((r) => ({ ...r })));
  readonly method = signal<HttpMethod>('GET');
  readonly url = signal<string>('/users/123?role=admin&page=2');

  readonly result = computed<MatchResult>(() => matchRoute(this.routes(), this.method(), this.url()));

  setRequest(method: HttpMethod, url: string): void {
    this.method.set(method);
    this.url.set(url);
  }

  addRoute(): void {
    this.routes.update((rs) => [
      ...rs,
      { id: `r${nextId++}`, method: 'GET', pattern: '/new-route/{id}', description: 'New route', enabled: true },
    ]);
  }

  removeRoute(id: string): void {
    this.routes.update((rs) => rs.filter((r) => r.id !== id));
  }

  updateRoute(id: string, patch: Partial<RouteDef>): void {
    this.routes.update((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  toggleEnabled(id: string): void {
    this.routes.update((rs) => rs.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  }

  moveUp(id: string): void {
    this.routes.update((rs) => {
      const i = rs.findIndex((r) => r.id === id);
      if (i <= 0) return rs;
      const next = [...rs];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next;
    });
  }

  moveDown(id: string): void {
    this.routes.update((rs) => {
      const i = rs.findIndex((r) => r.id === id);
      if (i === -1 || i >= rs.length - 1) return rs;
      const next = [...rs];
      [next[i + 1], next[i]] = [next[i], next[i + 1]];
      return next;
    });
  }

  reset(): void {
    this.routes.set(DEFAULT_ROUTES.map((r) => ({ ...r })));
  }
}

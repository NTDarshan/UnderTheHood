import { Component, computed, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';
import { RouteDef, matchRoute } from '../../engine/route-matcher';

const INITIAL: RouteDef[] = [
  { id: 'a', method: 'GET', pattern: '/users/{id}', description: 'Get user by ID', enabled: true },
  { id: 'b', method: 'GET', pattern: '/users/me', description: 'Current user', enabled: true },
];

@Component({
  selector: 'app-route-ordering-demo',
  standalone: true,
  imports: [ExplainSimply],
  template: `
    <section class="lab-section" id="route-ordering">
      <div class="container">
        <p class="lab-index">ROUTING / 07 — ROUTE ORDERING</p>
        <h2 class="lab-title">Routing is not "find something that looks similar."</h2>
        <p class="lab-lede">
          It's a checklist read top to bottom. The first route that matches wins — even if a more specific
          route further down would have been the "obviously correct" one.
        </p>

        <app-explain-simply>
          Imagine two signs at a fork in the road. If the first sign says "Anyone, go left" and the second,
          more specific sign says "If your name is Sam, go right" — a person named Sam who reads left to
          right still goes left, because they stopped reading after the first sign that applied to them.
        </app-explain-simply>

        <p class="scenario mono">Request: <span class="accent">GET /users/me</span></p>

        <ol class="order-list">
          @for (r of routes(); track r.id; let i = $index) {
            <li
              class="order-item"
              [class.is-winner]="winner()?.id === r.id"
              [class.is-shadowed]="winner() && winner()?.id !== r.id"
            >
              <span class="order-num mono">{{ i + 1 }}</span>
              <span class="order-pattern mono">{{ r.method }} {{ r.pattern }}</span>
              <span class="order-desc">{{ r.description }}</span>
              <span class="order-controls">
                <button type="button" class="order-btn" (click)="moveUp(i)" [disabled]="i === 0" aria-label="Move up">↑</button>
                <button type="button" class="order-btn" (click)="moveDown(i)" [disabled]="i === routes().length - 1" aria-label="Move down">↓</button>
              </span>
              @if (winner()?.id === r.id) {
                <span class="order-tag win-tag mono">WINS</span>
              } @else if (winner()) {
                <span class="order-tag shadow-tag mono">NEVER REACHED</span>
              }
            </li>
          }
        </ol>

        <div class="verdict lab-panel">
          <p class="verdict-heading mono">{{ verdictHeading() }}</p>
          <p class="verdict-body">{{ verdictBody() }}</p>
        </div>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn" (click)="setOrder(['a', 'b'])">Generic First (the bug)</button>
          <button type="button" class="lab-btn lab-btn-primary" (click)="setOrder(['b', 'a'])">Specific First (the fix)</button>
        </div>
      </div>
    </section>
  `,
  styles: `
    .scenario {
      margin-top: 24px;
      font-size: 0.9375rem;
      color: var(--text-muted);
    }

    .accent {
      color: var(--accent);
    }

    .order-list {
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .order-item {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-strong);
      background: var(--surface-raised);
      transition: border-color 0.3s ease, opacity 0.3s ease, background 0.3s ease;
    }

    .order-item.is-winner {
      border-color: var(--accent-2);
      background: color-mix(in srgb, var(--accent-2) 8%, var(--surface-raised));
    }

    .order-item.is-shadowed {
      opacity: 0.55;
    }

    .order-num {
      color: var(--text-faint);
      width: 16px;
    }

    .order-pattern {
      color: var(--accent);
      font-size: 0.875rem;
    }

    .order-desc {
      color: var(--text-faint);
      font-size: 0.8125rem;
    }

    .order-controls {
      display: flex;
      gap: 4px;
      margin-left: auto;
    }

    .order-btn {
      width: 26px;
      height: 26px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      background: var(--surface-elevated);
      color: var(--text-faint);
    }

    .order-btn:disabled {
      opacity: 0.3;
    }

    .order-tag {
      font-size: 0.625rem;
      letter-spacing: 0.06em;
      padding: 4px 8px;
      border-radius: 999px;
    }

    .win-tag {
      color: var(--accent-2);
      border: 1px solid var(--accent-2-dim);
    }

    .shadow-tag {
      color: var(--text-faint);
      border: 1px solid var(--border-strong);
    }

    .verdict {
      margin-top: 24px;
    }

    .verdict-heading {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--accent);
    }

    .verdict-body {
      margin-top: 8px;
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.6;
    }
  `,
})
export class RouteOrderingDemo {
  protected readonly routes = signal<RouteDef[]>(INITIAL.map((r) => ({ ...r })));

  protected readonly result = computed(() => matchRoute(this.routes(), 'GET', '/users/me'));
  protected readonly winner = computed(() => this.result().route);

  protected readonly verdictHeading = computed(() => {
    const w = this.winner();
    if (!w) return 'No route matched.';
    return w.pattern === '/users/me' ? 'Correct behavior' : 'This is the bug';
  });

  protected readonly verdictBody = computed(() => {
    const w = this.winner();
    if (!w) return '';
    if (w.pattern === '/users/me') {
      return '"/users/me" is listed first, so the router checks it before the generic "/users/{id}" route. It matches exactly, and wins.';
    }
    return '"/users/{id}" is listed first. Its dynamic segment "{id}" happily accepts the literal text "me" as a value — so the router matches here, treating id = "me", and never even reaches the more specific "/users/me" route below it.';
  });

  moveUp(index: number): void {
    if (index === 0) return;
    this.routes.update((rs) => {
      const next = [...rs];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  moveDown(index: number): void {
    this.routes.update((rs) => {
      if (index >= rs.length - 1) return rs;
      const next = [...rs];
      [next[index + 1], next[index]] = [next[index], next[index + 1]];
      return next;
    });
  }

  setOrder(order: string[]): void {
    this.routes.update((rs) => order.map((id) => rs.find((r) => r.id === id)!).filter(Boolean));
  }
}

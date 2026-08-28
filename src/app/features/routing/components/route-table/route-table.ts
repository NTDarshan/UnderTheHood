import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RoutingStore } from '../../engine/routing-store';
import { HttpMethod } from '../../engine/route-matcher';

const METHODS: (HttpMethod | '*')[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', '*'];

@Component({
  selector: 'app-route-table',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="table-wrap">
      <table class="route-table mono">
        <thead>
          <tr>
            <th>#</th>
            <th>ON</th>
            <th>METHOD</th>
            <th>PATTERN</th>
            <th>DESCRIPTION</th>
            <th>ORDER</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (r of store.routes(); track r.id; let i = $index) {
            <tr [class.is-disabled]="!r.enabled" [class.is-winner]="store.result().route?.id === r.id">
              <td class="idx">{{ i + 1 }}</td>
              <td>
                <button
                  type="button"
                  class="enable-toggle"
                  [class.is-on]="r.enabled"
                  (click)="store.toggleEnabled(r.id)"
                  [attr.aria-label]="r.enabled ? 'Disable route' : 'Enable route'"
                >
                  {{ r.enabled ? '●' : '○' }}
                </button>
              </td>
              <td>
                <select class="cell-input method-select" [ngModel]="r.method" (ngModelChange)="store.updateRoute(r.id, { method: $event })">
                  @for (m of methods; track m) {
                    <option [value]="m">{{ m }}</option>
                  }
                </select>
              </td>
              <td>
                <input
                  class="cell-input pattern-input"
                  type="text"
                  [ngModel]="r.pattern"
                  (ngModelChange)="store.updateRoute(r.id, { pattern: $event })"
                  spellcheck="false"
                />
              </td>
              <td>
                <input
                  class="cell-input desc-input"
                  type="text"
                  [ngModel]="r.description"
                  (ngModelChange)="store.updateRoute(r.id, { description: $event })"
                />
              </td>
              <td class="order-cell">
                <button type="button" class="order-btn" (click)="store.moveUp(r.id)" [disabled]="i === 0" aria-label="Move up">↑</button>
                <button type="button" class="order-btn" (click)="store.moveDown(r.id)" [disabled]="i === store.routes().length - 1" aria-label="Move down">↓</button>
              </td>
              <td>
                <button type="button" class="remove-btn" (click)="store.removeRoute(r.id)" aria-label="Delete route">✕</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
    <div class="lab-btn-row table-actions">
      <button type="button" class="lab-btn" (click)="store.addRoute()">+ Add Route</button>
      <button type="button" class="lab-btn" (click)="store.reset()">Reset Table</button>
    </div>
  `,
  styles: `
    .table-wrap {
      overflow-x: auto;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
    }

    .route-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.75rem;
      min-width: 720px;
    }

    .route-table th {
      text-align: left;
      padding: 8px 10px;
      color: var(--text-faint);
      font-weight: 500;
      letter-spacing: 0.06em;
      font-size: 0.625rem;
      background: var(--surface-elevated);
      border-bottom: 1px solid var(--border);
    }

    .route-table td {
      padding: 6px 8px;
      border-bottom: 1px solid var(--border);
      vertical-align: middle;
    }

    .route-table tr.is-disabled td {
      opacity: 0.4;
    }

    .route-table tr.is-winner {
      background: color-mix(in srgb, var(--accent) 10%, transparent);
    }

    .route-table tr.is-winner td:first-child {
      box-shadow: inset 3px 0 0 var(--accent);
    }

    .idx {
      color: var(--text-faint);
      width: 24px;
    }

    .enable-toggle {
      color: var(--text-faint);
      font-size: 0.875rem;
      width: 20px;
    }

    .enable-toggle.is-on {
      color: var(--accent-2);
    }

    .cell-input {
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      color: var(--text);
      padding: 4px 6px;
      font-family: inherit;
      font-size: 0.75rem;
      width: 100%;
    }

    .method-select {
      width: 80px;
    }

    .pattern-input {
      min-width: 220px;
      color: var(--accent-2);
    }

    .desc-input {
      min-width: 140px;
      color: var(--text-muted);
    }

    .order-cell {
      display: flex;
      gap: 2px;
    }

    .order-btn,
    .remove-btn {
      width: 22px;
      height: 22px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      background: var(--surface-elevated);
      color: var(--text-faint);
      font-size: 0.75rem;
    }

    .order-btn:disabled {
      opacity: 0.3;
    }

    .remove-btn:hover {
      border-color: var(--danger);
      color: var(--danger);
    }

    .table-actions {
      margin-top: 12px;
    }
  `,
})
export class RouteTable {
  protected readonly store = inject(RoutingStore);
  protected readonly methods = METHODS;
}

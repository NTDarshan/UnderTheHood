import { Component, computed, signal } from '@angular/core';
import { evaluateMiddlewareOrder } from '../../engine/backend-simulator';

interface MwItem {
  id: string;
  label: string;
}

const ITEMS: MwItem[] = [
  { id: 'logging', label: 'Logging' },
  { id: 'cors', label: 'CORS' },
  { id: 'authentication', label: 'Authentication' },
  { id: 'rate-limiting', label: 'Rate Limiting' },
  { id: 'routing', label: 'Routing' },
  { id: 'error-handling', label: 'Error Handling' },
];

@Component({
  selector: 'app-middleware-ordering-lab',
  standalone: true,
  template: `
    <section class="lab-section" id="ordering-lab">
      <div class="container">
        <p class="lab-index">BACKEND LAYERS / 06 — MIDDLEWARE ORDER LAB</p>
        <h2 class="lab-title">Reorder the pipeline. Watch what breaks.</h2>
        <p class="lab-lede">Move a stage up or down. There is no single universal order for every framework — but ordering still defines behavior.</p>

        <div class="lab-panel">
          <ol class="order-list mono">
            @for (id of order(); track id; let i = $index) {
              <li class="order-row">
                <span class="order-index">{{ i + 1 }}</span>
                <span class="order-label">{{ labelFor(id) }}</span>
                <span class="order-controls">
                  <button type="button" class="mini-btn" [disabled]="i === 0" (click)="move(i, -1)" aria-label="Move up">↑</button>
                  <button type="button" class="mini-btn" [disabled]="i === order().length - 1" (click)="move(i, 1)" aria-label="Move down">↓</button>
                </span>
              </li>
            }
          </ol>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn" (click)="reset()">Reset Order</button>
          </div>

          @if (warnings().length > 0) {
            <div class="warnings">
              @for (w of warnings(); track w.id) {
                <p class="warning-line">⚠ {{ w.message }}</p>
              }
            </div>
          } @else {
            <p class="lab-note">No ordering hazards detected for this arrangement.</p>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .order-list { display: flex; flex-direction: column; gap: 6px; }
    .order-row { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-sm); }
    .order-index { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 1px solid var(--border-strong); color: var(--text-faint); font-size: 0.6875rem; flex-shrink: 0; }
    .order-label { flex: 1; font-size: 0.8125rem; color: var(--text); font-weight: 600; }
    .order-controls { display: flex; gap: 4px; }
    .mini-btn { background: var(--surface-elevated); border: 1px solid var(--border-strong); border-radius: var(--radius-sm); color: var(--text-muted); width: 26px; height: 26px; font-size: 0.75rem; }
    .mini-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent-strong); }
    .mini-btn:disabled { opacity: 0.3; cursor: not-allowed; }

    .warnings { margin-top: 20px; display: flex; flex-direction: column; gap: 8px; }
    .warning-line { font-size: 0.8125rem; color: var(--accent); line-height: 1.5; }
  `,
})
export class MiddlewareOrderingLab {
  private readonly items = ITEMS;
  protected readonly order = signal<string[]>(ITEMS.map((i) => i.id));
  protected readonly warnings = computed(() => evaluateMiddlewareOrder(this.order()));

  labelFor(id: string): string {
    return this.items.find((i) => i.id === id)?.label ?? id;
  }

  move(index: number, dir: -1 | 1): void {
    const arr = [...this.order()];
    const target = index + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    this.order.set(arr);
  }

  reset(): void {
    this.order.set(this.items.map((i) => i.id));
  }
}

import { Component, signal } from '@angular/core';
import { runOrderPipeline } from '../../engine/validation-simulator';

@Component({
  selector: 'app-real-world-order-flow',
  standalone: true,
  template: `
    <section class="lab-section" id="real-world-order">
      <div class="container">
        <p class="lab-index">VALIDATION / 46 — REAL-WORLD E-COMMERCE SCENARIO</p>
        <h2 class="lab-title">POST /orders, end to end. Click any stage.</h2>

        <pre class="lab-code mono">POST /orders

{{ '{' }}
  "productId": "101",
  "quantity": "2",
  "couponCode": " SAVE20 "
{{ '}' }}</pre>

        <div class="stage-list mono">
          @for (s of result.stages; track s.id) {
            <button type="button" class="stage-btn" [class.is-active]="selected() === s.id" (click)="selected.set(s.id)">
              <span class="stage-icon ok">✓</span>
              <span class="stage-name">{{ s.label }}</span>
            </button>
          }
        </div>

        @if (activeDetail()) {
          <div class="lab-panel detail-panel">
            <p>{{ activeDetail() }}</p>
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .stage-list { margin-top: 28px; display: flex; flex-wrap: wrap; gap: 8px; }
    .stage-btn { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface-raised); color: var(--text-muted); font-size: 0.8125rem; }
    .stage-btn.is-active { border-color: var(--accent); color: var(--accent-strong); }
    .stage-icon.ok { color: var(--accent-2); }

    .detail-panel { margin-top: 20px; }
    .detail-panel p { font-size: 0.9375rem; color: var(--text-muted); line-height: 1.55; }
  `,
})
export class RealWorldOrderFlow {
  protected readonly result = runOrderPipeline({ productId: '101', quantity: '2', couponCode: ' SAVE20 ' }, true, 1000, 20);
  protected readonly selected = signal<string | null>(null);

  protected activeDetail(): string {
    const s = this.result.stages.find((x) => x.id === this.selected());
    return s?.detail ?? '';
  }
}

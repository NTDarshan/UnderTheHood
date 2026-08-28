import { Component, computed, signal } from '@angular/core';

interface Dependency {
  id: string;
  label: string;
  detail: string;
}

const DEPENDENCIES: Dependency[] = [
  { id: 'customer', label: 'Customer Repository', detail: 'Loads the customer placing the order.' },
  { id: 'inventory', label: 'Inventory Repository', detail: 'Checks stock levels for the requested product.' },
  { id: 'pricing', label: 'Pricing Service', detail: 'Calculates price, applying any active discounts.' },
  { id: 'order', label: 'Order Repository', detail: 'Persists the new order.' },
  { id: 'notification', label: 'Notification Service', detail: 'Triggers the confirmation email/event after commit.' },
];

@Component({
  selector: 'app-service-layer-visualizer',
  standalone: true,
  template: `
    <section class="lab-section" id="service-layer">
      <div class="container">
        <p class="lab-index">BACKEND LAYERS / 09 — SERVICE LAYER</p>
        <h2 class="lab-title">The service is the business brain. It has never heard of HTTP.</h2>

        <div class="lab-panel">
          <div class="signature-row mono">
            <span class="sig-bad">✕ createOrder(request, response)</span>
            <span class="sig-good">✓ createOrder(command)</span>
          </div>
          <p class="lab-note">A service that needs an HTTP request/response object is a service that can't be reused, tested, or called from anything other than a web framework.</p>

          <div class="use-case-chain mono">
            <div class="uc-node">validate business conditions</div>
            <div class="lab-flow-arrow">↓</div>
            <div class="uc-node">check inventory</div>
            <div class="lab-flow-arrow">↓</div>
            <div class="uc-node">calculate price</div>
            <div class="lab-flow-arrow">↓</div>
            <div class="uc-node">apply discount</div>
            <div class="lab-flow-arrow">↓</div>
            <div class="uc-node">save order</div>
            <div class="lab-flow-arrow">↓</div>
            <div class="uc-node">trigger email/event</div>
          </div>

          <p class="lab-index" style="margin-top:32px">ORCHESTRATION — CLICK A DEPENDENCY</p>
          <div class="dep-grid">
            @for (d of dependencies; track d.id) {
              <button type="button" class="dep-btn mono" [class.is-selected]="selectedId() === d.id" (click)="selectedId.set(d.id)">{{ d.label }}</button>
            }
          </div>
          <p class="lab-note">{{ selected().detail }}</p>

          <div class="myth-box">
            <p class="myth-title mono">MYTH</p>
            <p class="myth-text">"Service means any class that contains code."</p>
            <p class="myth-title mono is-good">REALITY</p>
            <p class="myth-text">A service represents application behavior, business orchestration, or a use case — not a dumping ground for miscellaneous logic. A 3000-line service with 40 dependencies that "does everything" is a god object, not a good service.</p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .signature-row { display: flex; flex-direction: column; gap: 8px; font-size: 0.875rem; }
    .sig-bad { color: var(--danger); }
    .sig-good { color: var(--accent-2); }

    .use-case-chain { margin-top: 28px; display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .uc-node { font-size: 0.8125rem; color: var(--text-muted); padding: 8px 18px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface); min-width: 220px; text-align: center; }

    .dep-grid { margin-top: 16px; display: flex; flex-wrap: wrap; gap: 8px; }
    .dep-btn { font-size: 0.75rem; padding: 8px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface-elevated); color: var(--text-muted); }
    .dep-btn:hover { border-color: var(--accent-dim); color: var(--text); }
    .dep-btn.is-selected { border-color: var(--accent); color: var(--accent-strong); }

    .myth-box { margin-top: 32px; padding: 18px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .myth-title { font-size: 0.6875rem; color: var(--danger); letter-spacing: 0.06em; }
    .myth-title.is-good { color: var(--accent-2); margin-top: 14px; }
    .myth-text { font-size: 0.875rem; color: var(--text-muted); margin-top: 6px; line-height: 1.6; }
  `,
})
export class ServiceLayerVisualizer {
  protected readonly dependencies = DEPENDENCIES;
  protected readonly selectedId = signal('pricing');
  protected readonly selected = computed(() => this.dependencies.find((d) => d.id === this.selectedId())!);
}

import { Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-webhook-production-checklist',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wh-scene" id="wh-checklist">
      <div class="container">
        <p class="lab-index mono">31 — PRODUCTION CHECKLIST</p>
        <h2 class="lab-title">Before this ships</h2>
        <p class="lab-lede">Two lists — one for receiving webhooks, one for building your own. Check off what's already true of your system.</p>

        <div class="lab-panel two-col">
          <div class="checklist-col">
            <p class="body-label mono">RECEIVER — {{ receiverChecked() }}/{{ receiverItems.length }}</p>
            @for (item of receiverItems; track item; let i = $index) {
              <label class="check-row">
                <input type="checkbox" [checked]="receiverState()[i]" (change)="toggleReceiver(i)" />
                <span>{{ item }}</span>
              </label>
            }
          </div>
          <div class="checklist-col">
            <p class="body-label mono">PROVIDER — {{ providerChecked() }}/{{ providerItems.length }}</p>
            @for (item of providerItems; track item; let i = $index) {
              <label class="check-row">
                <input type="checkbox" [checked]="providerState()[i]" (change)="toggleProvider(i)" />
                <span>{{ item }}</span>
              </label>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .wh-scene { --success: #4ade80; --pending: var(--accent); --retry: #fbbf24; --failure: var(--danger); --security: #a78bfa; --info: var(--accent-2); }
    .two-col { display: grid; grid-template-columns: 1fr; gap: 32px; }
    @media (min-width: 720px) { .two-col { grid-template-columns: 1fr 1fr; } }
    .body-label { font-size: 0.6875rem; color: var(--info); letter-spacing: 0.05em; margin: 0 0 14px; }
    .check-row { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; font-size: 0.875rem; color: var(--text-muted); cursor: pointer; }
    .check-row input { accent-color: var(--accent); margin-top: 3px; flex-shrink: 0; }
  `,
})
export class WebhookProductionChecklist {
  protected readonly receiverItems = [
    'HTTPS endpoint',
    'Verify authenticity of every request',
    'Verify the raw request body correctly',
    'Validate the timestamp',
    'Protect against replay',
    'Make processing idempotent',
    'Return an acknowledgement promptly',
    'Process heavy work asynchronously',
    'Handle duplicates',
    'Handle out-of-order events where necessary',
    'Set timeouts',
    'Log delivery IDs',
    'Trace event IDs',
    'Monitor failures',
  ];

  protected readonly providerItems = [
    'Durable event storage',
    'Outbox pattern where appropriate',
    'Dispatcher',
    'Delivery tracking',
    'Retry policy',
    'Exponential backoff',
    'Jitter',
    'Dead-letter / exhausted delivery handling',
    'Manual replay',
    'Secret rotation',
    'Event versioning',
    'Observability',
  ];

  protected readonly receiverState = signal<boolean[]>(new Array(this.receiverItems.length).fill(false));
  protected readonly providerState = signal<boolean[]>(new Array(this.providerItems.length).fill(false));

  protected readonly receiverChecked = computed(() => this.receiverState().filter(Boolean).length);
  protected readonly providerChecked = computed(() => this.providerState().filter(Boolean).length);

  protected toggleReceiver(i: number): void {
    this.receiverState.update((s) => s.map((v, idx) => (idx === i ? !v : v)));
  }

  protected toggleProvider(i: number): void {
    this.providerState.update((s) => s.map((v, idx) => (idx === i ? !v : v)));
  }
}

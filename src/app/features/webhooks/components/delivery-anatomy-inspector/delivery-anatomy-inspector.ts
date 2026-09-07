import { Component, signal } from '@angular/core';

interface DField { key: string; value: string; explain: string; }

const FIELDS: DField[] = [
  { key: 'delivery_id', value: 'dlv_9f21ac', explain: 'Unique id for this specific delivery attempt — distinct from the event id, since one event may be delivered (and retried) multiple times.' },
  { key: 'event_id', value: 'evt_3f9a2b', explain: 'Identifies the underlying event. Stays the same across every retry of the same event — this is the key your idempotency check uses.' },
  { key: 'type', value: 'order.created', explain: 'The event type — tells your handler which code path should process this payload.' },
  { key: 'attempt', value: '1', explain: 'Which delivery attempt this is. Increments on each retry, and is often used to compute the next backoff delay.' },
  { key: 'timestamp', value: '2026-09-07T09:14:02Z', explain: 'When the event occurred (or was created), used for freshness checks against replay attacks.' },
  { key: 'target_url', value: 'https://api.yourapp.com/webhooks', explain: 'The URL this delivery was sent to — the one you registered when you configured the webhook.' },
  { key: 'timeout_ms', value: '5000', explain: 'How long the provider will wait for your response before treating this attempt as failed.' },
  { key: 'status', value: 'delivered', explain: 'The current lifecycle state of this delivery — pending, sending, delivered, failed, retrying, or exhausted.' },
  { key: 'response_code', value: '200', explain: 'The HTTP status your endpoint returned for this attempt, recorded for debugging and observability.' },
  { key: 'response_time_ms', value: '134', explain: 'How long your endpoint took to respond — a rising trend here is often the first sign of a fast-ack violation.' },
];

@Component({
  selector: 'app-delivery-anatomy-inspector',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wh-scene" id="wh-delivery-anatomy">
      <div class="container">
        <p class="lab-index mono">08 — ANATOMY OF A DELIVERY RECORD</p>
        <h2 class="lab-title">Every delivery is a record, not just a request</h2>
        <p class="lab-lede">
          Providers (and any system you build yourself) track deliveries as structured records. Click a field to
          see what it's for.
        </p>

        <div class="lab-panel">
          <div class="record-grid">
            @for (f of fields; track f.key) {
              <button type="button" class="record-field mono" [class.is-selected]="selected() === f.key" (click)="select(f.key)">
                <span class="field-k">{{ f.key }}</span>
                <span class="field-v">{{ f.value }}</span>
              </button>
            }
          </div>
          @if (selectedField(); as f) {
            <div class="field-explain">
              <p class="body-text">{{ f.explain }}</p>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .wh-scene { --success: #4ade80; --pending: var(--accent); --retry: #fbbf24; --failure: var(--danger); --security: #a78bfa; --info: var(--accent-2); }
    .record-grid { display: grid; grid-template-columns: 1fr; gap: 8px; }
    @media (min-width: 640px) { .record-grid { grid-template-columns: 1fr 1fr; } }
    .record-field {
      all: unset; cursor: pointer; box-sizing: border-box; display: flex; justify-content: space-between; gap: 10px;
      padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface);
      font-size: 0.75rem; transition: all 0.2s ease;
    }
    .record-field:hover { border-color: var(--pending); }
    .record-field.is-selected { border-color: var(--pending); background: color-mix(in srgb, var(--pending) 12%, var(--surface)); }
    .field-k { color: var(--text-faint); }
    .field-v { color: var(--text); }
    .field-explain { margin-top: 16px; padding: 14px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .body-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; margin: 0; }
  `,
})
export class DeliveryAnatomyInspector {
  protected readonly fields = FIELDS;
  protected readonly selected = signal<string | null>('event_id');

  protected select(key: string): void {
    this.selected.set(this.selected() === key ? null : key);
  }

  protected selectedField(): DField | undefined {
    return FIELDS.find((f) => f.key === this.selected());
  }
}

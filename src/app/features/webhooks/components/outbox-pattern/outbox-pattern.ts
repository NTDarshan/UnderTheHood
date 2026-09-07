import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-outbox-pattern',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wh-scene" id="wh-outbox">
      <div class="container">
        <p class="lab-index mono">21 — THE OUTBOX PATTERN</p>
        <h2 class="lab-title">Don't let a webhook send become a second, unsafe write</h2>
        <p class="lab-lede">
          If you update a business row and separately call out to send a webhook, those are two independent
          operations. One can succeed while the other fails — that's the dual-write problem.
        </p>

        <div class="lab-panel">
          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-danger" (click)="runDualWrite()">SIMULATE DUAL WRITE (no outbox)</button>
            <button type="button" class="lab-btn lab-btn-primary" (click)="runOutbox()">SIMULATE WITH OUTBOX</button>
          </div>

          <div class="log-panel mono" aria-live="polite">
            @for (l of log(); track $index) {
              <div class="log-line" [attr.data-kind]="l.kind">{{ l.text }}</div>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .wh-scene { --success: #4ade80; --pending: var(--accent); --retry: #fbbf24; --failure: var(--danger); --security: #a78bfa; --info: var(--accent-2); }
    .log-panel { margin-top: 20px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; min-height: 120px; display: flex; flex-direction: column; gap: 6px; }
    .log-line { font-size: 0.75rem; color: var(--text-muted); }
    .log-line[data-kind='ok'] { color: var(--success); }
    .log-line[data-kind='warn'] { color: var(--failure); }
  `,
})
export class OutboxPattern {
  protected readonly log = signal<{ text: string; kind: 'info' | 'ok' | 'warn' }[]>([]);

  protected runDualWrite(): void {
    this.log.set([
      { text: 'BEGIN — update orders SET status = \'paid\' WHERE id = ord_881', kind: 'info' },
      { text: 'COMMIT — order row updated successfully.', kind: 'ok' },
      { text: 'Separately: call webhook dispatcher to notify customer…', kind: 'info' },
      { text: 'Dispatcher process crashes / network drops before the send completes.', kind: 'warn' },
      { text: 'Result: DB says paid, but the webhook is gone forever — no record it was ever supposed to be sent.', kind: 'warn' },
    ]);
  }

  protected runOutbox(): void {
    this.log.set([
      { text: 'BEGIN transaction', kind: 'info' },
      { text: 'UPDATE orders SET status = \'paid\' WHERE id = ord_881', kind: 'info' },
      { text: 'INSERT INTO outbox_events (event) VALUES (\'order.paid\', ...)', kind: 'info' },
      { text: 'COMMIT — both writes succeed or fail together, atomically.', kind: 'ok' },
      { text: 'Dispatcher polls the outbox table separately and sends the event — even if it crashes, the row is still there to retry from.', kind: 'ok' },
    ]);
  }
}

import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-webhook-vs-api-and-when-not-to-use',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wh-scene" id="wh-vs-api">
      <div class="container">
        <p class="lab-index mono">26 — WHEN A WEBHOOK IS THE WRONG TOOL</p>
        <h2 class="lab-title">Webhooks are a notification, not a source of truth</h2>
        <p class="lab-lede">A webhook says "something happened." It is not designed to answer "what is the current state?" or "what did I miss?" — for those, you still need an API or an event log.</p>

        <div class="lab-panel">
          <div class="table-wrap">
            <table class="cmp-table mono">
              <thead><tr><th></th><th>Webhook</th><th>API</th></tr></thead>
              <tbody>
                <tr><td>Initiator</td><td>Provider pushes</td><td>You pull, on demand</td></tr>
                <tr><td>Direction</td><td>Provider → you</td><td>You → provider</td></tr>
                <tr><td>Timing</td><td>Near event time</td><td>Whenever you ask</td></tr>
                <tr><td>Purpose</td><td>"Something happened"</td><td>"What is true right now"</td></tr>
                <tr><td>Failure model</td><td>May be missed, duplicated, delayed</td><td>Request either succeeds or you know it failed</td></tr>
                <tr><td>Retry model</td><td>Provider-controlled</td><td>You control retries</td></tr>
              </tbody>
            </table>
          </div>

          <p class="body-label mono">USE CASE &rarr; RIGHT TOOL</p>
          <div class="usecase-row">
            @for (u of useCases; track u.case) {
              <button type="button" class="usecase-chip mono" [class.is-selected]="selected() === u.case" (click)="selected.set(u.case)">{{ u.case }}</button>
            }
          </div>
          @if (selectedTool(); as t) {
            <p class="lab-note">{{ t }}</p>
          }

          <p class="lab-note">The two complement each other: a webhook tells you something happened right away; a durable API or event log lets you reconcile, replay, or answer "what did I miss?" if a webhook was ever lost.</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .wh-scene { --success: #4ade80; --pending: var(--accent); --retry: #fbbf24; --failure: var(--danger); --security: #a78bfa; --info: var(--accent-2); }
    .table-wrap { overflow-x: auto; margin-bottom: 24px; }
    .cmp-table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
    .cmp-table th, .cmp-table td { text-align: left; padding: 10px 14px; border-bottom: 1px solid var(--border); white-space: nowrap; }
    .cmp-table th { color: var(--text-faint); }
    .cmp-table td:first-child { color: var(--text-muted); }
    .body-label { font-size: 0.6875rem; color: var(--info); letter-spacing: 0.05em; margin: 20px 0 10px; }
    .usecase-row { display: flex; flex-wrap: wrap; gap: 8px; }
    .usecase-chip { all: unset; cursor: pointer; font-size: 0.75rem; padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface); color: var(--text-muted); }
    .usecase-chip:hover { border-color: var(--pending); }
    .usecase-chip.is-selected { border-color: var(--pending); color: var(--accent-strong); background: color-mix(in srgb, var(--pending) 12%, var(--surface)); }
  `,
})
export class WebhookVsApiAndWhenNotToUse {
  protected readonly useCases = [
    { case: 'Current account balance', tool: 'API query — you need the true current state on demand, not the last event you happened to receive.' },
    { case: 'Historical reconciliation', tool: 'Event log / durable API — replaying or auditing history needs a durable source, not a fire-and-forget push.' },
    { case: 'Periodic sync with a provider that has no webhooks', tool: 'Polling — still the right, and sometimes only, option when push isn\'t available.' },
    { case: 'Notify a customer the moment a payment clears', tool: 'Webhook — this is exactly the near-immediate, event-driven case webhooks are built for.' },
  ];
  protected readonly selected = signal<string | null>(null);

  protected selectedTool(): string | null {
    return this.useCases.find((u) => u.case === this.selected())?.tool ?? null;
  }
}

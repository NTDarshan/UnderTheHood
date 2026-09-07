import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-webhook-endpoint-anatomy',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wh-scene" id="wh-endpoint-anatomy">
      <div class="container">
        <p class="lab-index mono">05 — YOUR ENDPOINT'S JOB</p>
        <h2 class="lab-title">What a webhook receiver actually has to do</h2>
        <p class="lab-lede">
          A webhook endpoint isn't just "an API route that accepts JSON." It has a specific, ordered job: verify,
          validate, deduplicate, acknowledge, then process.
        </p>

        <div class="lab-panel two-col">
          <div class="facts-col">
            <div class="fact-row"><span class="fact-k mono">Method</span><span class="fact-v mono">POST</span></div>
            <div class="fact-row"><span class="fact-k mono">Content-Type</span><span class="fact-v mono">application/json (provider-defined)</span></div>
            <div class="fact-row"><span class="fact-k mono">Auth</span><span class="fact-v mono">signature header, not a session/cookie</span></div>
            <div class="fact-row"><span class="fact-k mono">Response</span><span class="fact-v mono">2xx as fast as possible</span></div>
            <div class="fact-row"><span class="fact-k mono">Timeout</span><span class="fact-v mono">provider-enforced, often a few seconds</span></div>
          </div>

          <div class="flow-col">
            <div class="flow-step mono" [class.is-active]="step() === 0" (click)="step.set(0)">1. ROUTING — match the registered path</div>
            <div class="flow-step mono" [class.is-active]="step() === 1" (click)="step.set(1)">2. AUTH — verify the signature against the raw body</div>
            <div class="flow-step mono" [class.is-active]="step() === 2" (click)="step.set(2)">3. VALIDATION — parse and sanity-check the payload shape</div>
            <div class="flow-step mono" [class.is-active]="step() === 3" (click)="step.set(3)">4. IDEMPOTENCY — has this event id been seen before?</div>
            <div class="flow-step mono" [class.is-active]="step() === 4" (click)="step.set(4)">5. ACK — return 2xx immediately</div>
            <div class="flow-step mono" [class.is-active]="step() === 5" (click)="step.set(5)">6. PROCESS — do the actual work, usually asynchronously</div>
          </div>
        </div>
        <p class="lab-note">Click a step to read why it exists — the panel below updates.</p>
        <div class="lab-panel step-detail">
          <p class="body-text">{{ detail() }}</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .wh-scene { --success: #4ade80; --pending: var(--accent); --retry: #fbbf24; --failure: var(--danger); --security: #a78bfa; --info: var(--accent-2); }
    .two-col { display: grid; grid-template-columns: 1fr; gap: 24px; }
    @media (min-width: 760px) { .two-col { grid-template-columns: 1fr 1.3fr; } }
    .fact-row { display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 0.8125rem; }
    .fact-row:last-child { border-bottom: none; }
    .fact-k { color: var(--text-faint); }
    .fact-v { color: var(--text); }
    .flow-col { display: flex; flex-direction: column; gap: 8px; }
    .flow-step { cursor: pointer; font-size: 0.75rem; padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface); color: var(--text-muted); transition: all 0.2s ease; }
    .flow-step:hover { border-color: var(--pending); color: var(--accent-strong); }
    .flow-step.is-active { border-color: var(--pending); color: var(--accent-strong); background: color-mix(in srgb, var(--pending) 12%, var(--surface)); }
    .step-detail { margin-top: 16px; }
    .body-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; margin: 0; }
  `,
})
export class WebhookEndpointAnatomy {
  protected readonly step = signal(0);

  private readonly DETAILS = [
    'The router matches the exact path you registered with the provider — one endpoint often handles many event types, dispatched by the "type" field in the body.',
    'Before trusting anything in the payload, the signature is checked against the raw request body using the shared secret — this happens before parsing, not after.',
    'Once authenticity is established, the payload is parsed and checked for the fields your handler actually needs — malformed or unexpected payloads are rejected safely.',
    'The event id is checked against a store of already-processed ids. Providers commonly redeliver, so this step is what keeps "already handled" from becoming "handled twice."',
    'The endpoint responds 2xx immediately once the event is safely recorded — it does not wait for the full business logic to finish, because the provider is usually watching a short timeout.',
    'The real work — updating records, sending notifications, charging things — happens after the ack, typically handed off to a background worker so a slow step can\'t cause a timeout.',
  ];

  protected detail(): string {
    return this.DETAILS[this.step()];
  }
}

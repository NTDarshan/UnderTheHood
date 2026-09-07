import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-trust-problem',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wh-scene" id="wh-trust-problem">
      <div class="container">
        <p class="lab-index mono">14 — THE TRUST PROBLEM</p>
        <h2 class="lab-title">Your endpoint is a public URL. Anyone can POST to it.</h2>
        <p class="lab-lede">
          A webhook endpoint has to accept unauthenticated inbound traffic by design — there's no user session to
          check. So how does your server know a request claiming to be from Stripe actually is?
        </p>

        <div class="lab-panel">
          <div class="attacker-demo">
            <button type="button" class="lab-btn lab-btn-danger" (click)="sendFake()">SEND A FAKE PAYLOAD</button>
            @if (sent()) {
              <pre class="lab-code mono">POST /webhooks HTTP/1.1
Content-Type: application/json

{{ '{' }}
  "type": "order.refunded",
  "data": {{ '{' }} "orderId": "ord_881", "amount": 999999 {{ '}' }}
{{ '}' }}</pre>
              <p class="lab-note lab-note-warn">This looks exactly like a real event. Without a way to verify who sent it, your server has no basis to trust or reject it.</p>
            }
          </div>

          <div class="concepts-row">
            <div class="concept-card">
              <p class="concept-title mono">AUTHENTICITY</p>
              <p class="concept-body">Did this request actually come from the provider, not an attacker or a broken script?</p>
            </div>
            <div class="concept-card">
              <p class="concept-title mono">INTEGRITY</p>
              <p class="concept-body">Was the payload altered in transit after the provider sent it?</p>
            </div>
            <div class="concept-card">
              <p class="concept-title mono">AUTHORIZATION</p>
              <p class="concept-body">Even if it's genuinely from the provider, is this event one your account is allowed to receive?</p>
            </div>
          </div>
          <p class="lab-note">HMAC signatures — covered next — address authenticity and integrity. They do not by themselves address authorization, which is usually handled by which endpoint/account the event was routed to.</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .wh-scene { --success: #4ade80; --pending: var(--accent); --retry: #fbbf24; --failure: var(--danger); --security: #a78bfa; --info: var(--accent-2); }
    .attacker-demo { margin-bottom: 24px; }
    .lab-code { margin-top: 16px; }
    .concepts-row { display: grid; grid-template-columns: 1fr; gap: 14px; padding-top: 20px; border-top: 1px solid var(--border); }
    @media (min-width: 720px) { .concepts-row { grid-template-columns: repeat(3, 1fr); } }
    .concept-card { padding: 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .concept-title { font-size: 0.75rem; color: var(--security); letter-spacing: 0.06em; margin: 0 0 8px; }
    .concept-body { font-size: 0.8125rem; color: var(--text-muted); line-height: 1.55; margin: 0; }
  `,
})
export class TrustProblem {
  protected readonly sent = signal(false);

  protected sendFake(): void {
    this.sent.set(true);
  }
}

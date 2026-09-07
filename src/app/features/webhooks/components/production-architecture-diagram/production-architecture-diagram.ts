import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-production-architecture-diagram',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wh-scene" id="wh-prod-architecture">
      <div class="container">
        <p class="lab-index mono">27 — THE FULL PICTURE</p>
        <h2 class="lab-title">Every piece from this chapter, in one architecture</h2>
        <p class="lab-lede">Click any node — the main chain or a failure branch — to see how it connects back to what you've already covered.</p>

        <div class="lab-panel">
          <div class="chain mono">
            @for (n of chain; track n.key) {
              <button type="button" class="chain-node" [class.is-selected]="selected() === n.key" (click)="selected.set(n.key)">{{ n.label }}</button>
              @if (!$last) { <span class="chain-arrow">&rarr;</span> }
            }
          </div>

          <p class="body-label mono">FAILURE BRANCHES</p>
          <div class="branch-row mono">
            @for (b of branches; track b.key) {
              <button type="button" class="branch-chip" [class.is-selected]="selected() === b.key" (click)="selected.set(b.key)">{{ b.label }}</button>
            }
          </div>

          @if (detail(); as d) {
            <div class="detail-panel"><p class="body-text">{{ d }}</p></div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .wh-scene { --success: #4ade80; --pending: var(--accent); --retry: #fbbf24; --failure: var(--danger); --security: #a78bfa; --info: var(--accent-2); }
    .chain { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; row-gap: 12px; }
    .chain-node, .branch-chip { all: unset; cursor: pointer; font-size: 0.6875rem; padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface); color: var(--text-muted); transition: all 0.2s ease; }
    .chain-node:hover, .branch-chip:hover { border-color: var(--pending); }
    .chain-node.is-selected, .branch-chip.is-selected { border-color: var(--pending); color: var(--accent-strong); background: color-mix(in srgb, var(--pending) 14%, var(--surface)); }
    .chain-arrow { color: var(--text-faint); font-size: 0.75rem; }
    .body-label { font-size: 0.6875rem; color: var(--info); letter-spacing: 0.05em; margin: 24px 0 10px; }
    .branch-row { display: flex; flex-wrap: wrap; gap: 8px; }
    .branch-chip { border-color: color-mix(in srgb, var(--failure) 35%, var(--border-strong)); color: var(--failure); }
    .detail-panel { margin-top: 18px; padding: 14px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .body-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; margin: 0; }
  `,
})
export class ProductionArchitectureDiagram {
  protected readonly chain = [
    { key: 'event', label: 'Event' },
    { key: 'outbox', label: 'Outbox' },
    { key: 'dispatcher', label: 'Dispatcher' },
    { key: 'sign', label: 'Sign' },
    { key: 'internet', label: 'Internet' },
    { key: 'endpoint', label: 'Endpoint' },
    { key: 'verify', label: 'Verify Signature' },
    { key: 'idempotency', label: 'Idempotency Check' },
    { key: 'persist', label: 'Persist / Enqueue' },
    { key: 'ack', label: '2xx Ack' },
    { key: 'worker', label: 'Background Worker' },
    { key: 'process', label: 'Business Processing' },
  ];
  protected readonly branches = [
    { key: 'timeout', label: 'timeout → retry/backoff' },
    { key: 'error500', label: '500 → retry/backoff' },
    { key: 'network', label: 'network failure → retry' },
    { key: 'duplicate', label: 'duplicate → idempotency' },
    { key: 'replay', label: 'replay → timestamp+id check' },
    { key: 'outoforder', label: 'out-of-order → sequence/version' },
  ];
  protected readonly selected = signal<string | null>('outbox');

  private readonly DETAILS: Record<string, string> = {
    event: 'The originating business event inside your system — the trigger for the whole chain.',
    outbox: 'Captured in the same DB transaction as the business write, so the event is never silently lost if the dispatch step fails.',
    dispatcher: 'Polls the outbox, creates a delivery record per target endpoint, and drives the send/retry loop.',
    sign: 'Computes an HMAC over the exact raw body using the shared secret, attached as a header.',
    internet: 'The request travels across the public network — latency, packet loss, and partial failures all live here.',
    endpoint: 'The customer\'s receiver — everything earlier in this chapter about receiving webhooks applies to them now.',
    verify: 'Their endpoint checks the signature against the raw body before trusting anything in the payload.',
    idempotency: 'Their endpoint checks the event id against what it has already processed, to survive redelivery.',
    persist: 'Enough state is saved to survive a crash before doing anything further.',
    ack: 'A fast 2xx response, decoupled from how long the actual business processing takes.',
    worker: 'Background processing picks up the persisted/enqueued work independently of the HTTP request/response cycle.',
    process: 'The real effect of the event finally happens — updating records, sending confirmations, and so on.',
    timeout: 'No response within the window — the dispatcher schedules a retry with exponential backoff and jitter.',
    error500: 'A server error on the receiver side — commonly retried, though exact policy is provider/implementation specific.',
    network: 'A connection-level failure before any response is seen — indistinguishable from a slow success, so retry logic assumes failure and relies on idempotency to stay safe.',
    duplicate: 'Any retry can arrive alongside a delivery that actually succeeded — the idempotency check is what keeps that safe.',
    replay: 'A captured, resent request is blocked by timestamp freshness and event id dedupe, not by the signature check.',
    outoforder: 'Independent retries and network paths can reorder deliveries — sequence numbers or version checks recover the correct order.',
  };

  protected detail(): string | null {
    const k = this.selected();
    return k ? this.DETAILS[k] ?? null : null;
  }
}

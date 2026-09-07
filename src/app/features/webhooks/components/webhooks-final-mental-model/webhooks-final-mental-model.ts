import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-webhooks-final-mental-model',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wh-scene" id="wh-final-mental-model">
      <div class="container">
        <p class="lab-index mono">33 — THE FULL MENTAL MODEL</p>
        <h2 class="lab-title">Everything from this chapter, as one diagram</h2>
        <p class="lab-lede">Click any node to recall why it exists and what it connects to.</p>

        <div class="lab-panel">
          <div class="model-grid">
            <button type="button" class="model-node core mono" [class.is-selected]="selected() === 'event'" (click)="select('event')">EVENT</button>
            <span class="arrow mono">&rarr;</span>
            <button type="button" class="model-node core mono" [class.is-selected]="selected() === 'delivery'" (click)="select('delivery')">DELIVERY (signed HTTP POST)</button>
            <span class="arrow mono">&rarr;</span>
            <button type="button" class="model-node core mono" [class.is-selected]="selected() === 'receiver'" (click)="select('receiver')">RECEIVER (verify → idempotency → ack)</button>
          </div>

          <div class="branches">
            <button type="button" class="model-node branch mono" [class.is-selected]="selected() === 'timeout'" (click)="select('timeout')">TIMEOUT / 5xx &rarr; RETRY</button>
            <button type="button" class="model-node branch mono" [class.is-selected]="selected() === 'backoff'" (click)="select('backoff')">BACKOFF + JITTER &rarr; RETRY AGAIN</button>
            <button type="button" class="model-node branch mono" [class.is-selected]="selected() === 'duplicate'" (click)="select('duplicate')">DUPLICATE &rarr; IDEMPOTENCY &rarr; SAFE</button>
            <button type="button" class="model-node branch mono" [class.is-selected]="selected() === 'replay'" (click)="select('replay')">REPLAY &rarr; TIMESTAMP + EVENT ID &rarr; REJECT</button>
            <button type="button" class="model-node branch mono" [class.is-selected]="selected() === 'exhausted'" (click)="select('exhausted')">RETRIES EXHAUSTED &rarr; DEAD LETTER</button>
            <button type="button" class="model-node branch success mono" [class.is-selected]="selected() === 'success'" (click)="select('success')">SUCCESS &rarr; DELIVERED</button>
          </div>

          @if (detail(); as d) {
            <div class="detail-panel"><p class="body-text">{{ d }}</p></div>
          }

          <p class="lab-note">A webhook is one HTTP request doing a lot of implicit work: proving who sent it, surviving the network being unreliable, and making sure "it happened twice" never becomes "it happened twice to your data."</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .wh-scene { --success: #4ade80; --pending: var(--accent); --retry: #fbbf24; --failure: var(--danger); --security: #a78bfa; --info: var(--accent-2); }
    .model-grid { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
    .arrow { color: var(--text-faint); font-size: 0.875rem; }
    .model-node { all: unset; cursor: pointer; font-size: 0.75rem; padding: 12px 16px; border-radius: var(--radius-md); border: 1px solid var(--border-strong); background: var(--surface); color: var(--text-muted); transition: all 0.2s ease; text-align: center; }
    .model-node:hover { border-color: var(--pending); }
    .model-node.is-selected { border-color: var(--pending); color: var(--accent-strong); background: color-mix(in srgb, var(--pending) 15%, var(--surface)); }
    .model-node.core { font-weight: 700; }
    .branches { margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border); display: flex; flex-wrap: wrap; gap: 10px; }
    .model-node.branch { border-color: color-mix(in srgb, var(--retry) 35%, var(--border-strong)); color: var(--retry); }
    .model-node.branch.success { border-color: color-mix(in srgb, var(--success) 45%, var(--border-strong)); color: var(--success); }
    .detail-panel { margin-top: 20px; padding: 16px 18px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .body-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; margin: 0; }
  `,
})
export class WebhooksFinalMentalModel {
  protected readonly selected = signal<string | null>('event');

  private readonly DETAILS: Record<string, string> = {
    event: 'Something happens on the provider\'s side — the starting point of the whole chapter.',
    delivery: 'The provider signs the payload and sends an HTTP POST to your registered endpoint — an ordinary request carrying an event.',
    receiver: 'Your endpoint verifies the signature against the raw body, checks the event id against what it has already processed, then acknowledges quickly.',
    timeout: 'If the receiver doesn\'t respond in time, or returns a server error, the delivery is treated as failed — provider-specific policy decides whether that triggers a retry.',
    backoff: 'Retries space themselves out with increasing delay plus randomness, so a struggling receiver gets room to recover instead of being hit again immediately.',
    duplicate: 'Any retry can land alongside a delivery that actually succeeded — the idempotency check is what keeps a duplicate from becoming a duplicate side effect.',
    replay: 'A captured, genuinely valid signed request resent later is not caught by the signature check — timestamp freshness and event id tracking are what reject it.',
    exhausted: 'Once the retry budget is used up, the delivery moves to a dead-letter store instead of disappearing — inspectable, retryable, replayable, or discardable.',
    success: 'The receiver acknowledged, the event is durably recorded, and — if this is a system you built — the delivery is marked DELIVERED in your own tracking.',
  };

  protected select(key: string): void {
    this.selected.set(key);
  }

  protected detail(): string | null {
    const k = this.selected();
    return k ? this.DETAILS[k] ?? null : null;
  }
}

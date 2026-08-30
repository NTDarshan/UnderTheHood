import { Component, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

type Tab = 'ordering' | 'storm';

const NO_BACKOFF_BUCKETS = [1000, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const BACKOFF_BUCKETS = [140, 210, 230, 170, 110, 65, 38, 22, 10, 5];

@Component({
  selector: 'app-reconnect-storm',
  standalone: true,
  imports: [ExplainSimply],
  template: `
    <section class="lab-section" id="reconnect">
      <div class="container">
        <p class="lab-index">WEBSOCKETS / 014 — ORDERING & RECONNECTION</p>
        <h2 class="lab-title">1,000 clients drop at once. What happens when they all try to come back?</h2>

        <div class="tab-row">
          <button type="button" class="lab-btn" [class.is-active]="tab() === 'ordering'" (click)="tab.set('ordering')">Message ordering</button>
          <button type="button" class="lab-btn" [class.is-active]="tab() === 'storm'" (click)="tab.set('storm')">Reconnect storm</button>
        </div>

        @if (tab() === 'ordering') {
          <div class="lab-panel">
            <app-explain-simply>
              A single pipe delivering numbered letters in order is easy. Three separate couriers delivering
              letters from three different desks is a different problem entirely.
            </app-explain-simply>
            <div class="order-row">
              <div class="order-col">
                <p class="order-heading mono">SERVER SENDS</p>
                <div class="order-seq mono">1 → 2 → 3 → 4 → 5</div>
              </div>
              <div class="order-col">
                <p class="order-heading mono">CLIENT RECEIVES</p>
                <div class="order-seq mono order-seq-good">1 → 2 → 3 → 4 → 5</div>
              </div>
            </div>
            <p class="order-note">
              Within a single WebSocket connection, TCP guarantees this: bytes (and therefore frames) arrive in
              the order they were sent. That part is solved for you.
            </p>
            <div class="claim-box">
              <p class="claim-wrong mono">✗ "Transport ordering means my whole system is ordered."</p>
              <p class="claim-right">
                Not necessarily. The moment you have <strong>multiple servers</strong>, <strong>multiple
                producers</strong> publishing to the same pub/sub channel, or <strong>retried</strong> messages,
                nothing guarantees those pieces arrive at a client in the order they were logically produced —
                each piece was ordered locally, but the merge across sources wasn't.
              </p>
            </div>
            <button type="button" class="lab-btn" (click)="shuffleDemo()">Simulate two producers publishing to the same client</button>
            @if (shuffled()) {
              <div class="order-row">
                <div class="order-col">
                  <p class="order-heading mono">PRODUCER A SENT</p>
                  <div class="order-seq mono">A1 → A2 → A3</div>
                </div>
                <div class="order-col">
                  <p class="order-heading mono">PRODUCER B SENT</p>
                  <div class="order-seq mono">B1 → B2</div>
                </div>
              </div>
              <p class="order-heading mono" style="margin-top: 16px;">CLIENT ACTUALLY RECEIVED</p>
              <div class="order-seq mono order-seq-bad">A1 → B1 → A2 → B2 → A3</div>
              <p class="order-note">Each producer's own messages stayed in order — but interleaved with the other producer, unless the application adds its own sequencing (timestamps, version numbers, per-entity ordering keys).</p>
            }
          </div>
        }

        @if (tab() === 'storm') {
          <div class="lab-panel">
            <app-explain-simply>
              If everyone whose call just dropped redials the instant it happens, the switchboard gets hit with
              every single call at once. Staggering the redial — with some randomness — spreads the load out.
            </app-explain-simply>
            <button type="button" class="lab-btn lab-btn-danger" (click)="dropAll()">1,000 clients disconnect right now</button>

            <div class="storm-compare">
              <div class="storm-col">
                <p class="storm-heading mono">WITHOUT BACKOFF — reconnect immediately</p>
                <div class="storm-bars">
                  @for (b of noBackoff; track $index) {
                    <div class="bar-wrap">
                      <div class="bar bar-bad" [style.height.%]="dropped() ? (b / 1000) * 100 : 0"></div>
                    </div>
                  }
                </div>
                <p class="storm-caption">One giant spike at t=0 — the server (and any pub/sub, database, or auth check on connect) takes the full load instantly.</p>
              </div>
              <div class="storm-col">
                <p class="storm-heading mono">WITH EXPONENTIAL BACKOFF + JITTER</p>
                <div class="storm-bars">
                  @for (b of backoff; track $index) {
                    <div class="bar-wrap">
                      <div class="bar bar-good" [style.height.%]="dropped() ? (b / 1000) * 100 : 0"></div>
                    </div>
                  }
                </div>
                <p class="storm-caption">Reconnects spread across ~1s, 2s, 4s, 8s… with randomized jitter added — the same 1,000 clients, arriving over several seconds instead of one instant.</p>
              </div>
            </div>
            <p class="storm-axis mono">← t+0s ⋯⋯⋯⋯⋯⋯⋯⋯ t+9s →</p>

            <div class="backoff-seq">
              <p class="backoff-heading mono">A SINGLE CLIENT'S RETRY SCHEDULE</p>
              <div class="backoff-row mono">
                <span>1s</span><span class="ba">→</span><span>2s</span><span class="ba">→</span><span>4s</span><span class="ba">→</span><span>8s</span><span class="ba">→</span><span>16s</span>
              </div>
              <p class="backoff-note">
                Each failed attempt doubles the wait — and jitter (a small random offset) is added so that
                clients who disconnected at the same instant don't all retry at exactly the same moment on the
                next round either.
              </p>
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .tab-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 28px; }

    .order-row { display: flex; flex-wrap: wrap; gap: 24px; margin-top: 24px; }
    .order-heading { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--accent-2); margin-bottom: 8px; }
    .order-seq { font-size: 1rem; color: var(--text); }
    .order-seq-good { color: var(--accent-2); }
    .order-seq-bad { color: var(--danger); }
    .order-note { margin-top: 16px; max-width: 640px; font-size: 0.9375rem; color: var(--text-muted); line-height: 1.6; }

    .claim-box { margin-top: 20px; max-width: 680px; padding: 20px 22px; background: var(--surface-raised); border-left: 2px solid var(--accent-2-dim); border-radius: var(--radius-sm); }
    .claim-wrong { color: var(--danger); font-size: 0.875rem; margin-bottom: 10px; }
    .claim-right { color: var(--text-muted); font-size: 0.9375rem; line-height: 1.65; }
    .claim-right strong { color: var(--accent-2); }

    .storm-compare { display: grid; gap: 24px; grid-template-columns: 1fr; margin-top: 24px; }
    @media (min-width: 720px) { .storm-compare { grid-template-columns: 1fr 1fr; } }
    .storm-heading { font-size: 0.6875rem; letter-spacing: 0.06em; color: var(--text-faint); margin-bottom: 12px; }
    .storm-bars { display: flex; align-items: flex-end; gap: 4px; height: 140px; padding: 8px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .bar-wrap { flex: 1; height: 100%; display: flex; align-items: flex-end; }
    .bar { width: 100%; border-radius: 2px 2px 0 0; transition: height 0.6s ease; }
    .bar-bad { background: var(--danger); }
    .bar-good { background: var(--accent-2); }
    .storm-caption { margin-top: 10px; font-size: 0.8125rem; color: var(--text-faint); line-height: 1.5; }
    .storm-axis { text-align: center; margin-top: 10px; font-size: 0.6875rem; color: var(--text-faint); }

    .backoff-seq { margin-top: 32px; }
    .backoff-heading { font-size: 0.6875rem; letter-spacing: 0.06em; color: var(--accent-2); margin-bottom: 10px; }
    .backoff-row { display: flex; gap: 8px; align-items: center; font-size: 0.9375rem; color: var(--text); }
    .ba { color: var(--text-faint); }
    .backoff-note { margin-top: 10px; max-width: 640px; font-size: 0.875rem; color: var(--text-muted); line-height: 1.55; }
  `,
})
export class ReconnectStorm {
  protected readonly tab = signal<Tab>('storm');
  protected readonly dropped = signal(false);
  protected readonly shuffled = signal(false);
  protected readonly noBackoff = NO_BACKOFF_BUCKETS;
  protected readonly backoff = BACKOFF_BUCKETS;

  dropAll(): void {
    this.dropped.set(false);
    requestAnimationFrame(() => this.dropped.set(true));
  }

  shuffleDemo(): void {
    this.shuffled.set(true);
  }
}

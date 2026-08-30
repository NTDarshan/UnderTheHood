import { Component, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

@Component({
  selector: 'app-why-websockets',
  standalone: true,
  imports: [ExplainSimply],
  template: `
    <section class="lab-section" id="why-websockets">
      <div class="container">
        <p class="lab-index">WEBSOCKETS / 003 — THE ACTUAL SHIFT</p>
        <h2 class="lab-title">"What if both sides could talk whenever they need to?"</h2>
        <p class="lab-lede">
          Polling, long polling and SSE all keep the request/response shape and try to work around it.
          WebSocket doesn't work around it — it replaces it.
        </p>

        <app-explain-simply>
          It's the difference between a comment box you drop a note into and hope someone reads (HTTP), and a
          walkie-talkie where either person can key up and talk the moment they have something to say.
        </app-explain-simply>

        <div class="compare-row">
          <div class="compare-col">
            <p class="compare-heading mono">BEFORE — REQUEST → RESPONSE</p>
            <div class="mini-diagram">
              <span class="mini-node">CLIENT</span>
              <span class="mini-arrows">
                <span class="mini-arrow">→</span>
                <span class="mini-arrow mini-arrow-back">←</span>
              </span>
              <span class="mini-node">SERVER</span>
            </div>
            <p class="compare-text">A new exchange must be opened for every message. The server never speaks first.</p>
          </div>
          <div class="compare-col compare-col-highlight">
            <p class="compare-heading mono">AFTER — PERSISTENT CONNECTION</p>
            <div class="mini-diagram">
              <span class="mini-node is-live">CLIENT</span>
              <span class="mini-dual" [class.is-pulsing]="pulse()">⇄</span>
              <span class="mini-node is-live">SERVER</span>
            </div>
            <p class="compare-text">One connection stays open. Either side sends whenever it has something — no new exchange required.</p>
          </div>
        </div>

        <button type="button" class="lab-btn" (click)="ping()">Watch a message go each direction</button>

        <div class="claim-box">
          <p class="claim-wrong mono">✗ "WebSocket is just faster than HTTP."</p>
          <p class="claim-right">
            Not the real reason. The point isn't raw speed — it's that WebSocket changes the
            <strong>communication model</strong> itself: from a client-initiated request/response cycle to a
            standing, bidirectional channel. That model change is what makes real-time push possible at all,
            regardless of speed.
          </p>
        </div>

        <p class="rfc-note mono">
          Defined by <strong>RFC 6455</strong> — WebSocket is its own protocol with its own framing, running
          on top of a regular TCP connection. It is not "HTTP kept open."
        </p>
      </div>
    </section>
  `,
  styles: `
    .compare-row { margin-top: 32px; display: grid; gap: 20px; grid-template-columns: 1fr; }
    @media (min-width: 640px) { .compare-row { grid-template-columns: 1fr 1fr; } }

    .compare-col { padding: 20px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface-raised); }
    .compare-col-highlight { border-color: var(--accent-dim); background: linear-gradient(180deg, var(--surface-elevated), var(--surface-raised)); }

    .compare-heading { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--accent-2); margin-bottom: 16px; }

    .mini-diagram { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 12px 0; }
    .mini-node { font-family: var(--font-mono); font-size: 0.75rem; font-weight: 600; padding: 10px 14px; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); color: var(--text-faint); }
    .mini-node.is-live { border-color: var(--accent); color: var(--accent); }
    .mini-arrows { display: flex; flex-direction: column; gap: 4px; color: var(--text-faint); font-size: 0.9rem; }
    .mini-arrow-back { color: var(--text-faint); }
    .mini-dual { font-size: 1.5rem; color: var(--accent); }
    .mini-dual.is-pulsing { animation: dual-flash 0.6s ease; }
    @keyframes dual-flash { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.4); color: var(--accent-strong); } }

    .compare-text { margin-top: 8px; font-size: 0.875rem; color: var(--text-muted); line-height: 1.55; text-align: center; }

    .claim-box { margin-top: 28px; max-width: 680px; padding: 20px 22px; background: var(--surface-raised); border-left: 2px solid var(--accent-2-dim); border-radius: var(--radius-sm); }
    .claim-wrong { color: var(--danger); font-size: 0.875rem; margin-bottom: 10px; }
    .claim-right { color: var(--text-muted); font-size: 0.9375rem; line-height: 1.65; }
    .claim-right strong { color: var(--accent-2); }

    .rfc-note { margin-top: 20px; font-size: 0.8125rem; color: var(--text-faint); }
    .rfc-note strong { color: var(--accent); }
  `,
})
export class WhyWebsockets {
  protected readonly pulse = signal(false);

  ping(): void {
    this.pulse.set(true);
    setTimeout(() => this.pulse.set(false), 600);
  }
}

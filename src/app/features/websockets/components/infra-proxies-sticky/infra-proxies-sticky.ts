import { Component, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

@Component({
  selector: 'app-infra-proxies-sticky',
  standalone: true,
  imports: [ExplainSimply],
  template: `
    <section class="lab-section" id="infra">
      <div class="container">
        <p class="lab-index">WEBSOCKETS / 016 — PRODUCTION INFRASTRUCTURE</p>
        <h2 class="lab-title">The handshake still has to pass through everything a normal HTTP request does.</h2>
        <p class="lab-lede">
          Reverse proxies, load balancers, API gateways and firewalls all sit between a client and a WebSocket
          server. Each one has to explicitly understand and forward the <span class="mono">Upgrade</span> semantics — not every piece of infrastructure behaves identically here.
        </p>

        <div class="infra-chain">
          <div class="infra-node">CLIENT</div>
          <span class="infra-arrow">→</span>
          <div class="infra-node infra-node-lb">LOAD BALANCER</div>
          <span class="infra-arrow">→</span>
          <div class="infra-node">SERVER</div>
        </div>

        <app-explain-simply>
          A load balancer that doesn't understand WebSocket Upgrade requests is like a receptionist who only
          knows how to hand off single letters — it has no idea what to do when someone asks to stay on an open
          line.
        </app-explain-simply>

        <p class="sub-heading mono">STICKY SESSIONS</p>
        <p class="sticky-lede">Watch what happens when a reconnect gets routed to a different backend than the one holding your state.</p>

        <div class="sticky-diagram">
          <div class="infra-node">CLIENT</div>
          <span class="infra-arrow">→</span>
          <div class="infra-node infra-node-lb">LOAD BALANCER</div>
          <span class="infra-arrow">→</span>
          <div class="server-stack">
            <div class="infra-node infra-node-server" [class.is-active]="routedTo() === 'A'">SERVER A</div>
            <div class="infra-node infra-node-server" [class.is-active]="routedTo() === 'B'">SERVER B</div>
          </div>
        </div>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn lab-btn-primary" (click)="connect()">Connect</button>
          <button type="button" class="lab-btn" (click)="reconnect()" [disabled]="routedTo() === null">Reconnect after a drop</button>
          <button type="button" class="lab-btn" (click)="reset()">Reset</button>
        </div>

        @if (routedTo()) {
          <p class="sticky-status mono">
            Currently on Server {{ routedTo() }}
            @if (mismatch()) { <span class="sticky-warn"> — this is NOT where your in-memory session lives!</span> }
          </p>
        }
        @if (mismatch()) {
          <p class="sticky-explain">
            Without sticky routing, the load balancer sent this reconnect to whichever server happened to be
            free — not necessarily the one holding your prior connection state in memory. If that state (a
            subscription list, a partially-built session) only lived in Server A's process, it's gone now.
          </p>
        }

        <div class="claim-box">
          <p class="claim-wrong mono">✗ "Sticky sessions solve WebSocket scaling."</p>
          <p class="claim-right">
            Sticky sessions <em>can</em> help by consistently routing a client back to the same backend — but
            they're not a universal fix. They complicate deploys (draining a server means dropping its sticky
            clients), don't help when a server crashes, and don't help two different clients on two different
            servers reach each other at all. Distributed state and pub/sub (see the multi-server section above)
            are usually what actually makes horizontal scaling robust.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .infra-chain, .sticky-diagram { display: flex; align-items: center; gap: 14px; margin-top: 28px; flex-wrap: wrap; }
    .infra-node { padding: 12px 18px; border: 1px solid var(--border-strong); border-radius: var(--radius-md); background: var(--surface-elevated); font-family: var(--font-mono); font-size: 0.75rem; font-weight: 600; color: var(--text-faint); text-align: center; transition: border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease; }
    .infra-node-lb { border-color: var(--accent-2-dim); color: var(--accent-2); }
    .infra-arrow { color: var(--text-faint); }
    .server-stack { display: flex; flex-direction: column; gap: 8px; }
    .infra-node-server.is-active { border-color: var(--accent); color: var(--accent); box-shadow: 0 0 16px var(--glow-accent); }

    .sub-heading { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--accent-2); margin-top: 40px; margin-bottom: 8px; }
    .sticky-lede { max-width: 620px; color: var(--text-muted); font-size: 0.9375rem; }

    .sticky-status { margin-top: 18px; font-size: 0.875rem; color: var(--text); }
    .sticky-warn { color: var(--danger); }
    .sticky-explain { margin-top: 10px; max-width: 640px; font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; }

    .claim-box { margin-top: 24px; max-width: 680px; padding: 20px 22px; background: var(--surface-raised); border-left: 2px solid var(--accent-2-dim); border-radius: var(--radius-sm); }
    .claim-wrong { color: var(--danger); font-size: 0.875rem; margin-bottom: 10px; }
    .claim-right { color: var(--text-muted); font-size: 0.9375rem; line-height: 1.65; }
    .claim-right em { color: var(--text); font-style: normal; }
  `,
})
export class InfraProxiesSticky {
  protected readonly routedTo = signal<'A' | 'B' | null>(null);
  protected readonly mismatch = signal(false);

  connect(): void {
    this.routedTo.set('A');
    this.mismatch.set(false);
  }

  reconnect(): void {
    if (this.routedTo() === null) return;
    const wasOn = this.routedTo();
    const newServer = wasOn === 'A' ? 'B' : 'A';
    this.routedTo.set(newServer);
    this.mismatch.set(newServer !== wasOn);
  }

  reset(): void {
    this.routedTo.set(null);
    this.mismatch.set(false);
  }
}

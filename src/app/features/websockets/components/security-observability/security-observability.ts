import { Component, OnDestroy, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

const SECURITY_ITEMS = [
  { name: 'wss:// (TLS)', detail: 'Encrypts everything after the handshake in transit.' },
  { name: 'Authentication', detail: 'Establishes who is connecting.' },
  { name: 'Authorization', detail: 'Checked per-action, not just once at connect time.' },
  { name: 'Origin validation', detail: 'Server checks the Origin header so arbitrary sites can\'t open connections on a user\'s behalf.' },
  { name: 'Input validation', detail: 'Every incoming message is untrusted, same as an HTTP request body.' },
  { name: 'Rate limiting', detail: 'Caps how fast one connection can send, to blunt abuse or bugs.' },
  { name: 'Message size limits', detail: 'Refuses oversized frames before they exhaust memory.' },
  { name: 'Connection limits', detail: 'Caps connections per user/IP to reduce resource-exhaustion risk.' },
];

interface Metrics {
  active: number;
  connRate: number;
  disconnectRate: number;
  reconnectRate: number;
  msgsPerSec: number;
  bytesPerSec: number;
  avgMsgSize: number;
  slowConsumers: number;
  avgDuration: string;
  errors: number;
  authFailures: number;
}

@Component({
  selector: 'app-security-observability',
  standalone: true,
  imports: [ExplainSimply],
  template: `
    <section class="lab-section" id="security">
      <div class="container">
        <p class="lab-index">WEBSOCKETS / 019 — SECURITY & OBSERVABILITY</p>
        <h2 class="lab-title">The protocol gives you a channel. It doesn't give you security for free.</h2>

        <app-explain-simply>
          Opening a phone line doesn't stop someone from lying about who they are, or from shouting nonsense
          down it forever. Those are things you still have to check for, on every call.
        </app-explain-simply>

        <div class="security-grid">
          @for (item of securityItems; track item.name) {
            <div class="security-card">
              <p class="security-name mono">{{ item.name }}</p>
              <p class="security-detail">{{ item.detail }}</p>
            </div>
          }
        </div>
        <p class="security-note">
          None of this is provided automatically by the WebSocket protocol itself. It provides the communication
          mechanics — a persistent, framed, bidirectional channel. Every item above is an application-level
          responsibility layered on top.
        </p>

        <h3 class="sub-heading">A production observability dashboard</h3>
        <p class="obs-lede">
          WebSocket systems need different signals than a normal request/response API — connection counts and
          rates matter as much as request latency does elsewhere.
        </p>
        <div class="lab-btn-row">
          <button type="button" class="lab-btn lab-btn-primary" (click)="toggleSim()">{{ simRunning() ? 'Stop simulated traffic' : 'Simulate live traffic' }}</button>
        </div>
        <div class="dash-grid mono">
          <div class="dash-tile"><span class="dash-value">{{ metrics().active }}</span><span class="dash-label">active connections</span></div>
          <div class="dash-tile"><span class="dash-value">{{ metrics().connRate }}/s</span><span class="dash-label">connection rate</span></div>
          <div class="dash-tile"><span class="dash-value">{{ metrics().disconnectRate }}/s</span><span class="dash-label">disconnect rate</span></div>
          <div class="dash-tile"><span class="dash-value">{{ metrics().reconnectRate }}/s</span><span class="dash-label">reconnect rate</span></div>
          <div class="dash-tile"><span class="dash-value">{{ metrics().msgsPerSec }}</span><span class="dash-label">messages/sec</span></div>
          <div class="dash-tile"><span class="dash-value">{{ metrics().bytesPerSec }}KB/s</span><span class="dash-label">bytes/sec</span></div>
          <div class="dash-tile"><span class="dash-value">{{ metrics().avgMsgSize }}B</span><span class="dash-label">avg message size</span></div>
          <div class="dash-tile" [class.is-warn]="metrics().slowConsumers > 5"><span class="dash-value">{{ metrics().slowConsumers }}</span><span class="dash-label">slow consumers</span></div>
          <div class="dash-tile"><span class="dash-value">{{ metrics().avgDuration }}</span><span class="dash-label">avg connection duration</span></div>
          <div class="dash-tile" [class.is-warn]="metrics().errors > 3"><span class="dash-value">{{ metrics().errors }}</span><span class="dash-label">errors</span></div>
          <div class="dash-tile" [class.is-warn]="metrics().authFailures > 3"><span class="dash-value">{{ metrics().authFailures }}</span><span class="dash-label">auth failures</span></div>
        </div>
        <p class="obs-note">
          A sudden spike in disconnect + reconnect rate together often means a deploy or a load-balancer issue.
          A rising slow-consumer count is an early warning of backpressure before it becomes an outage.
        </p>
      </div>
    </section>
  `,
  styles: `
    .security-grid { margin-top: 28px; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
    .security-card { padding: 14px 16px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface-raised); }
    .security-name { color: var(--accent-2); font-size: 0.8125rem; margin-bottom: 6px; }
    .security-detail { font-size: 0.8125rem; color: var(--text-muted); line-height: 1.5; }
    .security-note { margin-top: 20px; max-width: 660px; font-size: 0.9375rem; color: var(--text-muted); line-height: 1.6; }

    .sub-heading { margin-top: 44px; font-size: 1.25rem; color: var(--text); }
    .obs-lede { margin-top: 8px; max-width: 640px; color: var(--text-muted); font-size: 0.9375rem; }

    .dash-grid { margin-top: 24px; display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
    .dash-tile { padding: 14px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); display: flex; flex-direction: column; gap: 4px; transition: border-color 0.3s ease; }
    .dash-tile.is-warn { border-color: var(--danger); }
    .dash-value { font-size: 1.25rem; font-weight: 700; color: var(--text); }
    .is-warn .dash-value { color: var(--danger); }
    .dash-label { font-size: 0.625rem; color: var(--text-faint); letter-spacing: 0.03em; }

    .obs-note { margin-top: 20px; max-width: 660px; font-size: 0.875rem; color: var(--text-faint); line-height: 1.6; }
  `,
})
export class SecurityObservability implements OnDestroy {
  protected readonly securityItems = SECURITY_ITEMS;
  protected readonly simRunning = signal(false);
  protected readonly metrics = signal<Metrics>({
    active: 4820, connRate: 12, disconnectRate: 10, reconnectRate: 3, msgsPerSec: 2140,
    bytesPerSec: 340, avgMsgSize: 158, slowConsumers: 2, avgDuration: '6m 40s', errors: 0, authFailures: 0,
  });
  private timer: ReturnType<typeof setInterval> | null = null;

  toggleSim(): void {
    if (this.simRunning()) {
      this.simRunning.set(false);
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      return;
    }
    this.simRunning.set(true);
    this.timer = setInterval(() => {
      this.metrics.update((m) => {
        const jitter = (base: number, spread: number) => Math.max(0, Math.round(base + (Math.random() - 0.5) * spread));
        return {
          active: jitter(m.active, 400),
          connRate: jitter(12, 8),
          disconnectRate: jitter(10, 8),
          reconnectRate: jitter(3, 6),
          msgsPerSec: jitter(2140, 800),
          bytesPerSec: jitter(340, 120),
          avgMsgSize: jitter(158, 40),
          slowConsumers: jitter(2, 10),
          avgDuration: m.avgDuration,
          errors: jitter(0, 6),
          authFailures: jitter(0, 4),
        };
      });
    }, 900);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
}

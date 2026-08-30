import { Component, computed, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

const MSG_SIZE_BYTES: Record<string, number> = { small: 100, medium: 500, large: 2000 };

@Component({
  selector: 'app-system-design-challenge',
  standalone: true,
  imports: [ExplainSimply],
  template: `
    <section class="lab-section" id="design-challenge">
      <div class="container">
        <p class="lab-index">WEBSOCKETS / 025 — FINAL CHALLENGE</p>
        <h2 class="lab-title">Design a production chat system.</h2>
        <p class="lab-lede">
          This isn't about computing a precise production capacity number — it's about reasoning through
          connections, memory, network, fan-out, backpressure, failure, and horizontal scaling as one system.
        </p>

        <app-explain-simply>
          Think of it like sizing a call center: how many phone lines do you need, how many operators, what
          happens when one operator's line drops, and how loud does the room get when everyone's shift starts
          at once?
        </app-explain-simply>

        <div class="design-controls">
          <div class="lab-field">
            <label for="users">Concurrent users</label>
            <select id="users" [value]="users()" (change)="users.set(+$any($event.target).value)">
              <option [value]="1000">1,000</option>
              <option [value]="10000">10,000</option>
              <option [value]="100000">100,000</option>
              <option [value]="1000000">1,000,000</option>
            </select>
          </div>
          <div class="lab-field">
            <label for="servers">WebSocket servers</label>
            <select id="servers" [value]="servers()" (change)="servers.set(+$any($event.target).value)">
              @for (n of [1, 2, 5, 10, 20]; track n) { <option [value]="n">{{ n }}</option> }
            </select>
          </div>
          <div class="lab-field">
            <label for="rate">Messages / user / minute</label>
            <select id="rate" [value]="msgsPerUserPerMin()" (change)="msgsPerUserPerMin.set(+$any($event.target).value)">
              <option [value]="1">1 (light)</option>
              <option [value]="10">10 (normal)</option>
              <option [value]="60">60 (very chatty)</option>
            </select>
          </div>
          <div class="lab-field">
            <label for="size">Average message size</label>
            <select id="size" [value]="msgSize()" (change)="msgSize.set($any($event.target).value)">
              <option value="small">Small (~100B)</option>
              <option value="medium">Medium (~500B)</option>
              <option value="large">Large (~2KB)</option>
            </select>
          </div>
          <div class="lab-field">
            <label for="fanout">Average room size (fan-out)</label>
            <select id="fanout" [value]="fanout()" (change)="fanout.set(+$any($event.target).value)">
              <option [value]="2">2 (1:1 DM)</option>
              <option [value]="10">10 (small group)</option>
              <option [value]="500">500 (large room)</option>
            </select>
          </div>
        </div>

        <div class="pipeline mono">
          <span class="pipeline-node">CLIENTS ({{ users().toLocaleString() }})</span>
          <span class="pipeline-arrow">↓</span>
          <span class="pipeline-node">LOAD BALANCER</span>
          <span class="pipeline-arrow">↓</span>
          <span class="pipeline-node">{{ servers() }} × WEBSOCKET SERVER</span>
          <span class="pipeline-arrow">↓</span>
          <span class="pipeline-node">PUB/SUB</span>
          <span class="pipeline-arrow">↓</span>
          <span class="pipeline-node">APPLICATION SERVICES</span>
          <span class="pipeline-arrow">↓</span>
          <span class="pipeline-node">DATABASE</span>
        </div>

        <div class="metrics-grid mono">
          <div class="metric-tile" [class.is-warn]="connectionsPerServer() > 20000">
            <span class="metric-value">{{ connectionsPerServer().toLocaleString() }}</span>
            <span class="metric-label">connections / server</span>
          </div>
          <div class="metric-tile">
            <span class="metric-value">{{ totalMsgsPerSec().toLocaleString() }}/s</span>
            <span class="metric-label">total inbound messages</span>
          </div>
          <div class="metric-tile" [class.is-warn]="totalOutboundPerSec() > 500000">
            <span class="metric-value">{{ totalOutboundPerSec().toLocaleString() }}/s</span>
            <span class="metric-label">total outbound sends (fan-out)</span>
          </div>
          <div class="metric-tile">
            <span class="metric-value">{{ bandwidthMbps() }} Mbps</span>
            <span class="metric-label">approx. outbound bandwidth</span>
          </div>
        </div>

        @if (warnings().length > 0) {
          <div class="warnings">
            @for (w of warnings(); track w) {
              <p class="warning-line mono">⚠ {{ w }}</p>
            }
          </div>
        }

        <div class="lab-btn-row">
          <button type="button" class="lab-btn lab-btn-danger" (click)="crashServer()" [disabled]="servers() <= 1">Simulate one server crashing</button>
          <button type="button" class="lab-btn" (click)="reset()">Reset servers</button>
        </div>

        @if (crashed()) {
          <p class="crash-note">
            Server count dropped from {{ servers() + 1 }} to {{ servers() }}. Roughly
            <strong>{{ Math.round(users() / (servers() + 1)).toLocaleString() }}</strong> clients need to
            reconnect — without backoff + jitter on the client, that's a reconnect storm hitting the remaining
            {{ servers() }} server(s) and your pub/sub layer all at once.
          </p>
        }

        <p class="design-note">
          Notice what this exercise does <em>not</em> tell you: an exact number of servers you "need." That
          number depends on real hardware, real runtime overhead, and real traffic patterns you'd only learn
          from load testing. What it should build is the habit of asking these questions before you ship.
        </p>
      </div>
    </section>
  `,
  styles: `
    .design-controls { margin-top: 28px; display: flex; flex-wrap: wrap; gap: 20px; }

    .pipeline { margin-top: 32px; display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .pipeline-node { padding: 10px 18px; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); background: var(--surface-elevated); font-size: 0.75rem; color: var(--text); text-align: center; }
    .pipeline-arrow { color: var(--text-faint); font-size: 0.75rem; }

    .metrics-grid { margin-top: 28px; display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
    .metric-tile { padding: 14px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); display: flex; flex-direction: column; gap: 4px; transition: border-color 0.3s ease; }
    .metric-tile.is-warn { border-color: var(--danger); }
    .metric-value { font-size: 1.25rem; font-weight: 700; color: var(--text); }
    .is-warn .metric-value { color: var(--danger); }
    .metric-label { font-size: 0.625rem; color: var(--text-faint); }

    .warnings { margin-top: 16px; display: flex; flex-direction: column; gap: 6px; }
    .warning-line { color: var(--danger); font-size: 0.8125rem; }

    .crash-note { margin-top: 16px; max-width: 660px; font-size: 0.9375rem; color: var(--text-muted); line-height: 1.6; }
    .crash-note strong { color: var(--danger); }

    .design-note { margin-top: 24px; max-width: 660px; font-size: 0.875rem; color: var(--text-faint); line-height: 1.6; }
    .design-note em { color: var(--text-muted); font-style: normal; }
  `,
})
export class SystemDesignChallenge {
  protected readonly Math = Math;
  protected readonly users = signal(100000);
  protected readonly servers = signal(5);
  protected readonly msgsPerUserPerMin = signal(10);
  protected readonly msgSize = signal<'small' | 'medium' | 'large'>('medium');
  protected readonly fanout = signal(10);
  protected readonly crashed = signal(false);

  protected readonly connectionsPerServer = computed(() => Math.round(this.users() / this.servers()));
  protected readonly totalMsgsPerSec = computed(() => Math.round((this.users() * this.msgsPerUserPerMin()) / 60));
  protected readonly totalOutboundPerSec = computed(() => this.totalMsgsPerSec() * this.fanout());
  protected readonly bandwidthMbps = computed(() =>
    Math.round(((this.totalOutboundPerSec() * MSG_SIZE_BYTES[this.msgSize()] * 8) / 1_000_000) * 10) / 10,
  );

  protected readonly warnings = computed(() => {
    const w: string[] = [];
    if (this.connectionsPerServer() > 20000) {
      w.push(`${this.connectionsPerServer().toLocaleString()} connections on one server is a lot to hold in a single process — consider more servers or raised OS limits.`);
    }
    if (this.totalOutboundPerSec() > 500000) {
      w.push('Outbound sends per second are very high — fan-out at this room size will dominate server CPU and network before anything else does.');
    }
    if (this.bandwidthMbps() > 1000) {
      w.push('Approximate outbound bandwidth is in the gigabit range — this needs real network capacity planning, not just more application servers.');
    }
    return w;
  });

  crashServer(): void {
    if (this.servers() <= 1) return;
    this.servers.update((s) => s - 1);
    this.crashed.set(true);
  }

  reset(): void {
    this.servers.set(5);
    this.crashed.set(false);
  }
}

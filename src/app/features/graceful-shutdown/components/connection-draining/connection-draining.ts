import { Component, OnDestroy, signal } from '@angular/core';

type ServerId = 'a' | 'b' | 'c';
type ServerStatus = 'healthy' | 'draining' | 'stopped';

interface InFlightRequest {
  id: number;
  label: string;
  progress: number;
}

const TICK_MS = 180;
const NEW_TRAFFIC_INTERVAL_MS = 900;

@Component({
  selector: 'app-connection-draining',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section gs-scene drain-scene" id="gs-draining">
      <div class="container">
        <p class="lab-index">09 — CONNECTION DRAINING</p>
        <h2 class="lab-title">Draining: stop sending new work, finish the old work</h2>
        <p class="lab-lede">
          Before a server instance shuts down, the load balancer marks it as draining: it stops routing new
          requests there, while every request already in flight on that instance is left alone to finish
          normally.
        </p>

        <div class="lab-panel">
          <div class="lb-node">
            <span class="lb-label mono">LOAD BALANCER</span>
            <span class="pill pill-yes">ROUTING TRAFFIC</span>
          </div>

          <div class="fan" aria-hidden="true">
            <span class="fan-line fan-line-a" [class.is-flowing]="isRunning()"></span>
            <span class="fan-line fan-line-b" [class.is-flowing]="isRunning() && serverB().status === 'healthy'"></span>
            <span class="fan-line fan-line-c" [class.is-flowing]="isRunning()"></span>
          </div>

          <div class="servers-row">
            @for (srv of [serverA(), serverB(), serverC()]; track srv.id) {
              <div class="server-card" [class.is-healthy]="srv.status === 'healthy'" [class.is-draining]="srv.status === 'draining'" [class.is-stopped]="srv.status === 'stopped'">
                <div class="server-head">
                  <span class="server-label mono">SERVER {{ srv.id.toUpperCase() }}</span>
                  @switch (srv.status) {
                    @case ('healthy') { <span class="pill pill-yes">&#9679; HEALTHY</span> }
                    @case ('draining') { <span class="pill pill-conditional">&#9686; DRAINING</span> }
                    @case ('stopped') { <span class="pill pill-no">&#9632; STOPPED</span> }
                  }
                </div>

                @if (srv.status !== 'stopped') {
                  <div class="requests" role="list" [attr.aria-label]="'In-flight requests on server ' + srv.id.toUpperCase()">
                    @for (req of srv.requests; track req.id) {
                      <div class="req-row" role="listitem">
                        <span class="req-label mono">{{ req.label }}</span>
                        <div class="req-track" role="img" [attr.aria-label]="req.label + ' ' + req.progress.toFixed(0) + ' percent complete'">
                          <div class="req-fill" [style.width.%]="req.progress"></div>
                        </div>
                      </div>
                    }
                    @if (srv.requests.length === 0 && srv.status === 'draining') {
                      <p class="mono empty-line">no in-flight requests remaining</p>
                    }
                    @if (srv.requests.length === 0 && srv.status === 'healthy') {
                      <p class="mono empty-line">waiting for traffic&hellip;</p>
                    }
                  </div>
                } @else {
                  <p class="mono empty-line">removed from pool &mdash; safe to terminate</p>
                }
              </div>
            }
          </div>

          <div class="lab-btn-row">
            <button
              type="button"
              class="lab-btn lab-btn-primary"
              (click)="startTraffic()"
              [disabled]="isRunning()"
            >
              Start traffic
            </button>
            <button
              type="button"
              class="lab-btn lab-btn-danger"
              (click)="drainServerB()"
              [disabled]="!isRunning() || serverB().status !== 'healthy'"
            >
              Drain Server B
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <div class="lab-code" aria-live="polite">
            @if (!isRunning()) {
              start traffic to see requests fan out across the pool
            } @else if (serverB().status === 'healthy') {
              all three servers accepting new connections
            } @else if (serverB().status === 'draining') {
              server B: no new requests arriving &mdash; {{ serverB().requests.length }} existing request(s)
              still completing normally
            } @else {
              server B fully drained and stopped &mdash; only A and C remain in the pool
            }
          </div>
        </div>

        <p class="lab-note">
          This is why graceful shutdown and load-balancer draining go together: the instance keeps running long
          enough to finish what it already promised to do, but the load balancer has already stopped counting on
          it for anything new. Users mid-request never notice; the instance disappears cleanly once it's empty.
        </p>
      </div>
    </section>
  `,
  styles: `
    .gs-scene {
      --running: #4ade80;
      --draining: var(--accent);
      --stopped: var(--danger);
      --idle: #64748b;
      --signal: #a78bfa;
      --resource: #60a5fa;
      --queue: #fbbf24;
      --cancelled: #f472b6;
    }

    .lb-node {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 14px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      background: var(--surface-elevated);
      max-width: 320px;
      margin: 0 auto;
    }
    .lb-label { font-weight: 700; letter-spacing: 0.06em; font-size: 0.8125rem; }

    .fan {
      position: relative;
      height: 36px;
      margin: 6px auto 0;
      max-width: 620px;
      display: flex;
      justify-content: space-between;
    }
    .fan-line {
      width: 1px;
      flex: 1;
      margin: 0 8px;
      background: repeating-linear-gradient(to bottom, var(--border-strong) 0 6px, transparent 6px 12px);
    }
    .fan-line.is-flowing {
      background: repeating-linear-gradient(to bottom, var(--draining) 0 6px, transparent 6px 12px);
      background-size: 100% 24px;
      animation: gs-flow 0.6s linear infinite;
    }
    @keyframes gs-flow {
      0% { background-position: 0 0; }
      100% { background-position: 0 24px; }
    }
    @media (prefers-reduced-motion: reduce) {
      .fan-line.is-flowing { animation: none; }
    }

    .servers-row {
      margin-top: 10px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 14px;
    }
    @media (min-width: 760px) {
      .servers-row { grid-template-columns: repeat(3, 1fr); }
    }

    .server-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 14px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
      transition: border-color 0.25s ease, opacity 0.25s ease;
      min-height: 150px;
    }
    .server-card.is-healthy { border-color: var(--running); }
    .server-card.is-draining { border-color: var(--draining); background: color-mix(in srgb, var(--draining) 8%, var(--surface)); }
    .server-card.is-stopped { border-color: var(--border); opacity: 0.55; }

    .server-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
    .server-label { font-size: 0.8125rem; font-weight: 700; letter-spacing: 0.06em; }

    .requests { display: flex; flex-direction: column; gap: 8px; }
    .req-row { display: flex; flex-direction: column; gap: 4px; }
    .req-label { font-size: 0.6875rem; color: var(--text-faint); }
    .req-track {
      width: 100%;
      height: 10px;
      border-radius: 999px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      overflow: hidden;
    }
    .req-fill { height: 100%; background: var(--resource); transition: width 0.15s linear; }
    .server-card.is-draining .req-fill { background: var(--draining); }

    .empty-line { margin: 0; color: var(--text-faint); font-size: 0.75rem; }
  `,
})
export class ConnectionDraining implements OnDestroy {
  private idCounter = 0;

  protected readonly serverA = signal<{ id: ServerId; status: ServerStatus; requests: InFlightRequest[] }>({
    id: 'a',
    status: 'healthy',
    requests: [],
  });
  protected readonly serverB = signal<{ id: ServerId; status: ServerStatus; requests: InFlightRequest[] }>({
    id: 'b',
    status: 'healthy',
    requests: [],
  });
  protected readonly serverC = signal<{ id: ServerId; status: ServerStatus; requests: InFlightRequest[] }>({
    id: 'c',
    status: 'healthy',
    requests: [],
  });

  protected readonly isRunning = signal(false);

  private tickHandle: ReturnType<typeof setInterval> | null = null;
  private trafficHandle: ReturnType<typeof setInterval> | null = null;

  ngOnDestroy(): void {
    this.clearTimers();
  }

  protected startTraffic(): void {
    if (this.isRunning()) return;
    this.isRunning.set(true);

    // seed some initial in-flight requests
    this.serverA.update((s) => ({ ...s, requests: [this.newRequest(), this.newRequest()] }));
    this.serverB.update((s) => ({ ...s, requests: [this.newRequest(), this.newRequest(), this.newRequest()] }));
    this.serverC.update((s) => ({ ...s, requests: [this.newRequest()] }));

    this.tickHandle = setInterval(() => this.tick(), TICK_MS);
    this.trafficHandle = setInterval(() => this.spawnTraffic(), NEW_TRAFFIC_INTERVAL_MS);
  }

  protected drainServerB(): void {
    if (this.serverB().status !== 'healthy') return;
    this.serverB.update((s) => ({ ...s, status: 'draining' }));
  }

  protected reset(): void {
    this.clearTimers();
    this.isRunning.set(false);
    this.serverA.set({ id: 'a', status: 'healthy', requests: [] });
    this.serverB.set({ id: 'b', status: 'healthy', requests: [] });
    this.serverC.set({ id: 'c', status: 'healthy', requests: [] });
  }

  private newRequest(): InFlightRequest {
    this.idCounter += 1;
    const id = this.idCounter;
    const label = 'Request ' + String.fromCharCode(64 + (((id - 1) % 26) + 1));
    return { id, label, progress: Math.random() * 15 };
  }

  private spawnTraffic(): void {
    // new traffic only ever routes to servers that are not draining/stopped
    if (this.serverA().status === 'healthy' && Math.random() < 0.7) {
      this.serverA.update((s) => ({ ...s, requests: [...s.requests, this.newRequest()].slice(-5) }));
    }
    if (this.serverC().status === 'healthy' && Math.random() < 0.7) {
      this.serverC.update((s) => ({ ...s, requests: [...s.requests, this.newRequest()].slice(-5) }));
    }
    if (this.serverB().status === 'healthy' && Math.random() < 0.7) {
      this.serverB.update((s) => ({ ...s, requests: [...s.requests, this.newRequest()].slice(-5) }));
    }
    // draining server B receives nothing new — intentionally no branch here
  }

  private tick(): void {
    this.serverA.update((s) => this.advance(s));
    this.serverC.update((s) => this.advance(s));

    const b = this.serverB();
    const advancedB = this.advance(b);
    this.serverB.set(advancedB);

    if (advancedB.status === 'draining' && advancedB.requests.length === 0) {
      this.serverB.update((s) => ({ ...s, status: 'stopped' }));
    }
  }

  private advance(s: { id: ServerId; status: ServerStatus; requests: InFlightRequest[] }) {
    const requests = s.requests
      .map((r) => ({ ...r, progress: Math.min(100, r.progress + (2 + Math.random() * 5)) }))
      .filter((r) => r.progress < 100);
    return { ...s, requests };
  }

  private clearTimers(): void {
    if (this.tickHandle) {
      clearInterval(this.tickHandle);
      this.tickHandle = null;
    }
    if (this.trafficHandle) {
      clearInterval(this.trafficHandle);
      this.trafficHandle = null;
    }
  }
}

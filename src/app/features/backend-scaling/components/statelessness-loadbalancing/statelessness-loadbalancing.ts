import { Component, computed, signal } from '@angular/core';

type FixMode = 'none' | 'sticky' | 'shared-store';
type Algorithm = 'round-robin' | 'least-connections' | 'weighted';

interface ServerState {
  id: number;
  weight: number;
  connections: number;
  down: boolean;
}

const INITIAL_SERVERS: ServerState[] = [
  { id: 1, weight: 2, connections: 0, down: false },
  { id: 2, weight: 1, connections: 0, down: false },
  { id: 3, weight: 1, connections: 0, down: false },
];

@Component({
  selector: 'app-statelessness-loadbalancing',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="statelessness-loadbalancing">
      <div class="container">
        <p class="lab-index">18 — STATELESSNESS &amp; LOAD BALANCING</p>
        <h2 class="lab-title">If any server can handle any request, no single server can be the only one who "remembers."</h2>
        <p class="lab-lede">
          Horizontal scaling only works cleanly when requests can land anywhere. That forces a question: where
          does per-user state actually live?
        </p>

        <div class="lab-panel">
          <p class="part-heading mono">PART A — STATELESSNESS</p>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn" [class.is-active]="fixMode() === 'none'" (click)="fixMode.set('none')">
              1. In-memory (broken)
            </button>
            <button type="button" class="lab-btn" [class.is-active]="fixMode() === 'sticky'" (click)="fixMode.set('sticky')">
              2. Sticky sessions
            </button>
            <button type="button" class="lab-btn lab-btn-primary" [class.is-active]="fixMode() === 'shared-store'" (click)="fixMode.set('shared-store')">
              3. Shared store
            </button>
          </div>

          @if (fixMode() === 'none') {
            <div class="state-stage">
              <div class="state-server">
                <p class="lab-node">SERVER 1</p>
                <div class="memory-box has-data">
                  <p class="mono mem-line">User → Cart</p>
                  <p class="mono mem-line dim">[bread, milk]</p>
                </div>
              </div>
              <div class="flow-arrow-col">
                <span class="lab-flow-arrow">next request →</span>
              </div>
              <div class="state-server">
                <p class="lab-node">SERVER 2</p>
                <div class="memory-box is-empty">
                  <p class="mono mem-line crit-text">"I don't know this user"</p>
                </div>
              </div>
            </div>
            <p class="lab-note lab-note-warn">
              The cart lived only in Server 1's local memory. The load balancer sent the follow-up request to
              Server 2, which has never seen this user — the cart is effectively gone.
            </p>
          }

          @if (fixMode() === 'sticky') {
            <div class="state-stage">
              <div class="state-server is-pinned">
                <p class="lab-node">SERVER 1 <span class="pill pill-yes">PINNED</span></p>
                <div class="memory-box has-data">
                  <p class="mono mem-line">User → Cart</p>
                  <p class="mono mem-line dim">[bread, milk]</p>
                </div>
              </div>
              <div class="flow-arrow-col">
                <span class="lab-flow-arrow">always routed here →</span>
              </div>
              <div class="state-server is-inactive">
                <p class="lab-node">SERVER 2</p>
                <div class="memory-box is-empty">
                  <p class="mono mem-line dim">never receives this user's traffic</p>
                </div>
              </div>
            </div>
            <p class="lab-note lab-note-warn">
              Sticky sessions route the same user to the same server every time, so the in-memory cart keeps
              working — <strong>but it's a partial fix</strong>. If Server 1 crashes or restarts, that user's cart
              is still gone, and it also means the load balancer can no longer freely spread that user's traffic.
            </p>
          }

          @if (fixMode() === 'shared-store') {
            <div class="shared-stage">
              <div class="shared-servers">
                @for (id of [1, 2, 3]; track id) {
                  <div class="state-server compact">
                    <p class="lab-node">SERVER {{ id }}</p>
                    <div class="memory-box no-local">
                      <p class="mono mem-line dim">no local cart data</p>
                    </div>
                  </div>
                }
              </div>
              <div class="store-arrows" aria-hidden="true">
                <span class="lab-flow-arrow">read / write ↕</span>
              </div>
              <div class="store-box">
                <p class="lab-node store-label">SHARED STORE — REDIS / DB</p>
                <p class="mono mem-line">User → Cart</p>
                <p class="mono mem-line dim">[bread, milk]</p>
              </div>
            </div>
            <p class="lab-note">
              Now the cart lives outside every application instance. Any of the three servers can read or write
              it, so any server can correctly handle any request from this user.
            </p>
          }

          <p class="lab-note">
            <strong>Stateless application instances make horizontal scaling much easier</strong> — but that doesn't
            mean every backend is fully stateless. The shared store itself still holds state; it's just been
            centralized into one place designed for that job, instead of scattered across app servers.
          </p>
        </div>

        <div class="lab-panel">
          <p class="part-heading mono">PART B — LOAD BALANCING ALGORITHMS</p>

          <div class="lb-flow mono">
            <span class="lab-node">CLIENTS</span>
            <span class="lab-flow-arrow">→</span>
            <span class="lab-node lb-node">LOAD BALANCER</span>
            <span class="lab-flow-arrow">→</span>
            <span class="lab-node">SERVER 1 / 2 / 3</span>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn" [class.is-active]="algorithm() === 'round-robin'" (click)="setAlgorithm('round-robin')">
              Round robin
            </button>
            <button type="button" class="lab-btn" [class.is-active]="algorithm() === 'least-connections'" (click)="setAlgorithm('least-connections')">
              Least connections
            </button>
            <button type="button" class="lab-btn" [class.is-active]="algorithm() === 'weighted'" (click)="setAlgorithm('weighted')">
              Weighted
            </button>
          </div>

          <div class="servers-row">
            @for (s of servers(); track s.id) {
              <div class="lb-server" [class.is-down]="s.down">
                <p class="lab-node">
                  SERVER {{ s.id }}
                  @if (s.down) {
                    <span class="pill pill-no">DOWN</span>
                  } @else if (algorithm() === 'weighted') {
                    <span class="pill pill-conditional">×{{ s.weight }}</span>
                  }
                </p>
                <div class="lb-server-box" [class.pulse]="lastHitServer() === s.id">
                  <p class="mono conn-count">connections: {{ s.connections }}</p>
                  <p class="mono dot-count">requests received: {{ receivedCount(s.id) }}</p>
                </div>
              </div>
            }
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [class.is-active]="running()" (click)="toggleRun()">
              {{ running() ? 'Stop traffic' : 'Send traffic' }}
            </button>
            <button type="button" class="lab-btn lab-btn-danger" [class.is-active]="server2Down()" (click)="toggleKillServer2()">
              {{ server2Down() ? 'Restart Server 2' : 'Kill Server 2' }}
            </button>
            <button type="button" class="lab-btn" (click)="resetCounts()">Reset counters</button>
          </div>

          @if (server2Down()) {
            <p class="lab-note lab-note-warn">
              Server 2 is down. A <strong>health check</strong> — the load balancer periodically pinging each
              server — is what detects this and stops routing new traffic to it. Remaining traffic now
              redistributes across servers 1 and 3 only.
            </p>
          }

          <p class="lab-note">
            @if (algorithm() === 'round-robin') {
              <strong>Round robin:</strong> requests cycle 1 → 2 → 3 → 1 in strict rotation. Simple and even, but
              it assumes every request costs roughly the same amount of work.
            } @else if (algorithm() === 'least-connections') {
              <strong>Least connections:</strong> each request goes to whichever healthy server currently has the
              fewest active connections. Adapts well when requests have very uneven cost.
            } @else {
              <strong>Weighted:</strong> servers are assigned different weights (Server 1 here is 2×), so it
              receives roughly twice the traffic. Useful when servers have different capacity.
            }
            No single algorithm is universally best — the right choice depends on whether your servers and
            requests are actually uniform.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      --ok: #4ade80;
      --warn: var(--accent);
      --crit: var(--danger);
      --c-client: var(--accent-2);
      --c-compute: #60a5fa;
      --c-db: #a78bfa;
      --c-cache: #2dd4bf;
      --c-queue: #fbbf24;
      display: block;
    }

    .part-heading { color: var(--accent-2); font-size: 0.75rem; letter-spacing: 0.1em; }

    .state-stage {
      margin-top: 22px;
      display: flex;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
    }
    .state-server { flex: 1 1 200px; }
    .state-server.compact { flex: 1 1 140px; }
    .flow-arrow-col { text-align: center; color: var(--text-faint); font-size: 0.75rem; font-family: var(--font-mono); flex: 0 0 auto; }

    .memory-box {
      margin-top: 8px;
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      padding: 14px;
      min-height: 60px;
    }
    .memory-box.has-data { border-color: var(--c-compute); }
    .memory-box.is-empty { border-color: var(--crit); background: color-mix(in srgb, var(--crit) 8%, var(--surface)); }
    .memory-box.no-local { border-style: dashed; opacity: 0.7; }

    .mem-line { font-size: 0.8125rem; color: var(--text); }
    .mem-line.dim { color: var(--text-faint); }
    .mem-line.crit-text { color: var(--crit); font-weight: 600; }

    .state-server.is-pinned .memory-box { box-shadow: 0 0 14px color-mix(in srgb, var(--c-compute) 30%, transparent); }
    .state-server.is-inactive { opacity: 0.55; }

    .shared-stage { margin-top: 22px; display: flex; flex-direction: column; gap: 14px; align-items: center; }
    .shared-servers { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; width: 100%; }
    .store-arrows { color: var(--text-faint); font-size: 0.75rem; font-family: var(--font-mono); }
    .store-box {
      background: var(--surface);
      border: 1px solid var(--c-db);
      border-radius: var(--radius-md);
      padding: 16px 20px;
      box-shadow: 0 0 16px color-mix(in srgb, var(--c-db) 28%, transparent);
      text-align: center;
    }
    .store-label { color: var(--c-db); }

    .lb-flow {
      margin-top: 22px;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      font-size: 0.8125rem;
    }
    .lb-node { color: var(--accent-2); }

    .servers-row { margin-top: 20px; display: flex; gap: 16px; flex-wrap: wrap; }
    .lb-server { flex: 1 1 160px; }
    .lb-server-box {
      margin-top: 8px;
      background: var(--surface);
      border: 1px solid var(--c-compute);
      border-radius: var(--radius-md);
      padding: 14px;
      transition: box-shadow 0.3s ease;
    }
    .lb-server-box.pulse { box-shadow: 0 0 16px color-mix(in srgb, var(--c-compute) 45%, transparent); }
    .lb-server.is-down .lb-server-box { border-color: var(--crit); opacity: 0.4; box-shadow: none; }

    .conn-count, .dot-count { font-size: 0.75rem; color: var(--text-muted); }

    @media (min-width: 640px) {
      .state-stage { flex-wrap: nowrap; }
    }
  `,
})
export class StatelessnessLoadbalancing {
  protected readonly fixMode = signal<FixMode>('none');

  protected readonly algorithm = signal<Algorithm>('round-robin');
  protected readonly servers = signal<ServerState[]>(INITIAL_SERVERS.map((s) => ({ ...s })));
  protected readonly server2Down = computed(() => this.servers().find((s) => s.id === 2)?.down ?? false);
  protected readonly running = signal(false);
  protected readonly lastHitServer = signal<number | null>(null);
  protected readonly received = signal<Record<number, number>>({ 1: 0, 2: 0, 3: 0 });

  private rrIndex = 0;
  private timer: ReturnType<typeof setInterval> | null = null;

  receivedCount(id: number): number {
    return this.received()[id] ?? 0;
  }

  setAlgorithm(a: Algorithm): void {
    this.algorithm.set(a);
    this.resetCounts();
  }

  toggleRun(): void {
    if (this.running()) {
      this.stopRun();
      return;
    }
    this.running.set(true);
    this.timer = setInterval(() => this.dispatchOne(), 450);
  }

  private stopRun(): void {
    this.running.set(false);
    this.lastHitServer.set(null);
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private dispatchOne(): void {
    const healthy = this.servers().filter((s) => !s.down);
    if (healthy.length === 0) return;

    let chosen: ServerState;
    if (this.algorithm() === 'round-robin') {
      chosen = healthy[this.rrIndex % healthy.length];
      this.rrIndex++;
    } else if (this.algorithm() === 'least-connections') {
      chosen = [...healthy].sort((a, b) => a.connections - b.connections)[0];
    } else {
      const pool: ServerState[] = [];
      for (const s of healthy) {
        for (let i = 0; i < s.weight; i++) pool.push(s);
      }
      chosen = pool[this.rrIndex % pool.length];
      this.rrIndex++;
    }

    this.lastHitServer.set(chosen.id);
    this.servers.update((list) =>
      list.map((s) => (s.id === chosen.id ? { ...s, connections: s.connections + 1 } : s)),
    );
    this.received.update((r) => ({ ...r, [chosen.id]: (r[chosen.id] ?? 0) + 1 }));

    // simulate connections closing over time so least-connections stays meaningful
    setTimeout(() => {
      this.servers.update((list) =>
        list.map((s) => (s.id === chosen.id ? { ...s, connections: Math.max(0, s.connections - 1) } : s)),
      );
    }, 1400);
  }

  toggleKillServer2(): void {
    const nextDown = !this.server2Down();
    this.servers.update((list) => list.map((s) => (s.id === 2 ? { ...s, down: nextDown, connections: 0 } : s)));
  }

  resetCounts(): void {
    this.rrIndex = 0;
    this.received.set({ 1: 0, 2: 0, 3: 0 });
    this.servers.update((list) => list.map((s) => ({ ...s, connections: 0 })));
  }
}

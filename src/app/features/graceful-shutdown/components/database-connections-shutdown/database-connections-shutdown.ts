import { Component, OnDestroy, computed, signal } from '@angular/core';

type ConnStatus = 'idle' | 'busy' | 'draining' | 'closing' | 'closed' | 'aborted';
type PoolPhase = 'running' | 'stopping-new-work' | 'closing' | 'closed';

interface Connection {
  id: number;
  label: string;
  status: ConnStatus;
  progress: number;
}

const TICK_MS = 160;
const PROGRESS_PER_TICK = 3.2;
const CLOSE_STAGGER_MS = 380;

@Component({
  selector: 'app-database-connections-shutdown',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="gs-db-connections">
      <div class="container">
        <p class="lab-index">18 — DATABASE CONNECTIONS</p>
        <h2 class="lab-title">Closing a connection pool without breaking anything</h2>
        <p class="lab-lede">
          A connection pool is shared by every in-flight request. Shutting it down safely means stopping new work
          first, letting whatever queries are already running finish, and only then closing each connection —
          never the other way around.
        </p>

        <div class="lab-panel gs-scene db-scene">
          <p class="lab-node">API SERVER &rarr; CONNECTION POOL &rarr; DB1 · DB2 · DB3 · DB4</p>

          <div class="db-topology">
            <div class="db-node db-api">
              <span class="mono">API SERVER</span>
              <span class="pill" [class.pill-no]="poolPhase() !== 'running'" [class.pill-yes]="poolPhase() === 'running'">
                {{ poolPhase() === 'running' ? 'ACCEPTING NEW QUERIES' : 'NEW QUERIES BLOCKED' }}
              </span>
            </div>
            <span class="lab-flow-arrow db-arrow" aria-hidden="true">&rarr;</span>
            <div class="db-node db-pool" [class]="'phase-' + poolPhase()">
              <span class="mono">CONNECTION POOL</span>
              <span class="pill" [class]="poolPillClass()">{{ poolPhaseLabel() }}</span>
            </div>
            <span class="lab-flow-arrow db-arrow" aria-hidden="true">&rarr;</span>

            <div class="db-conns" role="list" aria-label="Database connections">
              @for (c of connections(); track c.id) {
                <div class="db-conn" role="listitem" [class]="'status-' + c.status">
                  <span class="mono db-conn-label">{{ c.label }}</span>
                  @switch (c.status) {
                    @case ('idle') { <span class="pill pill-yes">IDLE</span> }
                    @case ('busy') { <span class="pill pill-conditional">QUERY RUNNING</span> }
                    @case ('draining') { <span class="pill pill-conditional">FINISHING QUERY</span> }
                    @case ('closing') { <span class="pill">CLOSING&hellip;</span> }
                    @case ('closed') { <span class="pill pill-no">CLOSED</span> }
                    @case ('aborted') { <span class="pill pill-no">ABORTED &mdash; UNKNOWN STATE</span> }
                  }
                  @if (c.status === 'busy' || c.status === 'draining') {
                    <div class="db-bar-track" role="img" [attr.aria-label]="'Query progress ' + c.progress.toFixed(0) + ' percent'">
                      <div class="db-bar-fill" [style.width.%]="c.progress"></div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="poolPhase() !== 'running'" (click)="triggerGracefulShutdown()">
              Trigger graceful shutdown
            </button>
            <button type="button" class="lab-btn lab-btn-danger" [disabled]="poolPhase() === 'closed'" (click)="forceCloseNow()">
              Force close now (unsafe)
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>
        </div>

        <p class="lab-note">
          Closing a connection while a query is still running on it does not just cancel that query cleanly — it
          can sever the socket mid-statement, leaving a transaction partially applied, a lock held longer than it
          should be, or the client with no idea whether its write landed. That is why the safe order is always:
          stop handing out new work &rarr; let in-flight operations finish &rarr; only then close the connection.
          Closing early trades a slightly longer shutdown for queries that fail unpredictably instead of finishing
          or being cleanly rejected.
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

    .db-topology {
      margin-top: 22px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      flex-wrap: wrap;
    }

    .db-node {
      flex: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 14px;
      min-width: 140px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
      text-align: center;
      transition: border-color 0.2s ease, background 0.2s ease;
    }
    .db-pool.phase-stopping-new-work { border-color: var(--draining); }
    .db-pool.phase-closing { border-color: var(--queue); }
    .db-pool.phase-closed { border-color: var(--stopped); background: color-mix(in srgb, var(--stopped) 8%, var(--surface)); }

    .db-arrow { align-self: center; color: var(--text-faint); }

    .db-conns {
      flex: 1;
      min-width: 240px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    @media (min-width: 720px) {
      .db-conns { grid-template-columns: repeat(4, 1fr); }
    }

    .db-conn {
      padding: 12px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: border-color 0.2s ease, background 0.2s ease;
    }
    .db-conn-label { color: var(--text); font-size: 0.8125rem; }
    .db-conn.status-busy { border-color: var(--running); }
    .db-conn.status-draining { border-color: var(--draining); background: color-mix(in srgb, var(--draining) 8%, var(--surface)); }
    .db-conn.status-closing { border-color: var(--queue); background: color-mix(in srgb, var(--queue) 8%, var(--surface)); }
    .db-conn.status-closed { border-color: var(--border); background: var(--surface-raised); opacity: 0.6; }
    .db-conn.status-aborted { border-color: var(--stopped); background: color-mix(in srgb, var(--stopped) 12%, var(--surface)); }

    .db-bar-track {
      width: 100%;
      height: 8px;
      border-radius: 999px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      overflow: hidden;
    }
    .db-bar-fill { height: 100%; background: var(--running); transition: width 0.14s linear; }
    .db-conn.status-draining .db-bar-fill { background: var(--draining); }

    @media (max-width: 640px) {
      .db-topology { flex-direction: column; }
      .db-arrow { transform: rotate(90deg); }
    }

    @media (prefers-reduced-motion: reduce) {
      .db-bar-fill { transition: none; }
    }
  `,
})
export class DatabaseConnectionsShutdown implements OnDestroy {
  protected readonly connections = signal<Connection[]>(this.initialConnections());
  protected readonly poolPhase = signal<PoolPhase>('running');

  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private closeTimers: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    this.tickInterval = setInterval(() => this.tick(), TICK_MS);
  }

  private initialConnections(): Connection[] {
    return [
      { id: 1, label: 'DB1', status: 'busy', progress: 30 },
      { id: 2, label: 'DB2', status: 'idle', progress: 0 },
      { id: 3, label: 'DB3', status: 'busy', progress: 62 },
      { id: 4, label: 'DB4', status: 'busy', progress: 8 },
    ];
  }

  protected poolPhaseLabel(): string {
    switch (this.poolPhase()) {
      case 'running':
        return 'RUNNING';
      case 'stopping-new-work':
        return 'DRAINING IN-FLIGHT QUERIES';
      case 'closing':
        return 'CLOSING CONNECTIONS';
      case 'closed':
        return 'CLOSED';
    }
  }

  protected poolPillClass(): string {
    switch (this.poolPhase()) {
      case 'running':
        return 'pill-yes';
      case 'closed':
        return 'pill-no';
      default:
        return 'pill-conditional';
    }
  }

  private tick(): void {
    const phase = this.poolPhase();
    let anyBusyLeft = false;

    const next = this.connections().map((c) => {
      if (c.status === 'busy' || c.status === 'draining') {
        const p = Math.min(100, c.progress + PROGRESS_PER_TICK);
        if (p >= 100) {
          if (phase === 'running') {
            // Query finished during normal operation — occasionally pick up new work.
            const startsNew = Math.random() < 0.5;
            return startsNew
              ? { ...c, status: 'busy' as const, progress: 0 }
              : { ...c, status: 'idle' as const, progress: 0 };
          }
          // Shutting down: this connection is now safe to close.
          return { ...c, status: 'idle' as const, progress: 0 };
        }
        anyBusyLeft = true;
        return { ...c, progress: p, status: (phase === 'running' ? 'busy' : 'draining') as ConnStatus };
      }
      if (c.status === 'idle' && phase === 'running' && Math.random() < 0.04) {
        return { ...c, status: 'busy' as const, progress: 0 };
      }
      return c;
    });

    this.connections.set(next);

    if ((phase === 'stopping-new-work') && !anyBusyLeft) {
      this.beginClosing();
    }
  }

  protected triggerGracefulShutdown(): void {
    if (this.poolPhase() !== 'running') return;
    this.poolPhase.set('stopping-new-work');
    // Any connection currently mid-query switches into "finishing, no new work after" mode.
    this.connections.update((list) =>
      list.map((c) => (c.status === 'busy' ? { ...c, status: 'draining' } : c)),
    );
    const stillBusy = this.connections().some((c) => c.status === 'draining');
    if (!stillBusy) {
      this.beginClosing();
    }
  }

  private beginClosing(): void {
    if (this.poolPhase() === 'closing' || this.poolPhase() === 'closed') return;
    this.poolPhase.set('closing');
    const ids = this.connections().map((c) => c.id);
    ids.forEach((id, i) => {
      this.closeTimers.push(
        setTimeout(() => {
          this.connections.update((list) => list.map((c) => (c.id === id ? { ...c, status: 'closing' } : c)));
        }, i * CLOSE_STAGGER_MS),
      );
      this.closeTimers.push(
        setTimeout(() => {
          this.connections.update((list) => list.map((c) => (c.id === id ? { ...c, status: 'closed' } : c)));
          if (id === ids[ids.length - 1]) {
            this.poolPhase.set('closed');
          }
        }, i * CLOSE_STAGGER_MS + 260),
      );
    });
  }

  protected forceCloseNow(): void {
    this.clearCloseTimers();
    this.connections.update((list) =>
      list.map((c) => {
        if (c.status === 'busy' || c.status === 'draining') {
          return { ...c, status: 'aborted' };
        }
        if (c.status !== 'closed') {
          return { ...c, status: 'closed' };
        }
        return c;
      }),
    );
    this.poolPhase.set('closed');
  }

  protected reset(): void {
    this.clearCloseTimers();
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
    }
    this.connections.set(this.initialConnections());
    this.poolPhase.set('running');
    this.tickInterval = setInterval(() => this.tick(), TICK_MS);
  }

  ngOnDestroy(): void {
    if (this.tickInterval) clearInterval(this.tickInterval);
    this.clearCloseTimers();
  }

  private clearCloseTimers(): void {
    this.closeTimers.forEach((t) => clearTimeout(t));
    this.closeTimers = [];
  }
}

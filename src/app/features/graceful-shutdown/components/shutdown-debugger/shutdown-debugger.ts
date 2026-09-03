import { Component, OnDestroy, computed, signal } from '@angular/core';

type ProcessStatus = 'RUNNING' | 'DRAINING' | 'EXITED';
type ReqState = 'ACTIVE' | 'WAITING' | 'COMPLETED' | 'CANCELLED';

interface DebugRequest {
  id: number;
  state: ReqState;
  waitingFor: string;
  elapsedMs: number;
  cancellationSupported: boolean;
}

const WAIT_TARGETS = ['External API', 'Database query', 'Queue publish', 'File write', 'Downstream service'];

function buildRequests(): DebugRequest[] {
  const list: DebugRequest[] = [];
  for (let i = 0; i < 8; i++) {
    const active = i < 5;
    list.push({
      id: 1820 + i,
      state: active ? 'ACTIVE' : 'WAITING',
      waitingFor: active ? '—' : WAIT_TARGETS[i % WAIT_TARGETS.length],
      elapsedMs: 400 + Math.floor(Math.random() * 6000),
      cancellationSupported: i % 3 !== 0,
    });
  }
  return list;
}

@Component({
  selector: 'app-shutdown-debugger',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section gs-scene dbg-scene" id="gs-debugger">
      <div class="container">
        <p class="lab-index">29 — THE SHUTDOWN DEBUGGER</p>
        <h2 class="lab-title">What a process actually sees while it shuts down.</h2>
        <p class="lab-lede">
          A simplified devtools-style view into a running process. Trigger shutdown, watch the signal and deadline
          arrive, and drill into any individual request to see exactly what it's waiting for.
        </p>

        <div class="lab-panel dbg-panel">
          <div class="dbg-header">
            <div class="dbg-header-field">
              <span class="dbg-header-label mono">PROCESS</span>
              <span class="dbg-header-value mono">api-server</span>
            </div>
            <div class="dbg-header-field">
              <span class="dbg-header-label mono">PID</span>
              <span class="dbg-header-value mono">{{ pid }}</span>
            </div>
            <div class="dbg-header-field">
              <span class="dbg-header-label mono">STATUS</span>
              <span class="pill dbg-status-pill" [attr.data-status]="status()">{{ status() }}</span>
            </div>
            <div class="dbg-header-field dbg-signal-field">
              <span class="dbg-header-label mono">SIGNAL</span>
              @if (signal_(); as sig) {
                <span class="dbg-signal-value mono">{{ sig }}</span>
              } @else {
                <span class="dbg-header-value mono dbg-dim">none</span>
              }
            </div>
            <div class="dbg-header-field dbg-deadline-field">
              <span class="dbg-header-label mono">DEADLINE</span>
              @if (status() !== 'RUNNING') {
                <span class="dbg-deadline-value mono" [class.dbg-deadline-critical]="deadlineRemaining() <= 5">
                  {{ deadlineRemaining().toFixed(1) }} sec
                </span>
              } @else {
                <span class="dbg-header-value mono dbg-dim">—</span>
              }
            </div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="status() !== 'RUNNING'" (click)="triggerShutdown()">
              TRIGGER SHUTDOWN
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>
        </div>

        <div class="dbg-grid">
          <div class="lab-panel dbg-section-panel">
            <h3 class="dbg-section-title mono">REQUESTS</h3>
            <div class="dbg-stat-row">
              <div class="dbg-stat"><span class="dbg-stat-value mono">{{ activeCount() }}</span><span class="dbg-stat-label mono">Active</span></div>
              <div class="dbg-stat"><span class="dbg-stat-value mono">{{ waitingCount() }}</span><span class="dbg-stat-label mono">Waiting</span></div>
              <div class="dbg-stat"><span class="dbg-stat-value mono">{{ completedCount() }}</span><span class="dbg-stat-label mono">Completed</span></div>
              <div class="dbg-stat"><span class="dbg-stat-value mono">{{ cancelledCount() }}</span><span class="dbg-stat-label mono">Cancelled</span></div>
            </div>

            <ul class="dbg-req-list" role="list" aria-label="Individual requests">
              @for (req of requests(); track req.id) {
                <li>
                  <button
                    type="button"
                    class="dbg-req-row"
                    [class.is-selected]="selectedId() === req.id"
                    [attr.data-state]="req.state"
                    (click)="select(req.id)"
                  >
                    <span class="dbg-req-dot" aria-hidden="true"></span>
                    <span class="mono dbg-req-id">Request #{{ req.id }}</span>
                    <span class="mono dbg-req-state">{{ req.state }}</span>
                  </button>
                </li>
              }
            </ul>
          </div>

          <div class="lab-panel dbg-section-panel">
            <h3 class="dbg-section-title mono">RESOURCES</h3>
            <div class="dbg-resource-list">
              <div class="dbg-resource-row">
                <span class="dbg-resource-label mono">DB connections</span>
                <span class="dbg-resource-value mono">{{ resources().db }}</span>
              </div>
              <div class="dbg-resource-row">
                <span class="dbg-resource-label mono">Sockets</span>
                <span class="dbg-resource-value mono">{{ resources().sockets }}</span>
              </div>
              <div class="dbg-resource-row">
                <span class="dbg-resource-label mono">Workers</span>
                <span class="dbg-resource-value mono">{{ resources().workers }}</span>
              </div>
              <div class="dbg-resource-row">
                <span class="dbg-resource-label mono">Queue consumers</span>
                <span class="dbg-resource-value mono">{{ resources().queueConsumers }}</span>
              </div>
            </div>

            @if (selectedRequest(); as req) {
              <div class="dbg-drawer" aria-live="polite">
                <div class="dbg-drawer-head">
                  <span class="mono dbg-drawer-title">Request #{{ req.id }}</span>
                  <button type="button" class="dbg-drawer-close" (click)="select(null)" aria-label="Close detail panel">✕</button>
                </div>
                <dl class="dbg-drawer-grid">
                  <dt class="mono">STATE</dt>
                  <dd class="mono">{{ req.state }}</dd>
                  <dt class="mono">WAITING FOR</dt>
                  <dd class="mono">{{ req.waitingFor }}</dd>
                  <dt class="mono">TIME</dt>
                  <dd class="mono">{{ (req.elapsedMs / 1000).toFixed(1) }} sec</dd>
                  <dt class="mono">CANCELLATION</dt>
                  <dd>
                    <span class="pill" [class.pill-yes]="req.cancellationSupported" [class.pill-no]="!req.cancellationSupported">
                      {{ req.cancellationSupported ? 'SUPPORTED' : 'NOT SUPPORTED' }}
                    </span>
                  </dd>
                </dl>
              </div>
            } @else {
              <p class="lab-note dbg-hint">Select a request on the left to inspect its live state.</p>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .dbg-scene {
      --running: #4ade80;
      --draining: var(--accent);
      --stopped: var(--danger);
      --idle: #64748b;
      --signal: #a78bfa;
      --resource: #60a5fa;
      --queue: #fbbf24;
      --cancelled: #f472b6;
    }

    .dbg-panel { font-family: var(--font-mono); }
    .dbg-header {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px 20px;
    }
    @media (min-width: 640px) { .dbg-header { grid-template-columns: repeat(5, auto); align-items: center; } }

    .dbg-header-field { display: flex; flex-direction: column; gap: 4px; }
    .dbg-header-label { font-size: 0.625rem; color: var(--text-faint); letter-spacing: 0.08em; }
    .dbg-header-value { font-size: 0.875rem; color: var(--text); }
    .dbg-dim { color: var(--text-faint); }

    .dbg-status-pill { width: fit-content; }
    .dbg-status-pill[data-status='RUNNING'] { color: var(--running); border-color: color-mix(in srgb, var(--running) 50%, var(--border-strong)); }
    .dbg-status-pill[data-status='DRAINING'] { color: var(--draining); border-color: color-mix(in srgb, var(--draining) 50%, var(--border-strong)); }
    .dbg-status-pill[data-status='EXITED'] { color: var(--stopped); border-color: color-mix(in srgb, var(--stopped) 50%, var(--border-strong)); }

    .dbg-signal-value { color: var(--signal); font-weight: 700; font-size: 0.9375rem; }
    .dbg-deadline-value { color: var(--draining); font-weight: 700; font-size: 0.9375rem; }
    .dbg-deadline-critical { color: var(--stopped); animation: dbgBlink 0.8s ease-in-out infinite; }
    @keyframes dbgBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
    @media (prefers-reduced-motion: reduce) { .dbg-deadline-critical { animation: none; } }

    .dbg-grid { margin-top: 20px; display: grid; grid-template-columns: 1fr; gap: 20px; }
    @media (min-width: 900px) { .dbg-grid { grid-template-columns: 1fr 1fr; } }
    .dbg-section-panel { margin-top: 0; }
    .dbg-section-title { font-size: 0.75rem; letter-spacing: 0.08em; color: var(--text-faint); margin: 0; }

    .dbg-stat-row { margin-top: 14px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .dbg-stat { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 6px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); }
    .dbg-stat-value { font-size: 1.125rem; color: var(--text); font-weight: 700; }
    .dbg-stat-label { font-size: 0.625rem; color: var(--text-faint); }

    .dbg-req-list { list-style: none; margin: 14px 0 0; padding: 0; display: flex; flex-direction: column; gap: 6px; max-height: 320px; overflow-y: auto; }
    .dbg-req-row {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      background: var(--surface-elevated);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      color: var(--text-muted);
      cursor: pointer;
      transition: border-color 0.2s ease, background 0.2s ease;
      text-align: left;
    }
    .dbg-req-row:hover { border-color: var(--accent-2-dim); }
    .dbg-req-row.is-selected { border-color: var(--accent-2); background: color-mix(in srgb, var(--accent-2) 10%, var(--surface-elevated)); }
    .dbg-req-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--idle); flex-shrink: 0; }
    .dbg-req-row[data-state='ACTIVE'] .dbg-req-dot { background: var(--running); }
    .dbg-req-row[data-state='WAITING'] .dbg-req-dot { background: var(--draining); }
    .dbg-req-row[data-state='COMPLETED'] .dbg-req-dot { background: var(--resource); }
    .dbg-req-row[data-state='CANCELLED'] .dbg-req-dot { background: var(--cancelled); }
    .dbg-req-id { font-size: 0.75rem; flex: 1; color: var(--text); }
    .dbg-req-state { font-size: 0.6875rem; color: var(--text-faint); }

    .dbg-resource-list { margin-top: 14px; display: flex; flex-direction: column; gap: 6px; }
    .dbg-resource-row { display: flex; align-items: center; justify-content: space-between; padding: 9px 12px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); }
    .dbg-resource-label { font-size: 0.75rem; color: var(--text-muted); }
    .dbg-resource-value { font-size: 0.875rem; color: var(--resource); font-weight: 700; }

    .dbg-drawer { margin-top: 18px; padding: 14px 16px; background: var(--surface); border: 1px solid var(--accent-2-dim); border-radius: var(--radius-md); }
    .dbg-drawer-head { display: flex; align-items: center; justify-content: space-between; }
    .dbg-drawer-title { font-size: 0.8125rem; color: var(--accent-2); }
    .dbg-drawer-close { background: none; border: none; color: var(--text-faint); cursor: pointer; font-size: 0.875rem; padding: 2px 6px; }
    .dbg-drawer-close:hover { color: var(--text); }
    .dbg-drawer-grid { margin: 12px 0 0; display: grid; grid-template-columns: auto 1fr; gap: 8px 14px; }
    .dbg-drawer-grid dt { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.04em; }
    .dbg-drawer-grid dd { margin: 0; font-size: 0.8125rem; color: var(--text); }

    .dbg-hint { margin-top: 18px; }
  `,
})
export class ShutdownDebugger implements OnDestroy {
  protected readonly pid = 41822;

  protected readonly status = signal<ProcessStatus>('RUNNING');
  protected readonly signal_ = signal<string | null>(null);
  protected readonly deadlineRemaining = signal(20);
  protected readonly requests = signal<DebugRequest[]>(buildRequests());
  protected readonly selectedId = signal<number | null>(null);

  protected readonly resources = signal({ db: 12, sockets: 48, workers: 6, queueConsumers: 3 });

  private deadlineTimer: ReturnType<typeof setInterval> | null = null;
  private liveTimer: ReturnType<typeof setInterval> | null = null;
  private workTimers: ReturnType<typeof setTimeout>[] = [];

  protected readonly activeCount = computed(() => this.requests().filter((r) => r.state === 'ACTIVE').length);
  protected readonly waitingCount = computed(() => this.requests().filter((r) => r.state === 'WAITING').length);
  protected readonly completedCount = computed(() => this.requests().filter((r) => r.state === 'COMPLETED').length);
  protected readonly cancelledCount = computed(() => this.requests().filter((r) => r.state === 'CANCELLED').length);

  protected readonly selectedRequest = computed(() => {
    const id = this.selectedId();
    if (id === null) return null;
    return this.requests().find((r) => r.id === id) ?? null;
  });

  ngOnDestroy(): void {
    this.clearAllTimers();
  }

  protected select(id: number | null): void {
    this.selectedId.set(id);
  }

  protected triggerShutdown(): void {
    if (this.status() !== 'RUNNING') return;
    this.status.set('DRAINING');
    this.signal_.set('SIGTERM');
    this.deadlineRemaining.set(20);

    this.deadlineTimer = setInterval(() => {
      const next = Math.max(0, this.deadlineRemaining() - 0.2);
      this.deadlineRemaining.set(next);
      if (next <= 0) {
        this.forceExit();
      }
    }, 200);

    // Requests progress toward completion/cancellation over the deadline window.
    for (const req of this.requests()) {
      const delay = 800 + Math.random() * 12000;
      const t = setTimeout(() => {
        if (this.status() === 'EXITED') return;
        this.requests.update((list) =>
          list.map((r) => {
            if (r.id !== req.id) return r;
            const nextState: ReqState = r.cancellationSupported && Math.random() < 0.2 ? 'CANCELLED' : 'COMPLETED';
            return { ...r, state: nextState };
          }),
        );
      }, Math.min(delay, 18000));
      this.workTimers.push(t);
    }

    // Live-tick elapsed time and resource drawdown while draining.
    this.liveTimer = setInterval(() => {
      this.requests.update((list) =>
        list.map((r) => (r.state === 'ACTIVE' || r.state === 'WAITING' ? { ...r, elapsedMs: r.elapsedMs + 200 } : r)),
      );
      const remaining = this.requests().filter((r) => r.state === 'ACTIVE' || r.state === 'WAITING').length;
      if (remaining === 0 && this.status() === 'DRAINING') {
        this.forceExit();
      } else {
        const total = this.requests().length || 1;
        const frac = remaining / total;
        this.resources.set({
          db: Math.max(0, Math.round(12 * frac)),
          sockets: Math.max(0, Math.round(48 * frac)),
          workers: Math.max(0, Math.round(6 * frac)),
          queueConsumers: Math.max(0, Math.round(3 * frac)),
        });
      }
    }, 200);
  }

  private forceExit(): void {
    if (this.status() === 'EXITED') return;
    this.status.set('EXITED');
    this.requests.update((list) =>
      list.map((r) => (r.state === 'ACTIVE' || r.state === 'WAITING' ? { ...r, state: 'CANCELLED' as ReqState } : r)),
    );
    this.resources.set({ db: 0, sockets: 0, workers: 0, queueConsumers: 0 });
    if (this.deadlineTimer) {
      clearInterval(this.deadlineTimer);
      this.deadlineTimer = null;
    }
    if (this.liveTimer) {
      clearInterval(this.liveTimer);
      this.liveTimer = null;
    }
    for (const t of this.workTimers) clearTimeout(t);
    this.workTimers = [];
  }

  protected reset(): void {
    this.clearAllTimers();
    this.status.set('RUNNING');
    this.signal_.set(null);
    this.deadlineRemaining.set(20);
    this.requests.set(buildRequests());
    this.selectedId.set(null);
    this.resources.set({ db: 12, sockets: 48, workers: 6, queueConsumers: 3 });
  }

  private clearAllTimers(): void {
    if (this.deadlineTimer) {
      clearInterval(this.deadlineTimer);
      this.deadlineTimer = null;
    }
    if (this.liveTimer) {
      clearInterval(this.liveTimer);
      this.liveTimer = null;
    }
    for (const t of this.workTimers) clearTimeout(t);
    this.workTimers = [];
  }
}

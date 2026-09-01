import { Component, OnDestroy, computed, signal } from '@angular/core';

type Mode = 'no-pool' | 'pooled';
type SlotState = 'idle' | 'open' | 'query' | 'close';

interface Slot {
  id: number;
  state: SlotState;
}

const CONNECTION_OPEN_MS = 40;
const CONNECTION_CLOSE_MS = 15;

@Component({
  selector: 'app-connection-pooling',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="connection-pooling">
      <div class="container">
        <p class="lab-index">13 — CONNECTION POOLING</p>
        <h2 class="lab-title">Opening a database connection is expensive. Stop paying for it every request.</h2>
        <p class="lab-lede">
          Establishing a fresh TCP connection, doing a handshake, and authenticating against the database can
          cost tens of milliseconds — often more than the query itself. A connection pool keeps a set of
          already-open connections ready to borrow, so requests skip that setup cost entirely.
        </p>

        <div class="lab-btn-row" role="group" aria-label="Pooling mode">
          <button
            type="button"
            class="lab-btn lab-btn-danger"
            [class.is-active]="mode() === 'no-pool'"
            [attr.aria-pressed]="mode() === 'no-pool'"
            (click)="mode.set('no-pool')"
          >
            Without pooling
          </button>
          <button
            type="button"
            class="lab-btn lab-btn-primary"
            [class.is-active]="mode() === 'pooled'"
            [attr.aria-pressed]="mode() === 'pooled'"
            (click)="mode.set('pooled')"
          >
            With pooling
          </button>
        </div>

        <div class="lab-panel">
          @if (mode() === 'no-pool') {
            <div class="request-lane" aria-label="Per-request connection lifecycle">
              @for (r of noPoolRequests(); track r.id) {
                <div class="req-row">
                  <span class="req-label mono">req {{ r.id }}</span>
                  <div class="steps">
                    <span class="step step-crit" [class.is-active]="r.step === 'open'">open ({{ connOpenMs }}ms)</span>
                    <span class="lab-flow-arrow">&rarr;</span>
                    <span class="step step-ok" [class.is-active]="r.step === 'query'">query ({{ queryDuration() }}ms)</span>
                    <span class="lab-flow-arrow">&rarr;</span>
                    <span class="step step-crit" [class.is-active]="r.step === 'close'">close ({{ connCloseMs }}ms)</span>
                  </div>
                </div>
              }
            </div>
            <p class="lab-note-warn lab-note overhead-note">
              Every request pays <strong>{{ connOpenMs + connCloseMs }}ms</strong> of pure connection overhead
              before/after its actual query — highlighted in <span class="crit-text">red</span>.
            </p>
          } @else {
            <div class="pool-visual" aria-label="Connection pool slots">
              <p class="lab-node">POOL (SIZE {{ poolSize() }})</p>
              <div class="slot-row">
                @for (s of poolSlots(); track s.id) {
                  <div class="slot" [class.is-busy]="s.state !== 'idle'" [attr.aria-label]="'slot ' + s.id + ' ' + s.state"></div>
                }
              </div>
              <p class="pool-caption mono">filled = in use &middot; empty = available</p>
            </div>
          }

          <div class="controls-grid">
            <label class="lab-field">
              <span>Pool size: {{ poolSize() }}</span>
              <input
                type="range" min="1" max="10" step="1"
                [value]="poolSize()"
                (input)="poolSize.set(toNum($event))"
                [attr.aria-valuenow]="poolSize()"
              />
            </label>
            <label class="lab-field">
              <span>Request rate: {{ requestRate() }} req/s</span>
              <input
                type="range" min="10" max="200" step="5"
                [value]="requestRate()"
                (input)="requestRate.set(toNum($event))"
                [attr.aria-valuenow]="requestRate()"
              />
            </label>
            <label class="lab-field">
              <span>Query duration: {{ queryDuration() }}ms</span>
              <input
                type="range" min="5" max="200" step="5"
                [value]="queryDuration()"
                (input)="queryDuration.set(toNum($event))"
                [attr.aria-valuenow]="queryDuration()"
              />
            </label>
          </div>

          <div class="stat-grid">
            <div class="stat">
              <p class="stat-label mono">AVAILABLE CONNECTIONS</p>
              <p class="stat-value mono is-ok">
                {{ mode() === 'pooled' ? Math.max(0, poolSize() - concurrentInFlight()) : 'n/a (new every time)' }}
              </p>
            </div>
            <div class="stat">
              <p class="stat-label mono">WAITING REQUESTS</p>
              <p class="stat-value mono" [class.is-danger]="waitingRequests() > 0">
                {{ mode() === 'pooled' ? waitingRequests() : '—' }}
              </p>
            </div>
            <div class="stat">
              <p class="stat-label mono">CONNECTION CREATION</p>
              <p class="stat-value mono" [class.is-danger]="mode() === 'no-pool'" [class.is-ok]="mode() === 'pooled'">
                {{ mode() === 'no-pool' ? requestRate() + '/s (every request)' : poolSize() + ' total (reused)' }}
              </p>
            </div>
          </div>

          <p class="lab-note">
            Concurrent in-flight work &asymp; request rate &times; query duration &asymp;
            <strong>{{ concurrentInFlight().toFixed(1) }}</strong> requests at once. When that exceeds the pool
            size ({{ poolSize() }}), extra requests queue and wait for a slot to free up — a pool is bounded, not
            magic. Right now:
            @if (waitingRequests() > 0) {
              <strong class="crit-text">requests are queuing.</strong>
            } @else {
              <strong class="ok-text">the pool keeps up, no queue forms.</strong>
            }
          </p>
        </div>

        <p class="lab-note lab-note-warn">
          Pooling avoids repeatedly paying the cost of establishing a new connection — but it doesn't remove
          capacity limits. A pool that's too small for real demand still causes requests to wait, just like an
          understaffed queue.
        </p>
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
    }

    .request-lane { display: flex; flex-direction: column; gap: 10px; }
    .req-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .req-label { font-size: 0.75rem; color: var(--text-faint); width: 56px; flex-shrink: 0; }
    .steps { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-family: var(--font-mono); font-size: 0.75rem; }
    .step { padding: 4px 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); color: var(--text-faint); transition: all 0.15s ease; }
    .step-crit.is-active { background: color-mix(in srgb, var(--crit) 20%, var(--surface)); border-color: var(--crit); color: var(--crit); font-weight: 700; }
    .step-ok.is-active { background: color-mix(in srgb, var(--ok) 20%, var(--surface)); border-color: var(--ok); color: var(--ok); font-weight: 700; }

    .overhead-note { margin-top: 20px; }
    .crit-text { color: var(--crit); }
    .ok-text { color: var(--ok); }

    .pool-visual { padding: 4px 0; }
    .slot-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
    .slot { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--c-db); background: transparent; transition: background 0.2s ease, box-shadow 0.2s ease; }
    .slot.is-busy { background: var(--c-db); box-shadow: 0 0 8px var(--c-db); }
    .pool-caption { margin-top: 10px; font-size: 0.75rem; color: var(--text-faint); }

    .controls-grid { margin-top: 28px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px; }
    .controls-grid input[type='range'] { width: 100%; accent-color: var(--accent); }

    .stat-grid { margin-top: 28px; display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; }
    .stat { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; }
    .stat-label { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--text-faint); }
    .stat-value { margin-top: 6px; font-size: 1.0625rem; font-weight: 700; color: var(--text); }
    .stat-value.is-danger { color: var(--crit); }
    .stat-value.is-ok { color: var(--ok); }
  `,
})
export class ConnectionPooling implements OnDestroy {
  protected readonly Math = Math;
  protected readonly connOpenMs = CONNECTION_OPEN_MS;
  protected readonly connCloseMs = CONNECTION_CLOSE_MS;

  protected readonly mode = signal<Mode>('no-pool');
  protected readonly poolSize = signal(5);
  protected readonly requestRate = signal(50);
  protected readonly queryDuration = signal(20);

  private readonly tick = signal(0);
  private animHandle: ReturnType<typeof setInterval> | null = null;

  protected readonly concurrentInFlight = computed(() => (this.requestRate() * this.queryDuration()) / 1000);

  protected readonly waitingRequests = computed(() => {
    const excess = this.concurrentInFlight() - this.poolSize();
    return excess > 0 ? Math.round(excess) : 0;
  });

  protected readonly poolSlots = computed<Slot[]>(() => {
    const size = this.poolSize();
    const busyCount = Math.min(size, Math.round(this.concurrentInFlight()));
    this.tick(); // depend on animation tick for a subtle live feel
    return Array.from({ length: size }, (_, i) => ({
      id: i + 1,
      state: i < busyCount ? 'query' : 'idle',
    }));
  });

  protected readonly noPoolRequests = computed(() => {
    this.tick();
    const step: SlotState[] = ['open', 'query', 'close'];
    return Array.from({ length: 4 }, (_, i) => ({
      id: i + 1,
      step: step[(this.tick() + i) % step.length],
    }));
  });

  constructor() {
    this.animHandle = setInterval(() => this.tick.update((v) => v + 1), 500);
  }

  protected toNum(ev: Event): number {
    return Number((ev.target as HTMLInputElement).value);
  }

  ngOnDestroy(): void {
    if (this.animHandle) clearInterval(this.animHandle);
  }
}

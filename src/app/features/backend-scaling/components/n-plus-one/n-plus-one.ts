import { Component, OnDestroy, computed, signal } from '@angular/core';

interface UserRow {
  id: number;
  name: string;
}

const USERS: UserRow[] = [
  { id: 1, name: 'alice' },
  { id: 2, name: 'ben' },
  { id: 3, name: 'carla' },
  { id: 4, name: 'dev' },
  { id: 5, name: 'ella' },
  { id: 6, name: 'finn' },
  { id: 7, name: 'gina' },
  { id: 8, name: 'hank' },
  { id: 9, name: 'ines' },
];

const REAL_USER_COUNT = 100;
const PER_QUERY_MS = 34;
const BATCH_QUERY_MS = 45;

type Phase = 'idle' | 'running' | 'done';

@Component({
  selector: 'app-n-plus-one',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="n-plus-one">
      <div class="container">
        <p class="lab-index">11 — THE N+1 QUERY PROBLEM</p>
        <h2 class="lab-title">One query to fetch a list. Then one more per row, by accident.</h2>
        <p class="lab-lede">
          Picture an endpoint that returns {{ realUserCount }} users, each with their recent orders. Loop over
          the users in application code and fetch <code class="mono">orders WHERE user_id = ?</code> inside the
          loop, and you've just turned 1 query into {{ realUserCount }} + 1. Below, {{ users.length }} users
          stand in for the {{ realUserCount }} — the shape of the problem is identical, just rendered at a size
          you can actually watch.
        </p>

        <div class="lab-btn-row" role="group" aria-label="N+1 mode">
          <button
            type="button"
            class="lab-btn lab-btn-danger"
            [class.is-active]="mode() === 'n-plus-one'"
            [attr.aria-pressed]="mode() === 'n-plus-one'"
            (click)="setMode('n-plus-one')"
          >
            N+1 queries: ON
          </button>
          <button
            type="button"
            class="lab-btn lab-btn-primary"
            [class.is-active]="mode() === 'batched'"
            [attr.aria-pressed]="mode() === 'batched'"
            (click)="setMode('batched')"
          >
            N+1 queries: OFF (batched)
          </button>
          <button type="button" class="lab-btn" (click)="replay()">Replay</button>
        </div>

        <div class="lab-panel">
          <div class="flow-row">
            <div class="flow-node">
              <p class="lab-node">API SERVER</p>
              <div class="node-box" [class.is-pulsing]="phase() === 'running'">API</div>
            </div>

            <div class="flow-track" [attr.aria-label]="'query pulses, ' + firedCount() + ' of ' + totalQueries()">
              <div class="track-line"></div>
              @for (q of visiblePulses(); track q.id) {
                <div
                  class="pulse"
                  [class.pulse-danger]="mode() === 'n-plus-one'"
                  [class.pulse-ok]="mode() === 'batched'"
                  [style.left.%]="q.progress"
                ></div>
              }
            </div>

            <div class="flow-node">
              <p class="lab-node">DATABASE</p>
              <div class="node-box node-db" [class.is-pulsing]="phase() === 'running'">DB</div>
            </div>
          </div>

          <div class="counter-row mono">
            <span class="counter-label">DB round trips fired:</span>
            <span class="counter-value" [class.is-danger]="mode() === 'n-plus-one'" [class.is-ok]="mode() === 'batched'">
              {{ firedCount() }} / {{ totalQueries() }}
            </span>
          </div>

          <div class="user-grid" role="list" [attr.aria-label]="'users, ' + users.length">
            @for (u of users; track u.id) {
              <div class="user-chip mono" role="listitem" [class.is-fetched]="isUserFetched(u.id)">
                {{ u.name }}
                @if (isUserFetched(u.id)) {
                  <span class="chip-check">&#10003;</span>
                }
              </div>
            }
          </div>

          <div class="stat-grid">
            <div class="stat">
              <p class="stat-label mono">DB ROUND TRIPS</p>
              <p class="stat-value mono" [class.is-danger]="mode() === 'n-plus-one'" [class.is-ok]="mode() === 'batched'">
                {{ phase() === 'idle' ? '—' : firedCount() }}
              </p>
            </div>
            <div class="stat">
              <p class="stat-label mono">TOTAL DURATION</p>
              <p class="stat-value mono" [class.is-danger]="mode() === 'n-plus-one'" [class.is-ok]="mode() === 'batched'">
                {{ phase() === 'idle' ? '—' : elapsedMs() + 'ms' }}
              </p>
            </div>
            <div class="stat">
              <p class="stat-label mono">ROWS PROCESSED</p>
              <p class="stat-value mono">{{ phase() === 'idle' ? '—' : rowsProcessed() }}</p>
            </div>
          </div>

          @if (phase() === 'done') {
            <p class="result-line mono" [class.is-danger]="mode() === 'n-plus-one'" [class.is-ok]="mode() === 'batched'">
              {{ totalQueries() }} {{ totalQueries() === 1 ? 'query' : 'queries' }} &middot; {{ elapsedMs() }}ms
            </p>
          }
        </div>

        <p class="lab-note lab-note-warn">
          <strong>What causes it:</strong> fetching a list (1 query), then looping over that list and issuing a
          separate query per item to get related data — N extra round trips for N rows.
        </p>
        <p class="lab-note">
          <strong>The fix:</strong> replace the per-row queries with a single batched query
          (<code class="mono">WHERE user_id IN (...)</code>) or a JOIN / eager-loading call, so related data
          comes back in one round trip regardless of how many rows there are.
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

    .flow-row { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 16px; }
    .flow-node { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .node-box {
      width: 64px; height: 64px; border-radius: var(--radius-md);
      background: var(--surface-elevated); border: 1px solid var(--border-strong);
      display: flex; align-items: center; justify-content: center;
      font-family: var(--font-mono); font-weight: 700; font-size: 0.8125rem; color: var(--text);
      transition: box-shadow 0.2s ease, border-color 0.2s ease;
    }
    .node-db { border-color: var(--c-db); color: var(--c-db); }
    .node-box.is-pulsing { border-color: var(--accent); box-shadow: 0 0 0 4px transparent; animation: node-pulse 0.9s ease-in-out infinite; }
    @keyframes node-pulse {
      0%, 100% { box-shadow: 0 0 0 0 var(--glow-accent); }
      50% { box-shadow: 0 0 0 8px transparent; }
    }

    .flow-track { position: relative; height: 6px; }
    .track-line { position: absolute; inset: 0; top: 50%; height: 2px; transform: translateY(-50%); background: var(--border-strong); }
    .pulse {
      position: absolute; top: 50%; width: 10px; height: 10px; border-radius: 50%;
      transform: translate(-50%, -50%); transition: left 0.28s linear;
    }
    .pulse-danger { background: var(--crit); box-shadow: 0 0 8px var(--crit); }
    .pulse-ok { background: var(--ok); box-shadow: 0 0 8px var(--ok); }

    .counter-row { display: flex; align-items: center; gap: 10px; margin-top: 24px; font-size: 0.875rem; }
    .counter-label { color: var(--text-muted); }
    .counter-value { font-weight: 700; color: var(--text); }
    .counter-value.is-danger { color: var(--crit); }
    .counter-value.is-ok { color: var(--ok); }

    .user-grid { margin-top: 20px; display: flex; flex-wrap: wrap; gap: 8px; }
    .user-chip {
      font-size: 0.75rem; padding: 6px 10px; border-radius: var(--radius-sm);
      border: 1px solid var(--border-strong); color: var(--text-faint); background: var(--surface);
      display: inline-flex; align-items: center; gap: 6px; transition: color 0.2s ease, border-color 0.2s ease;
    }
    .user-chip.is-fetched { color: var(--text); border-color: var(--c-compute); }
    .chip-check { color: var(--ok); font-weight: 700; }

    .stat-grid { margin-top: 28px; display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; }
    .stat { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; }
    .stat-label { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--text-faint); }
    .stat-value { margin-top: 6px; font-size: 1.375rem; font-weight: 700; color: var(--text); }
    .stat-value.is-danger { color: var(--crit); }
    .stat-value.is-ok { color: var(--ok); }

    .result-line { margin-top: 18px; font-size: 1rem; font-weight: 700; }
    .result-line.is-danger { color: var(--crit); }
    .result-line.is-ok { color: var(--ok); }
  `,
})
export class NPlusOne implements OnDestroy {
  protected readonly users = USERS;
  protected readonly realUserCount = REAL_USER_COUNT;

  protected readonly mode = signal<'n-plus-one' | 'batched'>('n-plus-one');
  protected readonly phase = signal<Phase>('idle');
  protected readonly firedCount = signal(0);
  protected readonly fetchedUserIds = signal<Set<number>>(new Set());
  protected readonly visiblePulses = signal<{ id: number; progress: number }[]>([]);

  private timers: ReturnType<typeof setTimeout>[] = [];

  protected readonly totalQueries = computed(() => (this.mode() === 'n-plus-one' ? this.users.length + 1 : 1));

  protected readonly elapsedMs = computed(() =>
    this.mode() === 'n-plus-one' ? this.users.length * PER_QUERY_MS + BATCH_QUERY_MS : BATCH_QUERY_MS,
  );

  protected readonly rowsProcessed = computed(() => this.users.length);

  constructor() {
    this.run();
  }

  protected setMode(m: 'n-plus-one' | 'batched'): void {
    if (this.mode() === m) return;
    this.mode.set(m);
    this.run();
  }

  protected replay(): void {
    this.run();
  }

  protected isUserFetched(id: number): boolean {
    return this.fetchedUserIds().has(id);
  }

  private clearTimers(): void {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  private schedule(fn: () => void, delay: number): void {
    const handle = setTimeout(fn, delay);
    this.timers.push(handle);
  }

  private run(): void {
    this.clearTimers();
    this.firedCount.set(0);
    this.fetchedUserIds.set(new Set());
    this.visiblePulses.set([]);
    this.phase.set('running');

    if (this.mode() === 'batched') {
      // Single query fetches users + orders together (JOIN / batched IN-query).
      this.schedule(() => {
        this.visiblePulses.set([{ id: 0, progress: 0 }]);
        this.schedule(() => this.visiblePulses.set([{ id: 0, progress: 100 }]), 20);
      }, 20);
      this.schedule(() => {
        this.firedCount.set(1);
        this.fetchedUserIds.set(new Set(this.users.map((u) => u.id)));
        this.phase.set('done');
      }, BATCH_QUERY_MS + 60);
      return;
    }

    // N+1: one query for the user list, then one query per user, in sequence.
    this.schedule(() => {
      this.visiblePulses.set([{ id: -1, progress: 0 }]);
      this.schedule(() => this.visiblePulses.set([{ id: -1, progress: 100 }]), 15);
    }, 10);

    this.schedule(() => {
      this.firedCount.set(1);
    }, PER_QUERY_MS);

    this.users.forEach((u, index) => {
      const start = PER_QUERY_MS + index * PER_QUERY_MS;
      this.schedule(() => {
        this.visiblePulses.set([{ id: u.id, progress: 0 }]);
        this.schedule(() => this.visiblePulses.set([{ id: u.id, progress: 100 }]), Math.min(18, PER_QUERY_MS - 4));
      }, start);
      this.schedule(() => {
        this.firedCount.set(2 + index);
        this.fetchedUserIds.update((set) => new Set(set).add(u.id));
      }, start + PER_QUERY_MS);
    });

    this.schedule(() => {
      this.phase.set('done');
      this.visiblePulses.set([]);
    }, PER_QUERY_MS * (this.users.length + 1) + 40);
  }
}

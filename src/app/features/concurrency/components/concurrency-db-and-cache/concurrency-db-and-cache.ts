import { Component, OnDestroy, signal } from '@angular/core';

const POOL_SIZE = 5;
const REQUEST_COUNT = 100;
const TICK_MS = 100;
const CONN_HOLD_MS = [400, 900] as const;

const STAMPEDE_DB_DELAY_MS = 1400;

interface PoolRequest {
  id: number;
  remainingMs: number;
}

@Component({
  selector: 'app-concurrency-db-and-cache',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="concurrency-db-and-cache">
      <div class="container">
        <p class="lab-index">37-38 — CONCURRENCY, DATABASES &amp; CACHES</p>
        <h2 class="lab-title">Concurrency, databases and caches</h2>
        <p class="lab-lede">
          Application-layer concurrency does not automatically translate into database-layer concurrency. A
          connection pool, and a cache that everyone reads from, are both shared resources with their own limits.
        </p>

        <div class="lab-panel">
          <p class="lab-node">API LAYER: {{ requestCount }} CONCURRENT REQUESTS &rarr; DB POOL ({{ poolSize }} CONNECTIONS)</p>

          <div class="pool-grid">
            @for (conn of poolSlots(); track $index) {
              <div class="conn-slot" [class.is-busy]="conn"></div>
            }
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="sendPoolRequests()" [disabled]="poolRunning()">
              {{ poolRunning() ? 'In flight...' : 'Send ' + requestCount + ' requests' }}
            </button>
            <button type="button" class="lab-btn" (click)="resetPool()">Reset</button>
          </div>

          <div class="stat-row">
            <div class="stat">
              <span class="stat-label mono">CONNECTED</span>
              <span class="stat-value mono">{{ connectedCount() }} / {{ poolSize }}</span>
            </div>
            <div class="stat">
              <span class="stat-label mono">WAITING</span>
              <span class="stat-value mono" [class.stat-warn]="waitingCount() > 0">{{ waitingCount() }}</span>
            </div>
            <div class="stat">
              <span class="stat-label mono">COMPLETED</span>
              <span class="stat-value mono">{{ poolCompletedCount() }} / {{ requestCount }}</span>
            </div>
          </div>

          <p class="lab-note">
            The API can happily accept {{ requestCount }} concurrent requests, but the database only handed out
            {{ poolSize }} connections. Concurrency at the application layer does not mean unlimited concurrency
            at the database — pools, contention, and connection limits are real, physical constraints downstream
            of however many requests your app thinks it can juggle.
          </p>
        </div>

        <div class="lab-panel">
          <p class="lab-node">CACHE STAMPEDE — {{ requestCount }} CONCURRENT REQUESTS, SAME KEY, CACHE MISS</p>

          <div class="lab-btn-row" role="group" aria-label="Request coalescing">
            <button
              type="button"
              class="lab-btn"
              [class.is-active]="coalescing()"
              [attr.aria-pressed]="coalescing()"
              (click)="toggleCoalescing()"
            >
              Request coalescing: {{ coalescing() ? 'ON' : 'OFF' }}
            </button>
          </div>

          <div class="stampede-diagram">
            <div class="stampede-clients">
              @for (c of stampedeClients(); track $index) {
                <div class="client-dot" [class.is-waiting]="c === 'waiting'" [class.is-querying]="c === 'querying'" [class.is-done]="c === 'done'"></div>
              }
            </div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="db-node" [class.is-hot]="dbHitsThisRun() > 1 && stampedeState() === 'querying'">
              <span class="node-label mono">DATABASE</span>
              <span class="node-value mono">{{ dbHitsThisRun() }} hit{{ dbHitsThisRun() === 1 ? '' : 's' }}</span>
              @if (dbHitsThisRun() > 1 && stampedeState() === 'querying') {
                <span class="pill pill-no">HAMMERED</span>
              } @else if (stampedeState() === 'querying') {
                <span class="pill pill-conditional">QUERYING</span>
              } @else if (stampedeState() === 'done') {
                <span class="pill pill-yes">CACHE POPULATED</span>
              } @else {
                <span class="pill">IDLE</span>
              }
            </div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="triggerStampede()" [disabled]="stampedeState() !== 'idle' && stampedeState() !== 'done'">
              Trigger cache miss
            </button>
          </div>

          <p class="lab-code" aria-live="polite">
            @if (stampedeState() === 'idle') {
              cache empty for this key, waiting to trigger
            } @else if (!coalescing() && stampedeState() === 'querying') {
              all {{ requestCount }} requests missed the cache and are hitting the database at once
            } @else if (coalescing() && stampedeState() === 'querying') {
              only 1 request is querying the database — the other {{ requestCount - 1 }} are waiting on that
              in-flight result
            } @else if (stampedeState() === 'done') {
              {{ coalescing() ? 'the single DB result was shared with every waiting request, and the cache is now warm for everyone' : 'the cache is now populated, but it cost ' + requestCount + ' redundant database queries to get there' }}
            }
          </p>

          <p class="lab-note">
            Without coalescing, a popular key expiring under load means every one of the {{ requestCount }}
            concurrent requests misses the cache and queries the database simultaneously — a thundering herd.
            With coalescing, only the first request actually queries the database; every other request in flight
            waits for and shares that single result, and the cache is populated once for everyone.
          </p>
          <p class="lab-note">
            Coalescing handles the herd once it starts. Prewarming a cache before it goes cold, and choosing an
            expiration strategy that staggers TTLs instead of expiring everything at once, both reduce how often
            a stampede has the chance to start in the first place.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .pool-grid { margin-top: 18px; display: flex; gap: 8px; flex-wrap: wrap; }
    .conn-slot {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--surface-raised);
      transition: background 0.15s ease, border-color 0.15s ease;
    }
    .conn-slot.is-busy { background: var(--c-cpu); border-color: var(--c-cpu); }

    .stat-row { margin-top: 22px; display: grid; grid-template-columns: repeat(1, 1fr); gap: 12px; }
    @media (min-width: 640px) { .stat-row { grid-template-columns: repeat(3, 1fr); } }
    .stat { display: flex; flex-direction: column; gap: 6px; padding: 12px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .stat-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.08em; }
    .stat-value { font-size: 1.125rem; color: var(--running); }
    .stat-value.stat-warn { color: var(--waiting); }

    .stampede-diagram { margin-top: 20px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
    .stampede-clients { flex: 1; min-width: 220px; display: flex; flex-wrap: wrap; gap: 5px; }
    .client-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--idle); transition: background 0.15s ease; }
    .client-dot.is-waiting { background: var(--waiting); }
    .client-dot.is-querying { background: var(--c-lock); }
    .client-dot.is-done { background: var(--running); }

    .db-node {
      min-width: 140px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 14px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
      transition: border-color 0.2s ease, background 0.2s ease;
    }
    .db-node.is-hot { border-color: var(--blocked); background: color-mix(in srgb, var(--blocked) 10%, var(--surface)); }
    .node-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.08em; }
    .node-value { font-size: 1.0625rem; color: var(--text); }
  `,
})
export class ConcurrencyDbAndCache implements OnDestroy {
  protected readonly poolSize = POOL_SIZE;
  protected readonly requestCount = REQUEST_COUNT;

  // --- connection pool ---
  protected readonly poolRunning = signal(false);
  protected readonly connectedCount = signal(0);
  protected readonly waitingCount = signal(0);
  protected readonly poolCompletedCount = signal(0);
  protected readonly poolSlots = signal<boolean[]>(Array(POOL_SIZE).fill(false));

  private poolQueue: PoolRequest[] = [];
  private poolActive: (PoolRequest | null)[] = Array(POOL_SIZE).fill(null);
  private poolIntervalId: ReturnType<typeof setInterval> | null = null;
  private poolNextId = 1;

  // --- cache stampede ---
  protected readonly coalescing = signal(false);
  protected readonly stampedeState = signal<'idle' | 'querying' | 'done'>('idle');
  protected readonly dbHitsThisRun = signal(0);
  protected readonly stampedeClients = signal<('waiting' | 'querying' | 'done')[]>(Array(REQUEST_COUNT).fill('waiting'));
  private stampedeTimeoutId: ReturnType<typeof setTimeout> | null = null;

  ngOnDestroy(): void {
    this.clearPoolInterval();
    this.clearStampedeTimeout();
  }

  // --- connection pool logic ---

  protected sendPoolRequests(): void {
    this.clearPoolInterval();
    this.poolQueue = Array.from({ length: REQUEST_COUNT }, () => ({ id: this.poolNextId++, remainingMs: 0 }));
    this.poolActive = Array(POOL_SIZE).fill(null);
    this.poolCompletedCount.set(0);
    this.poolRunning.set(true);
    this.updatePoolCounts();

    this.poolIntervalId = setInterval(() => this.poolTick(), TICK_MS);
  }

  private poolTick(): void {
    for (let i = 0; i < this.poolActive.length; i++) {
      const req = this.poolActive[i];
      if (!req) continue;
      req.remainingMs -= TICK_MS;
      if (req.remainingMs <= 0) {
        this.poolCompletedCount.update((v) => v + 1);
        this.poolActive[i] = null;
      }
    }

    for (let i = 0; i < this.poolActive.length; i++) {
      if (this.poolActive[i] === null && this.poolQueue.length > 0) {
        const req = this.poolQueue.shift()!;
        req.remainingMs = CONN_HOLD_MS[0] + Math.random() * (CONN_HOLD_MS[1] - CONN_HOLD_MS[0]);
        this.poolActive[i] = req;
      }
    }

    this.updatePoolCounts();

    const stillRunning = this.poolActive.some((r) => r !== null);
    if (this.poolQueue.length === 0 && !stillRunning) {
      this.clearPoolInterval();
      this.poolRunning.set(false);
    }
  }

  private updatePoolCounts(): void {
    this.connectedCount.set(this.poolActive.filter((r) => r !== null).length);
    this.waitingCount.set(this.poolQueue.length);
    this.poolSlots.set(this.poolActive.map((r) => r !== null));
  }

  private clearPoolInterval(): void {
    if (this.poolIntervalId) {
      clearInterval(this.poolIntervalId);
      this.poolIntervalId = null;
    }
  }

  protected resetPool(): void {
    this.clearPoolInterval();
    this.poolRunning.set(false);
    this.poolQueue = [];
    this.poolActive = Array(POOL_SIZE).fill(null);
    this.connectedCount.set(0);
    this.waitingCount.set(0);
    this.poolCompletedCount.set(0);
    this.poolSlots.set(Array(POOL_SIZE).fill(false));
  }

  // --- cache stampede logic ---

  protected toggleCoalescing(): void {
    this.coalescing.set(!this.coalescing());
  }

  protected triggerStampede(): void {
    this.clearStampedeTimeout();
    this.stampedeState.set('querying');

    if (this.coalescing()) {
      this.dbHitsThisRun.set(1);
      this.stampedeClients.set(Array(REQUEST_COUNT).fill('waiting'));
    } else {
      this.dbHitsThisRun.set(REQUEST_COUNT);
      this.stampedeClients.set(Array(REQUEST_COUNT).fill('querying'));
    }

    this.stampedeTimeoutId = setTimeout(() => {
      this.stampedeState.set('done');
      this.stampedeClients.set(Array(REQUEST_COUNT).fill('done'));
    }, STAMPEDE_DB_DELAY_MS);
  }

  private clearStampedeTimeout(): void {
    if (this.stampedeTimeoutId) {
      clearTimeout(this.stampedeTimeoutId);
      this.stampedeTimeoutId = null;
    }
  }
}

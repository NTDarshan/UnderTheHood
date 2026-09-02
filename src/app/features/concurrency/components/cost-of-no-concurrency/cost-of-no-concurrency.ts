import { Component, OnDestroy, computed, signal } from '@angular/core';

type ServerMode = 'sequential' | 'concurrent';
type RequestPhase = 'waiting' | 'db' | 'cpu' | 'done';

interface SimRequest {
  readonly id: number;
  phase: RequestPhase;
  progressMs: number;
}

const RATE_OPTIONS = [5, 20, 50] as const;
type Rate = (typeof RATE_OPTIONS)[number];

// Every request: brief CPU work, then a DB wait, then brief CPU work to finish.
const CPU_MS = 60;
const DB_MS = 240;
const TOTAL_REQUEST_MS = CPU_MS + DB_MS + CPU_MS;

const CONCURRENT_IN_FLIGHT_CAP = 12; // how many requests the concurrent server juggles at once
const TICK_MS = 40;

@Component({
  selector: 'app-cost-of-no-concurrency',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="cost-of-no-concurrency">
      <div class="container">
        <p class="lab-index mono">07 — THE COST OF NOT USING CONCURRENCY</p>
        <h2 class="lab-title">The cost of not using concurrency</h2>
        <p class="lab-lede">
          Every request does the same work: a little CPU time, then a wait on the database, then a little more CPU
          time. Turn up the request rate and watch what a server that can only handle one request at a time does
          to the queue — next to one that can juggle many requests while some of them wait.
        </p>

        <div class="lab-panel">
          <div class="lab-field">
            <label id="rate-label">INCOMING REQUESTS / SEC</label>
            <div class="lab-btn-row" role="group" aria-labelledby="rate-label">
              @for (r of rateOptions; track r) {
                <button
                  type="button"
                  class="lab-btn"
                  [class.is-active]="rate() === r"
                  [attr.aria-pressed]="rate() === r"
                  (click)="setRate(r)"
                >
                  {{ r }}/s
                </button>
              }
            </div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="isRunning()" (click)="run()">
              {{ isRunning() ? 'Running…' : 'Run' }}
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <div class="server-grid">
            <div class="server-card">
              <div class="server-head mono">
                <span class="server-title seq-title">SEQUENTIAL SERVER</span>
                <span class="mono">1 request at a time</span>
              </div>
              <p class="server-desc">
                Each request fully completes — CPU, DB wait, CPU, response — before the next one even starts.
              </p>

              <div class="in-flight-row">
                <span class="mono row-label">IN FLIGHT</span>
                <div class="slot-track">
                  @for (r of sequentialInFlight(); track r.id) {
                    <span class="slot mono" [class]="'phase-' + r.phase">#{{ r.id }}</span>
                  } @empty {
                    <span class="slot-empty mono">idle</span>
                  }
                </div>
              </div>

              <div class="queue-row" aria-live="polite">
                <span class="mono row-label">QUEUE DEPTH</span>
                <div class="queue-bar">
                  <div class="queue-fill seq-fill" [style.width.%]="queuePct(sequentialQueueDepth())"></div>
                </div>
                <span class="mono queue-value">{{ sequentialQueueDepth() }} waiting</span>
              </div>
            </div>

            <div class="server-card">
              <div class="server-head mono">
                <span class="server-title con-title">CONCURRENT SERVER</span>
                <span class="mono">up to {{ CONCURRENT_IN_FLIGHT_CAP }} in flight</span>
              </div>
              <p class="server-desc">
                While some requests wait on the database, the server keeps accepting and progressing others instead
                of blocking on any single one.
              </p>

              <div class="in-flight-row">
                <span class="mono row-label">IN FLIGHT</span>
                <div class="slot-track">
                  @for (r of concurrentInFlight(); track r.id) {
                    <span class="slot mono" [class]="'phase-' + r.phase">#{{ r.id }}</span>
                  } @empty {
                    <span class="slot-empty mono">idle</span>
                  }
                </div>
              </div>

              <div class="queue-row" aria-live="polite">
                <span class="mono row-label">QUEUE DEPTH</span>
                <div class="queue-bar">
                  <div class="queue-fill con-fill" [style.width.%]="queuePct(concurrentQueueDepth())"></div>
                </div>
                <span class="mono queue-value">{{ concurrentQueueDepth() }} waiting</span>
              </div>
            </div>
          </div>

          <div class="legend mono">
            <span class="legend-item"><span class="legend-swatch phase-cpu"></span>CPU</span>
            <span class="legend-item"><span class="legend-swatch phase-db"></span>WAITING ON DB</span>
          </div>

          <div class="stat-pair">
            <div class="stat-card">
              <span class="stat-card-label mono">COMPLETED</span>
              <span class="stat-card-value mono">{{ sequentialCompleted() }} / {{ concurrentCompleted() }}</span>
              <span class="stat-card-sub">sequential / concurrent, same elapsed time</span>
            </div>
            <div class="stat-card">
              <span class="stat-card-label mono">PEAK QUEUE DEPTH</span>
              <span class="stat-card-value mono">{{ sequentialPeakQueue() }} / {{ concurrentPeakQueue() }}</span>
              <span class="stat-card-sub">sequential / concurrent, worst case so far</span>
            </div>
          </div>

          <p class="lab-note">
            A concurrent server keeps making progress on other requests while some of them wait on I/O — it never
            has to sit idle just because one request is stuck waiting on the database. Under load, that difference
            compounds: the sequential server's queue grows without bound as the request rate exceeds what it can
            drain one-at-a-time, while the concurrent server absorbs far more throughput before its queue grows at
            all.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .cx-scene {
      --running: #4ade80;
      --waiting: var(--accent);
      --blocked: var(--danger);
      --idle: #64748b;
      --c-cpu: #60a5fa;
      --c-thread: #a78bfa;
      --c-task: var(--accent-2);
      --c-lock: #f472b6;
      --c-queue: #fbbf24;
    }

    .server-grid {
      margin-top: 28px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
    }

    .server-card {
      padding: 18px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .server-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 6px;
      font-size: 0.75rem;
      color: var(--text-faint);
    }

    .server-title {
      font-size: 0.8125rem;
      font-weight: 700;
      letter-spacing: 0.06em;
    }

    .seq-title { color: var(--blocked); }
    .con-title { color: var(--running); }

    .server-desc {
      font-size: 0.8125rem;
      color: var(--text-muted);
      line-height: 1.5;
    }

    .row-label {
      font-size: 0.6875rem;
      color: var(--text-faint);
      letter-spacing: 0.06em;
      display: block;
      margin-bottom: 6px;
    }

    .slot-track {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      min-height: 30px;
    }

    .slot {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 4px 8px;
      border-radius: var(--radius-sm);
      font-size: 0.6875rem;
      font-weight: 700;
      color: #05130a;
    }

    .slot.phase-cpu { background: var(--c-cpu); }
    .slot.phase-db { background: var(--c-queue); }
    .slot.phase-done { background: var(--running); }
    .slot.phase-waiting { background: var(--idle); color: var(--text); }

    .slot-empty {
      font-size: 0.75rem;
      color: var(--text-faint);
    }

    .queue-bar {
      position: relative;
      height: 18px;
      border-radius: var(--radius-sm);
      background: var(--surface-elevated);
      border: 1px solid var(--border-strong);
      overflow: hidden;
    }

    .queue-fill {
      position: absolute;
      inset: 0;
      width: 0%;
      transition: width 0.08s linear;
    }

    .seq-fill { background: linear-gradient(90deg, var(--blocked), #7f1d1d); }
    .con-fill { background: linear-gradient(90deg, var(--running), #14532d); }

    .queue-value {
      display: block;
      margin-top: 6px;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .legend {
      display: flex;
      gap: 18px;
      flex-wrap: wrap;
      margin-top: 16px;
      font-size: 0.6875rem;
      color: var(--text-muted);
    }

    .legend-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .legend-swatch {
      width: 10px;
      height: 10px;
      border-radius: 3px;
      display: inline-block;
    }

    .legend-swatch.phase-cpu { background: var(--c-cpu); }
    .legend-swatch.phase-db { background: var(--c-queue); }

    .stat-pair {
      margin-top: 26px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .stat-card {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 18px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
    }

    .stat-card-label {
      font-size: 0.6875rem;
      letter-spacing: 0.08em;
      color: var(--text-faint);
    }

    .stat-card-value {
      font-size: 1.6rem;
      color: var(--text);
    }

    .stat-card-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    @media (max-width: 720px) {
      .server-grid,
      .stat-pair {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class CostOfNoConcurrency implements OnDestroy {
  protected readonly rateOptions = RATE_OPTIONS;
  protected readonly CONCURRENT_IN_FLIGHT_CAP = CONCURRENT_IN_FLIGHT_CAP;

  protected readonly rate = signal<Rate>(20);
  protected readonly isRunning = signal(false);

  // Sequential server state
  private seqQueue: SimRequest[] = [];
  private seqActive: SimRequest | null = null;
  protected readonly sequentialInFlight = signal<SimRequest[]>([]);
  protected readonly sequentialQueueDepth = signal(0);
  protected readonly sequentialCompleted = signal(0);
  protected readonly sequentialPeakQueue = signal(0);

  // Concurrent server state
  private conQueue: SimRequest[] = [];
  private conActive: SimRequest[] = [];
  protected readonly concurrentInFlight = signal<SimRequest[]>([]);
  protected readonly concurrentQueueDepth = signal(0);
  protected readonly concurrentCompleted = signal(0);
  protected readonly concurrentPeakQueue = signal(0);

  private nextId = 1;
  private msSinceLastArrival = 0;
  private timerId: ReturnType<typeof setInterval> | null = null;

  protected readonly maxQueueForBar = 40;

  protected queuePct(depth: number): number {
    return Math.min(100, (depth / this.maxQueueForBar) * 100);
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  protected setRate(r: Rate): void {
    this.rate.set(r);
  }

  protected run(): void {
    if (this.isRunning()) return;
    this.reset();
    this.isRunning.set(true);

    this.timerId = setInterval(() => {
      const arrivalIntervalMs = 1000 / this.rate();
      this.msSinceLastArrival += TICK_MS;
      while (this.msSinceLastArrival >= arrivalIntervalMs) {
        this.msSinceLastArrival -= arrivalIntervalMs;
        const id = this.nextId++;
        this.seqQueue.push({ id, phase: 'waiting', progressMs: 0 });
        this.conQueue.push({ id, phase: 'waiting', progressMs: 0 });
      }

      this.tickSequential();
      this.tickConcurrent();

      this.sequentialQueueDepth.set(this.seqQueue.length);
      this.concurrentQueueDepth.set(this.conQueue.length);
      this.sequentialPeakQueue.update((p) => Math.max(p, this.seqQueue.length));
      this.concurrentPeakQueue.update((p) => Math.max(p, this.conQueue.length));
      this.sequentialInFlight.set(this.seqActive ? [this.seqActive] : []);
      this.concurrentInFlight.set([...this.conActive]);
    }, TICK_MS);
  }

  protected reset(): void {
    this.clearTimer();
    this.isRunning.set(false);
    this.seqQueue = [];
    this.seqActive = null;
    this.conQueue = [];
    this.conActive = [];
    this.nextId = 1;
    this.msSinceLastArrival = 0;
    this.sequentialInFlight.set([]);
    this.sequentialQueueDepth.set(0);
    this.sequentialCompleted.set(0);
    this.sequentialPeakQueue.set(0);
    this.concurrentInFlight.set([]);
    this.concurrentQueueDepth.set(0);
    this.concurrentCompleted.set(0);
    this.concurrentPeakQueue.set(0);
  }

  private tickSequential(): void {
    if (!this.seqActive && this.seqQueue.length > 0) {
      this.seqActive = this.seqQueue.shift()!;
      this.seqActive.phase = 'cpu';
    }
    if (this.seqActive) {
      this.advance(this.seqActive, TICK_MS);
      if (this.seqActive.phase === 'done') {
        this.sequentialCompleted.update((c) => c + 1);
        this.seqActive = null;
      }
    }
  }

  private tickConcurrent(): void {
    while (this.conActive.length < CONCURRENT_IN_FLIGHT_CAP && this.conQueue.length > 0) {
      const r = this.conQueue.shift()!;
      r.phase = 'cpu';
      this.conActive.push(r);
    }
    for (const r of this.conActive) {
      this.advance(r, TICK_MS);
    }
    const finished = this.conActive.filter((r) => r.phase === 'done').length;
    if (finished > 0) {
      this.concurrentCompleted.update((c) => c + finished);
      this.conActive = this.conActive.filter((r) => r.phase !== 'done');
    }
  }

  private advance(r: SimRequest, deltaMs: number): void {
    r.progressMs += deltaMs;
    if (r.progressMs < CPU_MS) {
      r.phase = 'cpu';
    } else if (r.progressMs < CPU_MS + DB_MS) {
      r.phase = 'db';
    } else if (r.progressMs < TOTAL_REQUEST_MS) {
      r.phase = 'cpu';
    } else {
      r.phase = 'done';
    }
  }

  private clearTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}

import { Component, OnDestroy, signal } from '@angular/core';

const TOTAL_TASKS = 1000;
const TICK_MS = 100;
const BASE_RUN_MS = [280, 480] as const; // min/max simulated work time per task before contention

interface Task {
  id: number;
  remainingMs: number;
  waitedMs: number;
  runMs: number;
}

const CONCURRENCY_OPTIONS = [5, 10, 20, 50, 100];

@Component({
  selector: 'app-concurrency-limiting',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="concurrency-limiting">
      <div class="container">
        <p class="lab-index">36 — CONCURRENCY LIMITING</p>
        <h2 class="lab-title">Concurrency limiting</h2>
        <p class="lab-lede">
          {{ totalTasks }} tasks arrive at once. Only a limited number can run at the same time — the rest wait in
          a queue. Sweep the limit and watch throughput, latency, and resource contention move against each other.
        </p>

        <div class="lab-panel">
          <div class="lab-btn-row" role="group" aria-label="Concurrency limit">
            @for (opt of concurrencyOptions; track opt) {
              <button
                type="button"
                class="lab-btn"
                [class.is-active]="limit() === opt"
                [attr.aria-pressed]="limit() === opt"
                (click)="setLimit(opt)"
              >
                {{ opt }}
              </button>
            }
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="start()" [disabled]="running()">
              {{ running() ? 'Running...' : 'Send ' + totalTasks + ' tasks' }}
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <div class="slots-panel">
            <p class="lab-node">RUNNING SLOTS ({{ limit() }})</p>
            <div class="slots-grid" [style.grid-template-columns]="slotsGridCols()">
              @for (active of slots(); track $index) {
                <div class="slot" [class.is-active]="active"></div>
              }
            </div>
          </div>

          <div class="stat-row">
            <div class="stat">
              <span class="stat-label mono">QUEUED</span>
              <span class="stat-value mono">{{ queuedCount() }}</span>
            </div>
            <div class="stat">
              <span class="stat-label mono">RUNNING</span>
              <span class="stat-value mono">{{ runningCount() }}</span>
            </div>
            <div class="stat">
              <span class="stat-label mono">COMPLETED</span>
              <span class="stat-value mono">{{ completedCount() }} / {{ totalTasks }}</span>
            </div>
            <div class="stat">
              <span class="stat-label mono">THROUGHPUT</span>
              <span class="stat-value mono">{{ throughput() }}/s</span>
            </div>
            <div class="stat">
              <span class="stat-label mono">AVG LATENCY</span>
              <span class="stat-value mono" [class.stat-warn]="contentionPct() > 40" [class.stat-crit]="contentionPct() > 75">
                {{ avgLatencyMs().toFixed(0) }} ms
              </span>
            </div>
            <div class="stat">
              <span class="stat-label mono">RESOURCE CONTENTION</span>
              <span class="stat-value mono" [class.stat-warn]="contentionPct() > 40" [class.stat-crit]="contentionPct() > 75">
                {{ contentionPct().toFixed(0) }}%
              </span>
              <div class="contention-bar-track">
                <div class="contention-bar-fill" [class.is-warn]="contentionPct() > 40" [class.is-crit]="contentionPct() > 75" [style.width.%]="contentionPct()"></div>
              </div>
            </div>
          </div>

          @if (limit() <= 10 && running()) {
            <p class="lab-note">
              Limit is low: slots stay fully busy but capacity is small, so most of the {{ totalTasks }} tasks sit
              queued. Latency here is dominated by wait time, not run time — the resource itself is barely
              contended.
            </p>
          } @else if (limit() >= 50 && running()) {
            <p class="lab-note-warn lab-note">
              Limit is high: almost nothing waits in queue, but this many tasks running at once contend for the
              same CPU/DB/connections, so each task itself runs slower. Latency is climbing from contention, not
              from queueing.
            </p>
          }
        </div>

        <p class="lab-note">
          Nearly every production backend needs an explicit concurrency limit somewhere — a thread pool, a
          connection pool, a semaphore around an expensive call. Too low, and you leave capacity idle while work
          queues up unnecessarily. Too high, and everything running at once starts fighting over the same CPU,
          memory, or database connections, and latency spikes for everyone. The right limit is a measured
          sweet spot, not "as many as possible."
        </p>
      </div>
    </section>
  `,
  styles: `
    .slots-panel { margin-top: 22px; }
    .slots-grid {
      margin-top: 10px;
      display: grid;
      gap: 4px;
      grid-template-columns: repeat(20, 1fr);
    }
    .slot {
      aspect-ratio: 1;
      min-width: 8px;
      border-radius: 2px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      transition: background 0.15s ease, border-color 0.15s ease;
    }
    .slot.is-active { background: var(--c-cpu); border-color: var(--c-cpu); }

    .stat-row { margin-top: 22px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    @media (min-width: 640px) { .stat-row { grid-template-columns: repeat(3, 1fr); } }
    .stat { display: flex; flex-direction: column; gap: 6px; padding: 12px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .stat-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.08em; }
    .stat-value { font-size: 1.125rem; color: var(--running); }
    .stat-value.stat-warn { color: var(--waiting); }
    .stat-value.stat-crit { color: var(--blocked); }

    .contention-bar-track { margin-top: 4px; height: 6px; border-radius: 999px; background: var(--surface-raised); overflow: hidden; }
    .contention-bar-fill { height: 100%; background: var(--running); transition: width 0.15s ease, background 0.15s ease; }
    .contention-bar-fill.is-warn { background: var(--waiting); }
    .contention-bar-fill.is-crit { background: var(--blocked); }
  `,
})
export class ConcurrencyLimiting implements OnDestroy {
  protected readonly totalTasks = TOTAL_TASKS;
  protected readonly concurrencyOptions = CONCURRENCY_OPTIONS;

  protected readonly limit = signal(10);
  protected readonly running = signal(false);

  protected readonly queuedCount = signal(0);
  protected readonly runningCount = signal(0);
  protected readonly completedCount = signal(0);
  protected readonly slots = signal<boolean[]>(Array(10).fill(false));
  protected readonly throughput = signal(0);
  protected readonly avgLatencyMs = signal(0);
  protected readonly contentionPct = signal(0);

  private queue: Task[] = [];
  private active: (Task | null)[] = [];
  private nextId = 1;
  private latencySum = 0;
  private latencyCount = 0;
  private completionsInWindow = 0;
  private simClockMs = 0;

  private tickIntervalId: ReturnType<typeof setInterval> | null = null;
  private throughputIntervalId: ReturnType<typeof setInterval> | null = null;

  protected slotsGridCols(): string {
    const n = this.limit();
    const cols = Math.min(n, n <= 20 ? n : 20);
    return `repeat(${cols}, 1fr)`;
  }

  ngOnDestroy(): void {
    this.clearIntervals();
  }

  protected setLimit(n: number): void {
    this.limit.set(n);
    if (!this.running()) {
      this.slots.set(Array(n).fill(false));
    }
  }

  protected start(): void {
    this.clearIntervals();
    const limit = this.limit();

    this.queue = Array.from({ length: TOTAL_TASKS }, () => ({
      id: this.nextId++,
      remainingMs: 0,
      waitedMs: 0,
      runMs: 0,
    }));
    this.active = Array(limit).fill(null);
    this.latencySum = 0;
    this.latencyCount = 0;
    this.completionsInWindow = 0;
    this.simClockMs = 0;

    this.completedCount.set(0);
    this.avgLatencyMs.set(0);
    this.throughput.set(0);
    this.contentionPct.set(0);
    this.running.set(true);
    this.updateCounts();

    this.tickIntervalId = setInterval(() => this.tick(), TICK_MS);
    this.throughputIntervalId = setInterval(() => {
      this.throughput.set(this.completionsInWindow);
      this.completionsInWindow = 0;
    }, 1000);
  }

  protected reset(): void {
    this.clearIntervals();
    this.running.set(false);
    this.queue = [];
    this.active = [];
    this.queuedCount.set(0);
    this.runningCount.set(0);
    this.completedCount.set(0);
    this.throughput.set(0);
    this.avgLatencyMs.set(0);
    this.contentionPct.set(0);
    this.slots.set(Array(this.limit()).fill(false));
  }

  private clearIntervals(): void {
    if (this.tickIntervalId) {
      clearInterval(this.tickIntervalId);
      this.tickIntervalId = null;
    }
    if (this.throughputIntervalId) {
      clearInterval(this.throughputIntervalId);
      this.throughputIntervalId = null;
    }
  }

  private contentionMultiplier(limit: number): number {
    if (limit <= 20) return 1;
    const over = (limit - 20) / 20;
    return 1 + Math.pow(over, 1.5) * 1.6;
  }

  private tick(): void {
    const limit = this.limit();
    this.simClockMs += TICK_MS;
    const multiplier = this.contentionMultiplier(limit);

    if (this.active.length !== limit) {
      if (this.active.length < limit) {
        this.active = [...this.active, ...Array(limit - this.active.length).fill(null)];
      } else {
        // shrink: keep running tasks in flight, just stop tracking extra empty slots
        this.active = this.active.slice(0, limit);
      }
    }

    for (const t of this.queue) {
      t.waitedMs += TICK_MS;
    }

    for (let i = 0; i < this.active.length; i++) {
      const task = this.active[i];
      if (!task) continue;
      task.remainingMs -= TICK_MS;
      if (task.remainingMs <= 0) {
        this.latencySum += task.waitedMs + task.runMs;
        this.latencyCount += 1;
        this.completionsInWindow += 1;
        this.completedCount.update((v) => v + 1);
        this.active[i] = null;
      }
    }

    for (let i = 0; i < this.active.length; i++) {
      if (this.active[i] === null && this.queue.length > 0) {
        const task = this.queue.shift()!;
        const base = BASE_RUN_MS[0] + Math.random() * (BASE_RUN_MS[1] - BASE_RUN_MS[0]);
        task.runMs = base * multiplier;
        task.remainingMs = task.runMs;
        this.active[i] = task;
      }
    }

    if (this.latencyCount > 0) {
      this.avgLatencyMs.set(this.latencySum / this.latencyCount);
    }
    this.contentionPct.set(Math.min(100, (multiplier - 1) * 45));
    this.updateCounts();

    const stillRunning = this.active.some((t) => t !== null);
    if (this.queue.length === 0 && !stillRunning) {
      this.clearIntervals();
      this.running.set(false);
    }
  }

  private updateCounts(): void {
    this.queuedCount.set(this.queue.length);
    this.runningCount.set(this.active.filter((t) => t !== null).length);
    this.slots.set(this.active.map((t) => t !== null));
  }
}
